// Telnyx phone number campaign: telnyx_10dlc_phone_number_campaign in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_campaigns from "../../vendor/distilled-telnyx/src/services/phone_number_campaigns.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberCampaign}: the create request and the update request of the Telnyx API.
 */
export type PhoneNumberCampaignProps = Omit<
  M_phone_number_campaigns.CreatePhoneNumberCampaignRequest,
  "phoneNumber"
> &
  Partial<Omit<M_phone_number_campaigns.PutPhoneNumberCampaignRequest, "phoneNumber">> & {
    /**
     * The phone number in E.164 format.
     */
    phoneNumber: string;
  };

/**
 * Attributes of a deployed {@link PhoneNumberCampaign}: the object as the Telnyx API returns it.
 */
export type PhoneNumberCampaignAttributes = M_phone_number_campaigns.PhoneNumberCampaign & {
  phoneNumber: string;
};

/**
 * Identifies an existing {@link PhoneNumberCampaign} for `PhoneNumberCampaign.lookup`.
 */
export interface PhoneNumberCampaignLookup {
  phoneNumber: string;
}

export type PhoneNumberCampaign = Resource<
  "Telnyx.TenDLC.PhoneNumberCampaign",
  PhoneNumberCampaignProps,
  PhoneNumberCampaignAttributes,
  never,
  Providers,
  PhoneNumberCampaignLookup
>;

/**
 * The assignment of a phone number to a 10DLC campaign, which decides the registered campaign its A2P SMS traffic is sent under. Destroying it removes the number from the campaign.
 *
 * Changing `phoneNumber` replaces it.
 *
 * @resource
 * @product TenDLC
 */
export const PhoneNumberCampaign = Resource<PhoneNumberCampaign>(
  "Telnyx.TenDLC.PhoneNumberCampaign",
);

export const PhoneNumberCampaignProvider = () =>
  Crud.provider(PhoneNumberCampaign, {
    local: ["phoneNumber"],
    stables: ["phoneNumber"] as any,
    replaceOn: ["phoneNumber"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phoneNumber: "phoneNumber" });
      return k
        ? (M_phone_number_campaigns.getSinglePhoneNumberCampaign(k as any) as Effect.Effect<
            PhoneNumberCampaignAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_campaigns.createPhoneNumberCampaign({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<PhoneNumberCampaignAttributes, any, any>,
    update: ({ current, props }) =>
      M_phone_number_campaigns.putPhoneNumberCampaign({
        ...props,
        ...Crud.path({ ...props, ...current }, { phoneNumber: "phoneNumber" }),
      } as any) as Effect.Effect<PhoneNumberCampaignAttributes, any, any>,
    delete: (current) =>
      M_phone_number_campaigns.deletePhoneNumberCampaign({
        ...Crud.path(current, { phoneNumber: "phoneNumber" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_phone_number_campaigns.getAllPhoneNumberCampaigns,
        {} as any,
        "page-records",
      ) as Effect.Effect<any, any, any>,
  });
