// Telnyx enterprise reputation: telnyx_enterprise_reputation in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_reputation from "../../vendor/distilled-telnyx/src/services/reputation.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link EnterpriseReputation}: the create request of the Telnyx API.
 */
export type EnterpriseReputationProps = Omit<
  M_reputation.EnableReputationSettingsRequest,
  "enterprise_id"
> & {
  /** The enterprise to enable reputation monitoring for. Changing it replaces the resource. */
  enterprise_id: string;
  /** Where reputation change notifications are sent. */
  webhook_url?: string | null;
};

/**
 * Attributes of a deployed {@link EnterpriseReputation}: the object as the Telnyx API returns it.
 */
export type EnterpriseReputationAttributes = NonNullable<
  M_reputation.EnterpriseReputationPublicWrapped["data"]
> & { enterprise_id: string };

/**
 * Identifies an existing {@link EnterpriseReputation} for `EnterpriseReputation.lookup`.
 */
export interface EnterpriseReputationLookup {
  enterprise_id: string;
}

export type EnterpriseReputation = Resource<
  "Telnyx.Compliance.EnterpriseReputation",
  EnterpriseReputationProps,
  EnterpriseReputationAttributes,
  never,
  Providers,
  EnterpriseReputationLookup
>;

/**
 * Phone number reputation monitoring for an enterprise: enabled with a signed Letter of Authorization, refreshed at check_frequency. Destroy disables it.
 *
 * Changing `enterprise_id` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const EnterpriseReputation = Resource<EnterpriseReputation>(
  "Telnyx.Compliance.EnterpriseReputation",
);

export const EnterpriseReputationProvider = () =>
  Crud.provider(EnterpriseReputation, {
    local: ["enterprise_id"],
    stables: ["enterprise_id"] as any,
    replaceOn: ["enterprise_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { enterprise_id: "enterprise_id" });
      return k
        ? (M_reputation.getReputationSettings(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<EnterpriseReputationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_reputation.enableReputationSettings({
        ...props,
        ...Crud.path(props, { enterprise_id: "enterprise_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        EnterpriseReputationAttributes,
        any,
        any
      >,
    // Frequency, webhook and LOA each change through their own endpoint.
    update: ({ current, props, delta }) =>
      Effect.gen(function* () {
        const enterprise_id = props.enterprise_id;
        if (delta.check_frequency) {
          yield* M_reputation.updateReputationFrequency({
            enterprise_id,
            check_frequency: delta.check_frequency,
          });
        }
        if (delta.webhook_url !== undefined) {
          yield* M_reputation.updateReputationWebhook({
            enterprise_id,
            webhook_url: delta.webhook_url,
          });
        }
        if (delta.loa_document_id) {
          yield* M_reputation.replaceReputationLoa({
            enterprise_id,
            loa_document_id: delta.loa_document_id,
          });
        }
      }),
    delete: (current) =>
      M_reputation.disableReputationSettings({
        ...Crud.path(current, { enterprise_id: "enterprise_id" }),
      } as any).pipe(Effect.asVoid),
  });
