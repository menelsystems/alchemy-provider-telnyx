// Telnyx call control application: telnyx_call_control_application in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_call_control_applications from "../../vendor/distilled-telnyx/src/services/call_control_applications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CallControlApplication}: the create request and the update request of the Telnyx API.
 */
export type CallControlApplicationProps = Omit<
  M_call_control_applications.CreateCallControlApplicationRequest,
  "id"
> &
  Partial<Omit<M_call_control_applications.UpdateCallControlApplicationRequest, "id">>;

/**
 * Attributes of a deployed {@link CallControlApplication}: the object as the Telnyx API returns it.
 */
export type CallControlApplicationAttributes = NonNullable<
  M_call_control_applications.GetCallControlApplicationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link CallControlApplication} for `CallControlApplication.lookup`.
 */
export interface CallControlApplicationLookup {
  id: string;
}

export type CallControlApplication = Resource<
  "Telnyx.Voice.CallControlApplication",
  CallControlApplicationProps,
  CallControlApplicationAttributes,
  never,
  Providers,
  CallControlApplicationLookup
>;

/**
 * A Call Control application, which sends call events to a webhook and takes call commands.
 *
 * @resource
 * @product Voice
 */
export const CallControlApplication = Resource<CallControlApplication>(
  "Telnyx.Voice.CallControlApplication",
);

export const CallControlApplicationProvider = () =>
  Crud.provider(CallControlApplication, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_call_control_applications.getCallControlApplication(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<CallControlApplicationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_call_control_applications.createCallControlApplication({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CallControlApplicationAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_call_control_applications.updateCallControlApplication({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CallControlApplicationAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_call_control_applications.deleteCallControlApplication({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_call_control_applications.listCallControlApplications,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
