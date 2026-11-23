// Telnyx unsubscribe group: telnyx_email_unsubscribe_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_unsubscribe_groups from "../../vendor/distilled-telnyx/src/services/email_unsubscribe_groups.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UnsubscribeGroup}: the create request and the update request of the Telnyx API.
 */
export type UnsubscribeGroupProps = Omit<
  M_email_unsubscribe_groups.CreateUnsubscribeGroupRequest,
  "id"
> &
  Partial<Omit<M_email_unsubscribe_groups.UpdateUnsubscribeGroupRequest, "id">> & {
    /**
     * Whether destroy forces the deletion (sends `force=true`), for example of an object that is in use. Destroy uses the value in state, so set it to true and apply before destroying.
     */
    force_destroy?: boolean;
  };

/**
 * Attributes of a deployed {@link UnsubscribeGroup}: the object as the Telnyx API returns it.
 */
export type UnsubscribeGroupAttributes = NonNullable<
  M_email_unsubscribe_groups.UnsubscribeGroupResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link UnsubscribeGroup} for `UnsubscribeGroup.lookup`.
 */
export interface UnsubscribeGroupLookup {
  id: string;
}

export type UnsubscribeGroup = Resource<
  "Telnyx.Email.UnsubscribeGroup",
  UnsubscribeGroupProps,
  UnsubscribeGroupAttributes,
  never,
  Providers,
  UnsubscribeGroupLookup
>;

/**
 * A group of email recipients can unsubscribe from, such as newsletters, without opting out of all mail.
 *
 * Set `force_destroy: true` to delete it while in use.
 *
 * @resource
 * @product Email
 */
export const UnsubscribeGroup = Resource<UnsubscribeGroup>("Telnyx.Email.UnsubscribeGroup");

export const UnsubscribeGroupProvider = () =>
  Crud.provider(UnsubscribeGroup, {
    local: ["force_destroy", "id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_email_unsubscribe_groups.getUnsubscribeGroup(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<UnsubscribeGroupAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_unsubscribe_groups.createUnsubscribeGroup({
        ...Crud.omit(props, ["force_destroy"]),
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UnsubscribeGroupAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_email_unsubscribe_groups.updateUnsubscribeGroup({
        ...Crud.omit(delta, ["force_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UnsubscribeGroupAttributes, any, any>,
    delete: (current) =>
      M_email_unsubscribe_groups.deleteUnsubscribeGroup({
        ...Crud.path(current, { id: "id" }),
        ...(current.force_destroy ? { force: true } : {}),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_email_unsubscribe_groups.listUnsubscribeGroups,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
