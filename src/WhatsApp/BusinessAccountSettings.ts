// Telnyx business account settings: telnyx_whatsapp_business_account_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_business_accounts from "#telnyx/services/whatsapp_business_accounts.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link BusinessAccountSettings}: the create request of the Telnyx API.
 */
export type BusinessAccountSettingsProps = Omit<
  M_whatsapp_business_accounts.PatchWabaSettingsRequest2,
  "id"
> & {
  /**
   * The whatsapp business account id.
   */
  whatsapp_business_account_id: string;
};

/**
 * Attributes of a deployed {@link BusinessAccountSettings}: the object as the Telnyx API returns it.
 */
export type BusinessAccountSettingsAttributes = NonNullable<
  M_whatsapp_business_accounts.GetWabaSettingsResponse2["data"]
> & { whatsapp_business_account_id: string };

/**
 * Identifies an existing {@link BusinessAccountSettings} for `BusinessAccountSettings.lookup`.
 */
export interface BusinessAccountSettingsLookup {
  whatsapp_business_account_id: string;
}

export type BusinessAccountSettings = Resource<
  "Telnyx.WhatsApp.BusinessAccountSettings",
  BusinessAccountSettingsProps,
  BusinessAccountSettingsAttributes,
  never,
  Providers,
  BusinessAccountSettingsLookup
>;

/**
 * The settings of a WhatsApp Business Account (WABA): its name, timezone and the webhooks that receive its WhatsApp events. Creating this resource adopts the settings of an existing WABA; destroying it leaves them as they are.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `whatsapp_business_account_id` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const BusinessAccountSettings = Resource<BusinessAccountSettings>(
  "Telnyx.WhatsApp.BusinessAccountSettings",
);

export const BusinessAccountSettingsProvider = () =>
  Crud.provider(BusinessAccountSettings, {
    local: ["whatsapp_business_account_id"],
    stables: ["whatsapp_business_account_id"] as any,
    replaceOn: ["whatsapp_business_account_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "whatsapp_business_account_id" });
      return k
        ? (M_whatsapp_business_accounts.getWabaSettings2(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<BusinessAccountSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_business_accounts.patchWabaSettings2({
        ...Crud.omit(props, ["whatsapp_business_account_id"]),
        ...Crud.path(props, { id: "whatsapp_business_account_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        BusinessAccountSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_whatsapp_business_accounts.patchWabaSettings2({
        ...Crud.omit(delta, ["whatsapp_business_account_id"]),
        ...Crud.path({ ...props, ...current }, { id: "whatsapp_business_account_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        BusinessAccountSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete WhatsApp Business Account settings. They were removed from Alchemy state but keep their current values in your Telnyx account.",
  });
