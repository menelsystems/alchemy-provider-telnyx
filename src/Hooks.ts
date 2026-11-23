/**
 * Behaviour a handful of resources share beyond plain CRUD, built on
 * alchemy's `poll` and `sha256`, Effect's `FileSystem` (a stack service) and
 * the SDK's typed `NotFound`.
 */
import { NotFound } from "@distilled.cloud/core/errors";
import { poll } from "alchemy/Util/poll";
import { sha256 } from "alchemy/Util/sha256";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";

type Obj = Record<string, unknown>;

/** An object that reached a terminal failure status while we waited for it. */
export class TelnyxProvisioningFailed extends Schema.TaggedError<TelnyxProvisioningFailed>()(
  "TelnyxProvisioningFailed",
  { message: Schema.String },
) {}

/** A local file a resource uploads could not be used. */
export class TelnyxUploadError extends Schema.TaggedError<TelnyxUploadError>()(
  "TelnyxUploadError",
  { message: Schema.String },
) {}

/**
 * Re-read an object until its `status` is ready, failing on a terminal
 * failure status. Bounded: `times` polls `every` apart (default 60 × 5s).
 */
export const waitForStatus = <A extends object, E, R>(
  read: Effect.Effect<A | undefined, E, R>,
  options: {
    readonly ready: ReadonlyArray<string>;
    readonly failed: ReadonlyArray<string>;
    readonly what: string;
    readonly every?: `${number} seconds`;
    readonly times?: number;
  },
) =>
  poll({
    description: `${options.what} to become ${options.ready.filter(Boolean).join(" or ")}`,
    effect: read.pipe(
      Effect.flatMap((obj) => {
        const status = String((obj as Obj | undefined)?.status ?? "");
        return options.failed.includes(status)
          ? Effect.fail(
              new TelnyxProvisioningFailed({
                message: `${options.what} is ${status}; destroy it and create it again`,
              }),
            )
          : Effect.succeed(obj);
      }),
    ),
    predicate: (obj) =>
      obj !== undefined && options.ready.includes(String((obj as Obj).status ?? "")),
    schedule: Schedule.max([
      Schedule.spaced(options.every ?? "5 seconds"),
      Schedule.recurs(options.times ?? 60),
    ]),
  }).pipe(Effect.map((obj) => obj as A));

/** Treat an object the API soft-deletes (still readable with this status) as gone. */
export const goneWithStatus =
  (status: string) =>
  <A>(obj: A): Effect.Effect<A, NotFound> =>
    (obj as Obj | undefined)?.status === status
      ? Effect.fail(new NotFound({ message: `the object is ${status}` }))
      : Effect.succeed(obj);

/** A copy of `obj` with one more field. */
export const withField = <A>(obj: A, name: string, value: unknown): A =>
  ({ ...(obj as Obj), [name]: value }) as A;

/** Replace a list of objects with one field of each (e.g. `phone_numbers[].phone_number`). */
export const pluck = <A>(obj: A, field: string, key: string): A => {
  const items = (obj as Obj)[field];
  if (!Array.isArray(items)) return obj;
  return {
    ...(obj as Obj),
    [field]: items.map((it) => (it && typeof it === "object" ? (it as Obj)[key] : it)),
  } as A;
};

/** Read a local file to upload, checking its extension and size. */
export const readUpload = (
  path: string,
  options: {
    readonly types: Record<string, string>;
    readonly maxBytes: number;
    readonly what: string;
  },
) =>
  Effect.gen(function* () {
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    const contentType = options.types[ext];
    if (!contentType) {
      return yield* new TelnyxUploadError({
        message: `${path}: the ${options.what} must be a ${Object.keys(options.types).join(", ")} file`,
      });
    }
    const fs = yield* FileSystem.FileSystem;
    const bytes = yield* fs
      .readFile(path)
      .pipe(
        Effect.mapError(
          (e) => new TelnyxUploadError({ message: `unable to read ${path}: ${e.message}` }),
        ),
      );
    if (bytes.byteLength > options.maxBytes) {
      return yield* new TelnyxUploadError({
        message: `${path} is ${bytes.byteLength} bytes; the limit is ${Math.round(options.maxBytes / (1 << 20))} MiB`,
      });
    }
    const name = path.slice(path.lastIndexOf("/") + 1);
    return {
      blob: new File([bytes as BlobPart], name, { type: contentType }),
      sha256: yield* sha256(bytes),
    };
  });

/**
 * SHA-256 of a local file, or `undefined` when it isn't on this machine (a
 * deploy from elsewhere keeps the uploaded content rather than replacing it).
 */
export const fileSha256 = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const exists = yield* fs.exists(path).pipe(Effect.orElseSucceed(() => false));
    if (!exists) return undefined;
    const bytes = yield* fs.readFile(path).pipe(Effect.orElseSucceed(() => undefined));
    return bytes === undefined ? undefined : yield* sha256(bytes);
  });
