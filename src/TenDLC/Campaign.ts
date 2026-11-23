// Telnyx campaign: telnyx_10dlc_campaign in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_campaign from "../../vendor/distilled-telnyx/src/services/campaign.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Campaign}: the create request and the update request of the Telnyx API.
 */
export type CampaignProps = Omit<M_campaign.PostCampaignRequest, "campaignId"> &
  Partial<Omit<M_campaign.UpdateCampaignRequest, "campaignId">>;

/**
 * Attributes of a deployed {@link Campaign}: the object as the Telnyx API returns it.
 */
export type CampaignAttributes = M_campaign.TelnyxCampaignCSP & { campaignId: string };

/**
 * Identifies an existing {@link Campaign} for `Campaign.lookup`.
 */
export interface CampaignLookup {
  campaignId: string;
}

export type Campaign = Resource<
  "Telnyx.TenDLC.Campaign",
  CampaignProps,
  CampaignAttributes,
  never,
  Providers,
  CampaignLookup
>;

/**
 * A 10DLC campaign: a registered use case under which a 10DLC brand sends A2P SMS from US 10-digit long code numbers. Creating a campaign charges a non-refundable three months of its use case's cost; after creation only the sample messages, help message, message flow, webhooks, reseller and auto-renewal can change. Destroying a campaign deactivates it permanently.
 *
 * Changing `ageGated`, `brandId`, `description`, `directLending`, `embeddedLink`, `embeddedLinkSample`, `embeddedPhone`, `helpKeywords`, `mnoIds`, `numberPool`, `optinKeywords`, `optinMessage`, `optoutKeywords`, `optoutMessage`, `privacyPolicyLink`, `referenceId`, `subUsecases`, `subscriberHelp`, `subscriberOptin`, `subscriberOptout`, `tag`, `termsAndConditions`, `termsAndConditionsLink`, `usecase` replaces it.
 *
 * @resource
 * @product TenDLC
 */
export const Campaign = Resource<Campaign>("Telnyx.TenDLC.Campaign");

export const CampaignProvider = () =>
  Crud.provider(Campaign, {
    local: ["campaignId"],
    stables: ["campaignId"] as any,
    replaceOn: [
      "ageGated",
      "brandId",
      "description",
      "directLending",
      "embeddedLink",
      "embeddedLinkSample",
      "embeddedPhone",
      "helpKeywords",
      "mnoIds",
      "numberPool",
      "optinKeywords",
      "optinMessage",
      "optoutKeywords",
      "optoutMessage",
      "privacyPolicyLink",
      "referenceId",
      "subUsecases",
      "subscriberHelp",
      "subscriberOptin",
      "subscriberOptout",
      "tag",
      "termsAndConditions",
      "termsAndConditionsLink",
      "usecase",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { campaignId: "campaignId" });
      return k
        ? (M_campaign.getCampaign(k as any) as Effect.Effect<CampaignAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_campaign.postCampaign({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        CampaignAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_campaign.updateCampaign({
        ...props,
        ...Crud.path({ ...props, ...current }, { campaignId: "campaignId" }),
      } as any) as Effect.Effect<CampaignAttributes, any, any>,
    delete: (current) =>
      M_campaign.deactivateCampaign({
        ...Crud.path(current, { campaignId: "campaignId" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_campaign.getCampaigns, {} as any, "page-records") as Effect.Effect<
        any,
        any,
        any
      >,
  });
