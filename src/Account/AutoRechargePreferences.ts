// Telnyx auto recharge preferences: telnyx_auto_recharge_preferences in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_auto_recharge_preferences from "#telnyx/services/auto_recharge_preferences.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AutoRechargePreferences}: the create request of the Telnyx API.
 */
export type AutoRechargePreferencesProps = Omit<
  M_auto_recharge_preferences.UpdateAutoRechargePrefsRequest,
  never
>;

/**
 * Attributes of a deployed {@link AutoRechargePreferences}: the object as the Telnyx API returns it.
 */
export type AutoRechargePreferencesAttributes = NonNullable<
  M_auto_recharge_preferences.GetAutoRechargePrefsResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link AutoRechargePreferences} for `AutoRechargePreferences.lookup`.
 */
export interface AutoRechargePreferencesLookup {
  id: string;
}

export type AutoRechargePreferences = Resource<
  "Telnyx.Account.AutoRechargePreferences",
  AutoRechargePreferencesProps,
  AutoRechargePreferencesAttributes,
  never,
  Providers,
  AutoRechargePreferencesLookup
>;

/**
 * The account's automatic balance top-up: when the balance falls below a threshold, Telnyx charges the recharge amount. There is one per account; destroy removes it from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product Account
 */
export const AutoRechargePreferences = Resource<AutoRechargePreferences>(
  "Telnyx.Account.AutoRechargePreferences",
);

export const AutoRechargePreferencesProvider = () =>
  Crud.provider(AutoRechargePreferences, {
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, {});
      return k
        ? (M_auto_recharge_preferences.getAutoRechargePrefs(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<AutoRechargePreferencesAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_auto_recharge_preferences.updateAutoRechargePrefs({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        AutoRechargePreferencesAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_auto_recharge_preferences.updateAutoRechargePrefs({
        ...delta,
        ...Crud.path({ ...props, ...current }, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        AutoRechargePreferencesAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a AutoRechargePreferences; it was removed from Alchemy state but still exists in your account.",
  });
