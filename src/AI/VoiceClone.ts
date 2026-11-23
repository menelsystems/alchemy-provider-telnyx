// Telnyx voice clone: telnyx_voice_clone in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_voice_clones from "../../vendor/distilled-telnyx/src/services/voice_clones.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * Props for {@link VoiceClone}: clone a voice design (`voice_design_id`), or
 * upload a recording (`audio_path`) with one provider's settings. The SDK
 * types each provider's shape, so settings that only apply to a recording
 * (`label`, `model_id`, `ref_text`) can't be set on a design clone.
 */
export type VoiceCloneProps =
  | M_voice_clones.VoiceCloneRequest
  | (DistributiveOmit<M_voice_clones.VoiceCloneUploadRequest, "audio_file"> & {
      /**
       * Path to a recording of the voice (WAV, MP3, FLAC, OGG or M4A, at most
       * 20 MiB), uploaded when the clone is created. A file with different
       * content creates a new clone.
       */
      audio_path: string;
    });

/**
 * Attributes of a deployed {@link VoiceClone}: the object as the Telnyx API returns it.
 */
export type VoiceCloneAttributes = NonNullable<
  M_voice_clones.VoiceCloneListResponse["data"]
>[number] & {
  id: string;
  /** SHA-256 of the uploaded recording, for a clone made from one. */
  audio_sha256?: string;
};

/**
 * Identifies an existing {@link VoiceClone} for `VoiceClone.lookup`.
 */
export interface VoiceCloneLookup {
  id: string;
}

export type VoiceClone = Resource<
  "Telnyx.AI.VoiceClone",
  VoiceCloneProps,
  VoiceCloneAttributes,
  never,
  Providers,
  VoiceCloneLookup
>;

/**
 * A voice clone, usable as a text-to-speech voice, made either from a voice design or from a recording of a voice. A recording with different content creates a new clone.
 *
 * Changing `label`, `model_id`, `ref_text`, `voice_design_id`, `provider` replaces it.
 *
 * @resource
 * @product AI
 */
export const VoiceClone = Resource<VoiceClone>("Telnyx.AI.VoiceClone");

const AUDIO_TYPES = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

const isUpload = (
  props: VoiceCloneProps,
): props is Extract<VoiceCloneProps, { audio_path: string }> =>
  "audio_path" in props && props.audio_path !== undefined;

export const VoiceCloneProvider = () =>
  Crud.provider(VoiceClone, {
    stables: ["id"] as any,
    replaceOn: [
      "voice_design_id",
      "provider",
      "model_id",
      "label",
      "ref_text",
      "audio_path",
    ] as any,
    preserve: ["audio_sha256"],
    // The API has no single-clone read: find it in the list.
    get: (ref) => {
      const id = (ref as { id?: string }).id;
      return id
        ? (Paging.all(M_voice_clones.listVoiceClones, {}, "page-flat").pipe(
            Effect.map((items) => items.find((it) => it.id === id)),
          ) as Effect.Effect<VoiceCloneAttributes | undefined, any, any>)
        : Effect.succeed(undefined);
    },
    // A recording with different content creates a new clone; one that isn't
    // on this machine keeps the existing clone.
    replaceIf: ({ news, output }) =>
      isUpload(news) && output?.audio_sha256 !== undefined
        ? Hooks.fileSha256(news.audio_path).pipe(
            Effect.map((sha) => sha !== undefined && sha !== output.audio_sha256),
          )
        : Effect.succeed(false),
    create: (props) =>
      Effect.gen(function* () {
        if (!isUpload(props)) {
          return (yield* M_voice_clones.createVoiceClone({ body: props }).pipe(
            Effect.map(Crud.data),
          )) as VoiceCloneAttributes;
        }
        const { audio_path, ...settings } = props;
        const file = yield* Hooks.readUpload(audio_path, {
          types: AUDIO_TYPES,
          maxBytes: 20 << 20,
          what: "recording",
        });
        const created = yield* M_voice_clones.createVoiceCloneFromUpload({
          body: { ...settings, audio_file: file.blob } as M_voice_clones.VoiceCloneUploadRequest,
        }).pipe(Effect.map(Crud.data));
        return { ...(created as VoiceCloneAttributes), audio_sha256: file.sha256 };
      }),
    // Only name, language and gender change in place; the update requires name.
    update: ({ current, props }) =>
      M_voice_clones.updateVoiceClone({
        id: current.id,
        name: props.name,
        language: "language" in props ? props.language : undefined,
        gender:
          "gender" in props
            ? (props.gender as M_voice_clones.UpdateVoiceCloneRequest["gender"])
            : undefined,
      }).pipe(Effect.map(Crud.data)) as Effect.Effect<VoiceCloneAttributes, any, any>,
    delete: (current) => M_voice_clones.deleteVoiceClone({ id: current.id }).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_voice_clones.listVoiceClones, {}, "page-flat") as Effect.Effect<any, any, any>,
  });
