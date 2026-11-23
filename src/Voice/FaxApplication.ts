// Telnyx fax application: telnyx_fax_application in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_programmable_fax_applications from "../../vendor/distilled-telnyx/src/services/programmable_fax_applications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link FaxApplication}: the create request and the update request of the Telnyx API.
 */
export type FaxApplicationProps = Omit<
  M_programmable_fax_applications.CreateFaxApplicationRequest,
  "id"
> &
  Partial<Omit<M_programmable_fax_applications.UpdateFaxApplicationRequest, "id">>;

/**
 * Attributes of a deployed {@link FaxApplication}: the object as the Telnyx API returns it.
 */
export type FaxApplicationAttributes = NonNullable<
  M_programmable_fax_applications.GetFaxApplicationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link FaxApplication} for `FaxApplication.lookup`.
 */
export interface FaxApplicationLookup {
  id: string;
}

export type FaxApplication = Resource<
  "Telnyx.Voice.FaxApplication",
  FaxApplicationProps,
  FaxApplicationAttributes,
  never,
  Providers,
  FaxApplicationLookup
>;

/**
 * A fax application, which sends fax events to a webhook.
 *
 * @resource
 * @product Voice
 */
export const FaxApplication = Resource<FaxApplication>("Telnyx.Voice.FaxApplication");

export const FaxApplicationProvider = () =>
  Crud.provider(FaxApplication, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_programmable_fax_applications.getFaxApplication(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<FaxApplicationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_programmable_fax_applications.createFaxApplication({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FaxApplicationAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_programmable_fax_applications.updateFaxApplication({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FaxApplicationAttributes, any, any>,
    delete: (current) =>
      M_programmable_fax_applications.deleteFaxApplication({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_programmable_fax_applications.listFaxApplications,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
