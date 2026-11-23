// Telnyx traffic policy profile: telnyx_traffic_policy_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_traffic_policy_profiles from "#telnyx/services/traffic_policy_profiles.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TrafficPolicyProfile}: the create request and the update request of the Telnyx API.
 */
export type TrafficPolicyProfileProps = Omit<
  M_traffic_policy_profiles.CreateTrafficPolicyProfileRequest,
  "id"
> &
  Partial<Omit<M_traffic_policy_profiles.UpdateTrafficPolicyProfileRequest, "id">>;

/**
 * Attributes of a deployed {@link TrafficPolicyProfile}: the object as the Telnyx API returns it.
 */
export type TrafficPolicyProfileAttributes = NonNullable<
  M_traffic_policy_profiles.GetTrafficPolicyProfileResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link TrafficPolicyProfile} for `TrafficPolicyProfile.lookup`.
 */
export interface TrafficPolicyProfileLookup {
  id: string;
}

export type TrafficPolicyProfile = Resource<
  "Telnyx.Account.TrafficPolicyProfile",
  TrafficPolicyProfileProps,
  TrafficPolicyProfileAttributes,
  never,
  Providers,
  TrafficPolicyProfileLookup
>;

/**
 * A traffic policy profile that allows or blocks services, IP ranges and domains for SIM cards, with an optional bandwidth limit.
 *
 * @resource
 * @product Account
 */
export const TrafficPolicyProfile = Resource<TrafficPolicyProfile>(
  "Telnyx.Account.TrafficPolicyProfile",
);

export const TrafficPolicyProfileProvider = () =>
  Crud.provider(TrafficPolicyProfile, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_traffic_policy_profiles.getTrafficPolicyProfile(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TrafficPolicyProfileAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_traffic_policy_profiles.createTrafficPolicyProfile({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TrafficPolicyProfileAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_traffic_policy_profiles.updateTrafficPolicyProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TrafficPolicyProfileAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_traffic_policy_profiles.deleteTrafficPolicyProfile({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_traffic_policy_profiles.getTrafficPolicyProfiles,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
