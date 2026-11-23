// Telnyx telephony credential: telnyx_telephony_credential in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_credentials from "#telnyx/services/credentials.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TelephonyCredential}: the create request and the update request of the Telnyx API.
 */
export type TelephonyCredentialProps = Omit<M_credentials.CreateTelephonyCredentialRequest, "id"> &
  Partial<Omit<M_credentials.UpdateTelephonyCredentialRequest, "id">>;

/**
 * Attributes of a deployed {@link TelephonyCredential}: the object as the Telnyx API returns it.
 */
export type TelephonyCredentialAttributes = NonNullable<
  M_credentials.GetTelephonyCredentialResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link TelephonyCredential} for `TelephonyCredential.lookup`.
 */
export interface TelephonyCredentialLookup {
  id: string;
}

export type TelephonyCredential = Resource<
  "Telnyx.Voice.TelephonyCredential",
  TelephonyCredentialProps,
  TelephonyCredentialAttributes,
  never,
  Providers,
  TelephonyCredentialLookup
>;

/**
 * A credential that WebRTC clients use to sign in to a credential connection.
 *
 * @resource
 * @product Voice
 */
export const TelephonyCredential = Resource<TelephonyCredential>(
  "Telnyx.Voice.TelephonyCredential",
);

export const TelephonyCredentialProvider = () =>
  Crud.provider(TelephonyCredential, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_credentials.getTelephonyCredential(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TelephonyCredentialAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_credentials.createTelephonyCredential({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<TelephonyCredentialAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_credentials.updateTelephonyCredential({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TelephonyCredentialAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_credentials.deleteTelephonyCredential({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_credentials.findTelephonyCredentials, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
