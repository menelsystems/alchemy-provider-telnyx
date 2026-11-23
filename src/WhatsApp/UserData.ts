// Telnyx user data: telnyx_whatsapp_user_data in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_business_accounts from "../../vendor/distilled-telnyx/src/services/whatsapp_business_accounts.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UserData}: the create request of the Telnyx API.
 */
export type UserDataProps = Omit<M_whatsapp_business_accounts.UpdateWhatsappUserDataRequest, never>;

/**
 * Attributes of a deployed {@link UserData}: the object as the Telnyx API returns it.
 */
export type UserDataAttributes = NonNullable<
  M_whatsapp_business_accounts.GetWhatsappUserDataResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link UserData} for `UserData.lookup`.
 */
export interface UserDataLookup {
  id: string;
}

export type UserData = Resource<
  "Telnyx.WhatsApp.UserData",
  UserDataProps,
  UserDataAttributes,
  never,
  Providers,
  UserDataLookup
>;

/**
 * The account-wide WhatsApp settings of your Telnyx account, the webhook URLs that receive WhatsApp signup events. There is one per account; creating this resource adopts it and destroying it leaves its values as they are.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product WhatsApp
 */
export const UserData = Resource<UserData>("Telnyx.WhatsApp.UserData");

export const UserDataProvider = () =>
  Crud.provider(UserData, {
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, {});
      return k
        ? (M_whatsapp_business_accounts.getWhatsappUserData(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<UserDataAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_business_accounts.updateWhatsappUserData({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UserDataAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_whatsapp_business_accounts.updateWhatsappUserData({
        ...delta,
        ...Crud.path({ ...props, ...current }, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UserDataAttributes, any, any>,
    retain: () =>
      "The Telnyx API cannot delete WhatsApp user data. It was removed from Alchemy state but keeps its current values in your Telnyx account.",
  });
