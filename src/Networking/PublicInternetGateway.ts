// Telnyx public internet gateway: telnyx_public_internet_gateway in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_public_internet_gateways from "../../vendor/distilled-telnyx/src/services/public_internet_gateways.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PublicInternetGateway}: the create request of the Telnyx API.
 */
export type PublicInternetGatewayProps = Omit<
  M_public_internet_gateways.CreatePublicInternetGatewayRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link PublicInternetGateway}: the object as the Telnyx API returns it.
 */
export type PublicInternetGatewayAttributes = NonNullable<
  M_public_internet_gateways.GetPublicInternetGatewayResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link PublicInternetGateway} for `PublicInternetGateway.lookup`.
 */
export interface PublicInternetGatewayLookup {
  id: string;
}

export type PublicInternetGateway = Resource<
  "Telnyx.Networking.PublicInternetGateway",
  PublicInternetGatewayProps,
  PublicInternetGatewayAttributes,
  never,
  Providers,
  PublicInternetGatewayLookup
>;

/**
 * A public internet gateway that gives a network access to the internet.
 *
 * Changing `name`, `network_id`, `region_code` replaces it.
 *
 * @resource
 * @product Networking
 */
export const PublicInternetGateway = Resource<PublicInternetGateway>(
  "Telnyx.Networking.PublicInternetGateway",
);

export const PublicInternetGatewayProvider = () =>
  Crud.provider(PublicInternetGateway, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["name", "network_id", "region_code"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_public_internet_gateways.getPublicInternetGateway(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PublicInternetGatewayAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_public_internet_gateways.createPublicInternetGateway({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<PublicInternetGatewayAttributes, any, any>,
    delete: (current) =>
      M_public_internet_gateways.deletePublicInternetGateway({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_public_internet_gateways.listPublicInternetGateways,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
