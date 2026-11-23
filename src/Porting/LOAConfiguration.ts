// Telnyx loa configuration: telnyx_porting_loa_configuration in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "#telnyx/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link LOAConfiguration}: the create request and the update request of the Telnyx API.
 */
export type LOAConfigurationProps = Omit<M_porting_orders.CreateLoaConfigurationRequest, "id"> &
  Partial<Omit<M_porting_orders.UpdateLoaConfigurationRequest, "id">>;

/**
 * Attributes of a deployed {@link LOAConfiguration}: the object as the Telnyx API returns it.
 */
export type LOAConfigurationAttributes = NonNullable<
  M_porting_orders.GetLoaConfigurationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link LOAConfiguration} for `LOAConfiguration.lookup`.
 */
export interface LOAConfigurationLookup {
  id: string;
}

export type LOAConfiguration = Resource<
  "Telnyx.Porting.LOAConfiguration",
  LOAConfigurationProps,
  LOAConfigurationAttributes,
  never,
  Providers,
  LOAConfigurationLookup
>;

/**
 * A letter of authorization (LOA) template used for porting orders.
 *
 * @resource
 * @product Porting
 */
export const LOAConfiguration = Resource<LOAConfiguration>("Telnyx.Porting.LOAConfiguration");

export const LOAConfigurationProvider = () =>
  Crud.provider(LOAConfiguration, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_porting_orders.getLoaConfiguration(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<LOAConfigurationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_porting_orders.createLoaConfiguration({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<LOAConfigurationAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_porting_orders.updateLoaConfiguration({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<LOAConfigurationAttributes, any, any>,
    delete: (current) =>
      M_porting_orders.deleteLoaConfiguration({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_porting_orders.listLoaConfigurations, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
