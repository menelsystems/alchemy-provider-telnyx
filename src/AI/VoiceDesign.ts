// Telnyx voice design: telnyx_voice_design in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_voice_designs from "#telnyx/services/voice_designs.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link VoiceDesign}: the create request and the update request of the Telnyx API.
 */
export type VoiceDesignProps = Omit<M_voice_designs.CreateVoiceDesignRequest, "id"> &
  Partial<Omit<M_voice_designs.UpdateVoiceDesignRequest, "id">>;

/**
 * Attributes of a deployed {@link VoiceDesign}: the object as the Telnyx API returns it.
 */
export type VoiceDesignAttributes = NonNullable<M_voice_designs.VoiceDesignResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link VoiceDesign} for `VoiceDesign.lookup`.
 */
export interface VoiceDesignLookup {
  id: string;
}

export type VoiceDesign = Resource<
  "Telnyx.AI.VoiceDesign",
  VoiceDesignProps,
  VoiceDesignAttributes,
  never,
  Providers,
  VoiceDesignLookup
>;

/**
 * A voice design, a synthetic voice generated from a description and a sample text.
 *
 * Changing `language`, `max_new_tokens`, `prompt`, `repetition_penalty`, `temperature`, `text`, `top_k`, `top_p`, `provider` replaces it.
 *
 * @resource
 * @product AI
 */
export const VoiceDesign = Resource<VoiceDesign>("Telnyx.AI.VoiceDesign");

export const VoiceDesignProvider = () =>
  Crud.provider(VoiceDesign, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "language",
      "max_new_tokens",
      "prompt",
      "repetition_penalty",
      "temperature",
      "text",
      "top_k",
      "top_p",
      "provider",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_voice_designs.getVoiceDesign(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            VoiceDesignAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_voice_designs.createVoiceDesign({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<VoiceDesignAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_voice_designs.updateVoiceDesign({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<VoiceDesignAttributes, any, any>,
    delete: (current) =>
      M_voice_designs.deleteVoiceDesign({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_voice_designs.listVoiceDesigns, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
