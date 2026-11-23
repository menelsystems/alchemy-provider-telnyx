// Telnyx shared campaign: telnyx_10dlc_shared_campaign in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_shared_campaigns from "#telnyx/services/shared_campaigns.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SharedCampaign}: the create request of the Telnyx API.
 */
export type SharedCampaignProps = Omit<
  M_shared_campaigns.UpdateSharedCampaignRequest,
  "campaignId"
> & {
  /**
   * The campaign id.
   */
  campaign_id: string;
};

/**
 * Attributes of a deployed {@link SharedCampaign}: the object as the Telnyx API returns it.
 */
export type SharedCampaignAttributes = M_shared_campaigns.TelnyxDownstreamCampaign & {
  campaign_id: string;
};

/**
 * Identifies an existing {@link SharedCampaign} for `SharedCampaign.lookup`.
 */
export interface SharedCampaignLookup {
  campaign_id: string;
}

export type SharedCampaign = Resource<
  "Telnyx.TenDLC.SharedCampaign",
  SharedCampaignProps,
  SharedCampaignAttributes,
  never,
  Providers,
  SharedCampaignLookup
>;

/**
 * A partner 10DLC campaign that another campaign service provider shared with Telnyx and Telnyx accepted. Alchemy manages only its webhook URLs; the campaign itself is owned by the partner.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `campaign_id` replaces it.
 *
 * @resource
 * @product TenDLC
 */
export const SharedCampaign = Resource<SharedCampaign>("Telnyx.TenDLC.SharedCampaign");

export const SharedCampaignProvider = () =>
  Crud.provider(SharedCampaign, {
    local: ["campaign_id"],
    stables: ["campaign_id"] as any,
    replaceOn: ["campaign_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { campaignId: "campaign_id" });
      return k
        ? (M_shared_campaigns.getSharedCampaign(k as any) as Effect.Effect<
            SharedCampaignAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_shared_campaigns.updateSharedCampaign({
        ...Crud.omit(props, ["campaign_id"]),
        ...Crud.path(props, { campaignId: "campaign_id" }),
      } as any) as Effect.Effect<SharedCampaignAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_shared_campaigns.updateSharedCampaign({
        ...Crud.omit(delta, ["campaign_id"]),
        ...Crud.path({ ...props, ...current }, { campaignId: "campaign_id" }),
      } as any) as Effect.Effect<SharedCampaignAttributes, any, any>,
    retain: () =>
      "A shared campaign is owned by the partner that shared it and cannot be deleted through Telnyx. It was removed from Alchemy state; its webhook URLs keep their last values.",
  });
