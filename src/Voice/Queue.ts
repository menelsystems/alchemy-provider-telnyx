// Telnyx queue: telnyx_queue in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_queue_commands from "../../vendor/distilled-telnyx/src/services/queue_commands.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Queue}: the create request and the update request of the Telnyx API.
 */
export type QueueProps = Omit<M_queue_commands.CreateQueueRequest, "queue_name"> &
  Partial<Omit<M_queue_commands.UpdateQueueRequest, "queue_name">> & {
    /**
     * The name of the queue. Must be between 1 and 255 characters.
     */
    queue_name: string;
  };

/**
 * Attributes of a deployed {@link Queue}: the object as the Telnyx API returns it.
 */
export type QueueAttributes = NonNullable<M_queue_commands.GetCallQueueResponse["data"]> & {
  queue_name: string;
};

/**
 * Identifies an existing {@link Queue} for `Queue.lookup`.
 */
export interface QueueLookup {
  queue_name: string;
}

export type Queue = Resource<
  "Telnyx.Voice.Queue",
  QueueProps,
  QueueAttributes,
  never,
  Providers,
  QueueLookup
>;

/**
 * A call queue for Call Control applications.
 *
 * Changing `queue_name` replaces it.
 *
 * @resource
 * @product Voice
 */
export const Queue = Resource<Queue>("Telnyx.Voice.Queue");

export const QueueProvider = () =>
  Crud.provider(Queue, {
    local: ["queue_name"],
    stables: ["queue_name"] as any,
    replaceOn: ["queue_name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { queue_name: "queue_name" });
      return k
        ? (M_queue_commands.getCallQueue(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            QueueAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_queue_commands.createQueue({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<QueueAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_queue_commands.updateQueue({
        ...delta,
        ...Crud.path({ ...props, ...current }, { queue_name: "queue_name" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<QueueAttributes, any, any>,
    delete: (current) =>
      M_queue_commands.deleteQueue({
        ...Crud.path(current, { queue_name: "queue_name" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_queue_commands.listQueues, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
