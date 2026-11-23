// Telnyx policy attachment: telnyx_agent_gateway_policy_attachment in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_policy_attachments from "#telnyx/services/agent_gateway_policy_attachments.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PolicyAttachment}: the create request of the Telnyx API.
 */
export type PolicyAttachmentProps = Omit<
  M_agent_gateway_policy_attachments.CreateAgentGatewayPolicyAttachmentRequest,
  "instance_id" | "attachment_id"
> & {
  /**
   * The gateway id.
   */
  gateway_id: string;
};

/**
 * Attributes of a deployed {@link PolicyAttachment}: the object as the Telnyx API returns it.
 */
export type PolicyAttachmentAttributes = NonNullable<
  M_agent_gateway_policy_attachments.AgentGatewayPolicyAttachmentListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link PolicyAttachment} for `PolicyAttachment.lookup`.
 */
export interface PolicyAttachmentLookup {
  gateway_id: string;
  id: string;
}

export type PolicyAttachment = Resource<
  "Telnyx.AgentGateway.PolicyAttachment",
  PolicyAttachmentProps,
  PolicyAttachmentAttributes,
  never,
  Providers,
  PolicyAttachmentLookup
>;

/**
 * Where an Agent Gateway applies a policy. It has no update, so every change replaces it.
 *
 * Changing `default`, `gateway_id`, `models`, `policy`, `priority` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const PolicyAttachment = Resource<PolicyAttachment>("Telnyx.AgentGateway.PolicyAttachment");

export const PolicyAttachmentProvider = () =>
  Crud.provider(PolicyAttachment, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["default", "gateway_id", "models", "policy", "priority"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_policy_attachments.listAgentGatewayPolicyAttachments,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<PolicyAttachmentAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_policy_attachments.createAgentGatewayPolicyAttachment({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PolicyAttachmentAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_policy_attachments.deleteAgentGatewayPolicyAttachment({
        ...Crud.path(current, { instance_id: "gateway_id", attachment_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
