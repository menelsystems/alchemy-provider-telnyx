// Telnyx managed account: telnyx_managed_account in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_managed_accounts from "../../vendor/distilled-telnyx/src/services/managed_accounts.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ManagedAccount}: the create request and the update request of the Telnyx API.
 */
export type ManagedAccountProps = Omit<M_managed_accounts.CreateManagedAccountRequest, "id"> &
  Partial<Omit<M_managed_accounts.UpdateManagedAccountRequest, "id">> &
  Omit<M_managed_accounts.UpdateManagedAccountGlobalChannelLimitRequest, "id">;

/**
 * Attributes of a deployed {@link ManagedAccount}: the object as the Telnyx API returns it.
 */
export type ManagedAccountAttributes = NonNullable<
  M_managed_accounts.GetManagedAccountResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link ManagedAccount} for `ManagedAccount.lookup`.
 */
export interface ManagedAccountLookup {
  id: string;
}

export type ManagedAccount = Resource<
  "Telnyx.Account.ManagedAccount",
  ManagedAccountProps,
  ManagedAccountAttributes,
  never,
  Providers,
  ManagedAccountLookup
>;

/**
 * A managed account: a separate Telnyx account that this manager account creates and administers. The API cannot delete managed accounts: destroy removes it from Alchemy state, and the telnyx_managed_account_disable action disables it.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `business_name`, `email`, `password`, `rollup_billing` replaces it.
 *
 * @resource
 * @product Account
 */
export const ManagedAccount = Resource<ManagedAccount>("Telnyx.Account.ManagedAccount");

export const ManagedAccountProvider = () =>
  Crud.provider(ManagedAccount, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["business_name", "email", "password", "rollup_billing"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_managed_accounts.getManagedAccount(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<ManagedAccountAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_managed_accounts.createManagedAccount({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ManagedAccountAttributes, any, any>,
    // The global channel limit changes through its own endpoint.
    update: ({ current, delta }) =>
      Effect.gen(function* () {
        const { channel_limit, ...rest } = delta;
        if (Object.keys(rest).length > 0) {
          yield* M_managed_accounts.updateManagedAccount({ ...rest, id: current.id } as any);
        }
        if (channel_limit !== undefined) {
          yield* M_managed_accounts.updateManagedAccountGlobalChannelLimit({
            id: current.id,
            channel_limit: channel_limit ?? undefined,
          });
        }
      }),
    list: () =>
      Paging.all(M_managed_accounts.listManagedAccounts, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a ManagedAccount; it was removed from Alchemy state but still exists in your account.",
  });
