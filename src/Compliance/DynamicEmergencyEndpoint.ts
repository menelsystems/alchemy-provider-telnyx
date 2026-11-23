// Telnyx dynamic emergency endpoint: telnyx_dynamic_emergency_endpoint in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_dynamic_emergency_endpoints from "#telnyx/services/dynamic_emergency_endpoints.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DynamicEmergencyEndpoint}: the create request of the Telnyx API.
 */
export type DynamicEmergencyEndpointProps = Omit<
  M_dynamic_emergency_endpoints.CreateDynamicEmergencyEndpointRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link DynamicEmergencyEndpoint}: the object as the Telnyx API returns it.
 */
export type DynamicEmergencyEndpointAttributes = NonNullable<
  M_dynamic_emergency_endpoints.GetDynamicEmergencyEndpointResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link DynamicEmergencyEndpoint} for `DynamicEmergencyEndpoint.lookup`.
 */
export interface DynamicEmergencyEndpointLookup {
  id: string;
}

export type DynamicEmergencyEndpoint = Resource<
  "Telnyx.Compliance.DynamicEmergencyEndpoint",
  DynamicEmergencyEndpointProps,
  DynamicEmergencyEndpointAttributes,
  never,
  Providers,
  DynamicEmergencyEndpointLookup
>;

/**
 * An endpoint for dynamic emergency calling, which links a callback number and caller name to a dynamic emergency address.
 *
 * Changing `callback_number`, `caller_name`, `dynamic_emergency_address_id` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const DynamicEmergencyEndpoint = Resource<DynamicEmergencyEndpoint>(
  "Telnyx.Compliance.DynamicEmergencyEndpoint",
);

export const DynamicEmergencyEndpointProvider = () =>
  Crud.provider(DynamicEmergencyEndpoint, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["callback_number", "caller_name", "dynamic_emergency_address_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_dynamic_emergency_endpoints.getDynamicEmergencyEndpoint(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<DynamicEmergencyEndpointAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_dynamic_emergency_endpoints.createDynamicEmergencyEndpoint({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DynamicEmergencyEndpointAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_dynamic_emergency_endpoints.deleteDynamicEmergencyEndpoint({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_dynamic_emergency_endpoints.listDynamicEmergencyEndpoints,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
