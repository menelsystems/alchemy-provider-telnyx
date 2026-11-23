// Telnyx mobile push credential: telnyx_mobile_push_credential in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_push_credentials from "#telnyx/services/push_credentials.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MobilePushCredential}: the create request of the Telnyx API.
 */
/** An iOS (APNs certificate and key) or Android (FCM service account) credential. */
export type MobilePushCredentialProps = M_push_credentials.CreatePushCredentialRequestBody;

/**
 * Attributes of a deployed {@link MobilePushCredential}: the object as the Telnyx API returns it.
 */
export type MobilePushCredentialAttributes = NonNullable<
  M_push_credentials.PushCredentialResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link MobilePushCredential} for `MobilePushCredential.lookup`.
 */
export interface MobilePushCredentialLookup {
  id: string;
}

export type MobilePushCredential = Resource<
  "Telnyx.Messaging.MobilePushCredential",
  MobilePushCredentialProps,
  MobilePushCredentialAttributes,
  never,
  Providers,
  MobilePushCredentialLookup
>;

/**
 * Credentials for sending push notifications to iOS (APNs) or Android (FCM) apps that use the WebRTC SDKs.
 *
 * Changing `alias`, `certificate`, `private_key`, `project_account_json_file`, `type` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const MobilePushCredential = Resource<MobilePushCredential>(
  "Telnyx.Messaging.MobilePushCredential",
);

export const MobilePushCredentialProvider = () =>
  Crud.provider(MobilePushCredential, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["alias", "certificate", "private_key", "project_account_json_file", "type"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { push_credential_id: "id" });
      return k
        ? (M_push_credentials.getPushCredentialById(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MobilePushCredentialAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      // The request body is a union of the iOS and Android shapes.
      M_push_credentials.createPushCredential({ body: props }).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MobilePushCredentialAttributes, any, any>,
    delete: (current) =>
      M_push_credentials.deletePushCredentialById({
        ...Crud.path(current, { push_credential_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_push_credentials.listPushCredentials, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
