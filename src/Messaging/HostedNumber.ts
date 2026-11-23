// Telnyx hosted number: telnyx_messaging_hosted_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_hosted_numbers from "#telnyx/services/hosted_numbers.ts";
import * as M_messaging from "#telnyx/services/messaging.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link HostedNumber}: the create request of the Telnyx API.
 */
export type HostedNumberProps = Omit<M_messaging.UpdateMessagingHostedNumberRequest, "id"> & {
  /**
   * The messaging hosted number id.
   */
  messaging_hosted_number_id: string;
  /**
   * Whether destroy deletes the object in Telnyx. By default destroy only removes it from Terraform state. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  release_on_destroy?: boolean;
};

/**
 * Attributes of a deployed {@link HostedNumber}: the object as the Telnyx API returns it.
 */
export type HostedNumberAttributes = NonNullable<
  M_messaging.GetMessagingHostedNumberResponse["data"]
> & { messaging_hosted_number_id: string };

/**
 * Identifies an existing {@link HostedNumber} for `HostedNumber.lookup`.
 */
export interface HostedNumberLookup {
  messaging_hosted_number_id: string;
}

export type HostedNumber = Resource<
  "Telnyx.Messaging.HostedNumber",
  HostedNumberProps,
  HostedNumberAttributes,
  never,
  Providers,
  HostedNumberLookup
>;

/**
 * A number hosted on Telnyx for messaging only, once its hosted number order has completed. Create adopts the existing hosted number and manages its settings. Destroy keeps it unless release_on_destroy is true.
 *
 * Destroy keeps it in your account unless `release_on_destroy: true`.
 * Changing `messaging_hosted_number_id` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const HostedNumber = Resource<HostedNumber>("Telnyx.Messaging.HostedNumber");

export const HostedNumberProvider = () =>
  Crud.provider(HostedNumber, {
    local: ["messaging_hosted_number_id", "release_on_destroy"],
    stables: ["messaging_hosted_number_id"] as any,
    replaceOn: ["messaging_hosted_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "messaging_hosted_number_id" });
      return k
        ? (M_messaging.getMessagingHostedNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<HostedNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_messaging.updateMessagingHostedNumber({
        ...Crud.omit(props, ["messaging_hosted_number_id", "release_on_destroy"]),
        ...Crud.path(props, { id: "messaging_hosted_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<HostedNumberAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_messaging.updateMessagingHostedNumber({
        ...Crud.omit(delta, ["messaging_hosted_number_id", "release_on_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "messaging_hosted_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<HostedNumberAttributes, any, any>,
    delete: (current) =>
      M_hosted_numbers.deleteMessagingHostedNumber({
        ...Crud.path(current, { id: "messaging_hosted_number_id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_messaging.listMessagingHostedNumbers, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: (props) =>
      props.release_on_destroy
        ? undefined
        : "This HostedNumber stays in your Telnyx account, where it may still be billed. Set release_on_destroy: true and deploy before destroying to release it.",
  });
