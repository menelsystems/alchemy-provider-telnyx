// Telnyx custom storage credential: telnyx_custom_storage_credential in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_call_recordings from "../../vendor/distilled-telnyx/src/services/call_recordings.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CustomStorageCredential}: the create request and the update request of the Telnyx API.
 */
export type CustomStorageCredentialProps = Omit<
  M_call_recordings.CreateCustomStorageCredentialsRequest,
  "connection_id"
> &
  Partial<Omit<M_call_recordings.UpdateCustomStorageCredentialsRequest, "connection_id">> & {
    /**
     * The connection id.
     */
    connection_id: string;
  };

/**
 * Attributes of a deployed {@link CustomStorageCredential}: the object as the Telnyx API returns it.
 */
export type CustomStorageCredentialAttributes = NonNullable<
  M_call_recordings.CredentialsResponse["data"]
> & { connection_id: string };

/**
 * Identifies an existing {@link CustomStorageCredential} for `CustomStorageCredential.lookup`.
 */
export interface CustomStorageCredentialLookup {
  connection_id: string;
}

export type CustomStorageCredential = Resource<
  "Telnyx.Voice.CustomStorageCredential",
  CustomStorageCredentialProps,
  CustomStorageCredentialAttributes,
  never,
  Providers,
  CustomStorageCredentialLookup
>;

/**
 * Credentials for storing call recordings of a connection in your own AWS S3, Google Cloud Storage or Azure bucket.
 *
 * Changing `connection_id` replaces it.
 *
 * @resource
 * @product Voice
 */
export const CustomStorageCredential = Resource<CustomStorageCredential>(
  "Telnyx.Voice.CustomStorageCredential",
);

export const CustomStorageCredentialProvider = () =>
  Crud.provider(CustomStorageCredential, {
    local: ["connection_id"],
    stables: ["connection_id"] as any,
    replaceOn: ["connection_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { connection_id: "connection_id" });
      return k
        ? (M_call_recordings.getCustomStorageCredentials(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<CustomStorageCredentialAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_call_recordings.createCustomStorageCredentials({
        ...Crud.omit(props, ["connection_id"]),
        ...Crud.path(props, { connection_id: "connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CustomStorageCredentialAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_call_recordings.updateCustomStorageCredentials({
        ...Crud.omit(props, ["connection_id"]),
        ...Crud.path({ ...props, ...current }, { connection_id: "connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CustomStorageCredentialAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_call_recordings.deleteCustomStorageCredentials({
        ...Crud.path(current, { connection_id: "connection_id" }),
      } as any).pipe(Effect.asVoid),
  });
