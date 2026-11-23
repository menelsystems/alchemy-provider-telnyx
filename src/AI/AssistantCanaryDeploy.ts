// Telnyx assistant canary deploy: telnyx_ai_assistant_canary_deploy in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_assistants from "#telnyx/services/assistants.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AssistantCanaryDeploy}: the create request and the update request of the Telnyx API.
 */
export type AssistantCanaryDeployProps = Omit<
  M_assistants.CreateCanaryDeployAssistantsAssistantIdCanaryDeploysPostRequest,
  "assistant_id" | "idempotencyKey"
> &
  Partial<
    Omit<
      M_assistants.UpdateCanaryDeployAssistantsAssistantIdCanaryDeploysPutRequest,
      "assistant_id"
    >
  > & {
    /**
     * The assistant id.
     */
    assistant_id: string;
  };

/**
 * Attributes of a deployed {@link AssistantCanaryDeploy}: the object as the Telnyx API returns it.
 */
export type AssistantCanaryDeployAttributes = M_assistants.CanaryDeployResponse & {
  assistant_id: string;
};

/**
 * Identifies an existing {@link AssistantCanaryDeploy} for `AssistantCanaryDeploy.lookup`.
 */
export interface AssistantCanaryDeployLookup {
  assistant_id: string;
}

export type AssistantCanaryDeploy = Resource<
  "Telnyx.AI.AssistantCanaryDeploy",
  AssistantCanaryDeployProps,
  AssistantCanaryDeployAttributes,
  never,
  Providers,
  AssistantCanaryDeployLookup
>;

/**
 * The canary deployment of an AI assistant, which routes matching conversations to other versions of the assistant. An assistant has at most one.
 *
 * Changing `assistant_id` replaces it.
 *
 * @resource
 * @product AI
 */
export const AssistantCanaryDeploy = Resource<AssistantCanaryDeploy>(
  "Telnyx.AI.AssistantCanaryDeploy",
);

export const AssistantCanaryDeployProvider = () =>
  Crud.provider(AssistantCanaryDeploy, {
    local: ["assistant_id"],
    stables: ["assistant_id"] as any,
    replaceOn: ["assistant_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { assistant_id: "assistant_id" });
      return k
        ? (M_assistants.getCanaryDeployAssistantsAssistantIdCanaryDeploysGet(
            k as any,
          ) as Effect.Effect<AssistantCanaryDeployAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_assistants.createCanaryDeployAssistantsAssistantIdCanaryDeploysPost({
        ...props,
        ...Crud.path(props, { assistant_id: "assistant_id" }),
      } as any) as Effect.Effect<AssistantCanaryDeployAttributes, any, any>,
    update: ({ current, props }) =>
      M_assistants.updateCanaryDeployAssistantsAssistantIdCanaryDeploysPut({
        ...props,
        ...Crud.path({ ...props, ...current }, { assistant_id: "assistant_id" }),
      } as any) as Effect.Effect<AssistantCanaryDeployAttributes, any, any>,
    delete: (current) =>
      M_assistants.deleteCanaryDeployAssistantsAssistantIdCanaryDeploysDelete({
        ...Crud.path(current, { assistant_id: "assistant_id" }),
      } as any).pipe(Effect.asVoid),
  });
