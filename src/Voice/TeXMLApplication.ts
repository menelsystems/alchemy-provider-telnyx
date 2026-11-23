// Telnyx texml application: telnyx_texml_application in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_te_xml_applications from "../../vendor/distilled-telnyx/src/services/te_xml_applications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TeXMLApplication}: the create request and the update request of the Telnyx API.
 */
export type TeXMLApplicationProps = Omit<
  M_te_xml_applications.CreateTexmlApplicationRequest,
  "id"
> &
  Partial<Omit<M_te_xml_applications.UpdateTexmlApplicationRequest, "id">>;

/**
 * Attributes of a deployed {@link TeXMLApplication}: the object as the Telnyx API returns it.
 */
export type TeXMLApplicationAttributes = NonNullable<
  M_te_xml_applications.GetTexmlApplicationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link TeXMLApplication} for `TeXMLApplication.lookup`.
 */
export interface TeXMLApplicationLookup {
  id: string;
}

export type TeXMLApplication = Resource<
  "Telnyx.Voice.TeXMLApplication",
  TeXMLApplicationProps,
  TeXMLApplicationAttributes,
  never,
  Providers,
  TeXMLApplicationLookup
>;

/**
 * A TeXML application, which runs TeXML instructions from your webhook on calls.
 *
 * @resource
 * @product Voice
 */
export const TeXMLApplication = Resource<TeXMLApplication>("Telnyx.Voice.TeXMLApplication");

export const TeXMLApplicationProvider = () =>
  Crud.provider(TeXMLApplication, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_te_xml_applications.getTexmlApplication(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TeXMLApplicationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_te_xml_applications.createTexmlApplication({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<TeXMLApplicationAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_te_xml_applications.updateTexmlApplication({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<TeXMLApplicationAttributes, any, any>,
    delete: (current) =>
      M_te_xml_applications.deleteTexmlApplication({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_te_xml_applications.findTexmlApplications,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
