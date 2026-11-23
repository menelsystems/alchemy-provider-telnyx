// Telnyx display identity record: telnyx_display_identity_record in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_display_identity_records from "../../vendor/distilled-telnyx/src/services/display_identity_records.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DisplayIdentityRecord}: the create request and the update request of the Telnyx API.
 */
export type DisplayIdentityRecordProps = Omit<
  M_display_identity_records.CreateDirRequest,
  "enterprise_id" | "dir_id"
> &
  Partial<Omit<M_display_identity_records.UpdateDirSimpleRequest, "enterprise_id" | "dir_id">> & {
    /**
     * The enterprise id.
     */
    enterprise_id: string;
  };

/**
 * Attributes of a deployed {@link DisplayIdentityRecord}: the object as the Telnyx API returns it.
 */
export type DisplayIdentityRecordAttributes = NonNullable<
  M_display_identity_records.DirWrapped["data"]
> & { id: string };

/**
 * Identifies an existing {@link DisplayIdentityRecord} for `DisplayIdentityRecord.lookup`.
 */
export interface DisplayIdentityRecordLookup {
  enterprise_id: string;
  id: string;
}

export type DisplayIdentityRecord = Resource<
  "Telnyx.Compliance.DisplayIdentityRecord",
  DisplayIdentityRecordProps,
  DisplayIdentityRecordAttributes,
  never,
  Providers,
  DisplayIdentityRecordLookup
>;

/**
 * A Display Identity Record (DIR) for Branded Calling: the name, logo and call reasons shown to the people an enterprise calls. Edit it while it is a draft, then submit it with the telnyx_display_identity_record_submit action.
 *
 * Changing `enterprise_id` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const DisplayIdentityRecord = Resource<DisplayIdentityRecord>(
  "Telnyx.Compliance.DisplayIdentityRecord",
);

export const DisplayIdentityRecordProvider = () =>
  Crud.provider(DisplayIdentityRecord, {
    local: ["enterprise_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["enterprise_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { dir_id: "id" });
      return k
        ? (M_display_identity_records.getDirByIdSimple(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<DisplayIdentityRecordAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_display_identity_records.createDir({
        ...props,
        ...Crud.path(props, { enterprise_id: "enterprise_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DisplayIdentityRecordAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_display_identity_records.updateDirSimple({
        ...delta,
        ...Crud.path({ ...props, ...current }, { dir_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DisplayIdentityRecordAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_display_identity_records.deleteDirSimple({
        ...Crud.path(current, { dir_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_display_identity_records.listAllDirs, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: (obj) =>
      // Call reasons go in as strings and come back as objects with timestamps.
      Effect.succeed(Hooks.pluck(obj, "call_reasons", "reason")),
  });
