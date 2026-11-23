// Telnyx texml queue: telnyx_texml_queue in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_te_xml_rest_commands from "#telnyx/services/te_xml_rest_commands.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TeXMLQueue}: the create request and the update request of the Telnyx API.
 */
export type TeXMLQueueProps = Omit<
  M_te_xml_rest_commands.CreateTexmlQueueRequest,
  "account_sid" | "queue_sid"
> &
  Partial<Omit<M_te_xml_rest_commands.UpdateTexmlQueueRequest, "account_sid" | "queue_sid">> & {
    /**
     * The id of the account the resource belongs to.
     */
    account_sid: string;
  };

/**
 * Attributes of a deployed {@link TeXMLQueue}: the object as the Telnyx API returns it.
 */
export type TeXMLQueueAttributes = M_te_xml_rest_commands.QueueResource & { sid: string };

/**
 * Identifies an existing {@link TeXMLQueue} for `TeXMLQueue.lookup`.
 */
export interface TeXMLQueueLookup {
  account_sid: string;
  sid: string;
}

export type TeXMLQueue = Resource<
  "Telnyx.Voice.TeXMLQueue",
  TeXMLQueueProps,
  TeXMLQueueAttributes,
  never,
  Providers,
  TeXMLQueueLookup
>;

/**
 * A queue of TeXML calls in an account.
 *
 * Changing `account_sid`, `FriendlyName` replaces it.
 *
 * @resource
 * @product Voice
 */
export const TeXMLQueue = Resource<TeXMLQueue>("Telnyx.Voice.TeXMLQueue");

export const TeXMLQueueProvider = () =>
  Crud.provider(TeXMLQueue, {
    local: ["account_sid", "sid"],
    stables: ["sid"] as any,
    replaceOn: ["account_sid", "FriendlyName"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { account_sid: "account_sid", queue_sid: "sid" });
      return k
        ? (M_te_xml_rest_commands.getTexmlQueue(k as any) as Effect.Effect<
            TeXMLQueueAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_te_xml_rest_commands.createTexmlQueue({
        ...props,
        ...Crud.path(props, { account_sid: "account_sid" }),
      } as any) as Effect.Effect<TeXMLQueueAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_te_xml_rest_commands.updateTexmlQueue({
        ...delta,
        ...Crud.path({ ...props, ...current }, { account_sid: "account_sid", queue_sid: "sid" }),
      } as any) as Effect.Effect<TeXMLQueueAttributes, any, any>,
    delete: (current) =>
      M_te_xml_rest_commands.deleteTexmlQueue({
        ...Crud.path(current, { account_sid: "account_sid", queue_sid: "sid" }),
      } as any).pipe(Effect.asVoid),
    normalize: (obj) =>
      // Takes Twilio-style form fields (MaxSize), answers in snake_case (max_size).
      Effect.succeed(
        "max_size" in (obj as object)
          ? Hooks.withField(obj, "MaxSize", (obj as any).max_size)
          : obj,
      ),
  });
