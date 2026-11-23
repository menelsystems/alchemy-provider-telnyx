// Telnyx tollfree verification request: telnyx_messaging_tollfree_verification_request in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_verification_requests from "#telnyx/services/verification_requests.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TollfreeVerificationRequest}: the create request and the update request of the Telnyx API.
 */
export type TollfreeVerificationRequestProps = Omit<
  M_verification_requests.SubmitVerificationRequestRequest,
  "id"
> &
  Partial<Omit<M_verification_requests.UpdateVerificationRequestRequest, "id">>;

/**
 * Attributes of a deployed {@link TollfreeVerificationRequest}: the object as the Telnyx API returns it.
 */
export type TollfreeVerificationRequestAttributes =
  M_verification_requests.MessagingTollFreeVerificationVerificationRequestStatus & { id: string };

/**
 * Identifies an existing {@link TollfreeVerificationRequest} for `TollfreeVerificationRequest.lookup`.
 */
export interface TollfreeVerificationRequestLookup {
  id: string;
}

export type TollfreeVerificationRequest = Resource<
  "Telnyx.Messaging.TollfreeVerificationRequest",
  TollfreeVerificationRequestProps,
  TollfreeVerificationRequestAttributes,
  never,
  Providers,
  TollfreeVerificationRequestLookup
>;

/**
 * A toll-free verification request, which registers the business and use case behind toll-free numbers so carriers deliver their messages.
 *
 * @resource
 * @product Messaging
 */
export const TollfreeVerificationRequest = Resource<TollfreeVerificationRequest>(
  "Telnyx.Messaging.TollfreeVerificationRequest",
);

export const TollfreeVerificationRequestProvider = () =>
  Crud.provider(TollfreeVerificationRequest, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_verification_requests.getVerificationRequest(k as any) as Effect.Effect<
            TollfreeVerificationRequestAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_verification_requests.submitVerificationRequest({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<TollfreeVerificationRequestAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_verification_requests.updateVerificationRequest({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<TollfreeVerificationRequestAttributes, any, any>,
    delete: (current) =>
      M_verification_requests.deleteVerificationRequest({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_verification_requests.listVerificationRequests,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
