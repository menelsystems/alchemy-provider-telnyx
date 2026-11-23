// Telnyx alphanumeric sender id: telnyx_alphanumeric_sender_id in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_messaging from "#telnyx/services/messaging.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AlphanumericSenderID}: the create request of the Telnyx API.
 */
export type AlphanumericSenderIDProps = Omit<M_messaging.CreateAlphanumericSenderIdRequest, "id">;

/**
 * Attributes of a deployed {@link AlphanumericSenderID}: the object as the Telnyx API returns it.
 */
export type AlphanumericSenderIDAttributes = NonNullable<
  M_messaging.GetAlphanumericSenderIdResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link AlphanumericSenderID} for `AlphanumericSenderID.lookup`.
 */
export interface AlphanumericSenderIDLookup {
  id: string;
}

export type AlphanumericSenderID = Resource<
  "Telnyx.Messaging.AlphanumericSenderID",
  AlphanumericSenderIDProps,
  AlphanumericSenderIDAttributes,
  never,
  Providers,
  AlphanumericSenderIDLookup
>;

/**
 * An alphanumeric sender ID registered on a messaging profile, used as the sender in countries that accept alphanumeric senders. The API cannot change it, so every change replaces it.
 *
 * Changing `alphanumeric_sender_id`, `messaging_profile_id`, `us_long_code_fallback` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const AlphanumericSenderID = Resource<AlphanumericSenderID>(
  "Telnyx.Messaging.AlphanumericSenderID",
);

export const AlphanumericSenderIDProvider = () =>
  Crud.provider(AlphanumericSenderID, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["alphanumeric_sender_id", "messaging_profile_id", "us_long_code_fallback"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_messaging.getAlphanumericSenderId(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<AlphanumericSenderIDAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_messaging.createAlphanumericSenderId({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<AlphanumericSenderIDAttributes, any, any>,
    delete: (current) =>
      M_messaging.deleteAlphanumericSenderId({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_messaging.listAlphanumericSenderIds, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
