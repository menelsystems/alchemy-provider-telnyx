// Telnyx memory namespace settings: telnyx_ai_memory_namespace_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_settings from "../../vendor/distilled-telnyx/src/services/settings.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MemoryNamespaceSettings}: the create request of the Telnyx API.
 */
export type MemoryNamespaceSettingsProps = Omit<
  M_settings.UpdateNamespaceSettingsRequest,
  "namespace"
> & {
  /**
   * The namespace.
   */
  namespace: string;
};

/**
 * Attributes of a deployed {@link MemoryNamespaceSettings}: the object as the Telnyx API returns it.
 */
export type MemoryNamespaceSettingsAttributes = NonNullable<
  M_settings.NamespaceSettingsResponse["data"]
> & { namespace: string };

/**
 * Identifies an existing {@link MemoryNamespaceSettings} for `MemoryNamespaceSettings.lookup`.
 */
export interface MemoryNamespaceSettingsLookup {
  namespace: string;
}

export type MemoryNamespaceSettings = Resource<
  "Telnyx.AI.MemoryNamespaceSettings",
  MemoryNamespaceSettingsProps,
  MemoryNamespaceSettingsAttributes,
  never,
  Providers,
  MemoryNamespaceSettingsLookup
>;

/**
 * The settings of an AI memory namespace. Destroy removes them from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `namespace` replaces it.
 *
 * @resource
 * @product AI
 */
export const MemoryNamespaceSettings = Resource<MemoryNamespaceSettings>(
  "Telnyx.AI.MemoryNamespaceSettings",
);

export const MemoryNamespaceSettingsProvider = () =>
  Crud.provider(MemoryNamespaceSettings, {
    local: ["namespace"],
    stables: ["namespace"] as any,
    replaceOn: ["namespace"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { namespace: "namespace" });
      return k
        ? (M_settings.getNamespaceSettings(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            MemoryNamespaceSettingsAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_settings.updateNamespaceSettings({
        ...Crud.omit(props, ["namespace"]),
        ...Crud.path(props, { namespace: "namespace" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        MemoryNamespaceSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_settings.updateNamespaceSettings({
        ...Crud.omit(delta, ["namespace"]),
        ...Crud.path({ ...props, ...current }, { namespace: "namespace" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        MemoryNamespaceSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a MemoryNamespaceSettings; it was removed from Alchemy state but still exists in your account.",
  });
