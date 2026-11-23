// Telnyx assistant test: telnyx_ai_assistant_test in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_assistants from "../../vendor/distilled-telnyx/src/services/assistants.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AssistantTest}: the create request and the update request of the Telnyx API.
 */
export type AssistantTestProps = Omit<
  M_assistants.CreateAssistantTestPublicAssistantsTestsPostRequest,
  "test_id" | "idempotencyKey"
> &
  Partial<Omit<M_assistants.UpdateAssistantTestPublicAssistantsTestsTestIdPutRequest, "test_id">>;

/**
 * Attributes of a deployed {@link AssistantTest}: the object as the Telnyx API returns it.
 */
export type AssistantTestAttributes = M_assistants.AssistantTestResponse & { test_id: string };

/**
 * Identifies an existing {@link AssistantTest} for `AssistantTest.lookup`.
 */
export interface AssistantTestLookup {
  test_id: string;
}

export type AssistantTest = Resource<
  "Telnyx.AI.AssistantTest",
  AssistantTestProps,
  AssistantTestAttributes,
  never,
  Providers,
  AssistantTestLookup
>;

/**
 * A test that has a simulated user talk to an AI assistant and grades the conversation against a rubric.
 *
 * @resource
 * @product AI
 */
export const AssistantTest = Resource<AssistantTest>("Telnyx.AI.AssistantTest");

export const AssistantTestProvider = () =>
  Crud.provider(AssistantTest, {
    local: ["test_id"],
    stables: ["test_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { test_id: "test_id" });
      return k
        ? (M_assistants.getAssistantTestPublicAssistantsTestsTestIdGet(k as any) as Effect.Effect<
            AssistantTestAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_assistants.createAssistantTestPublicAssistantsTestsPost({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<AssistantTestAttributes, any, any>,
    update: ({ current, props }) =>
      M_assistants.updateAssistantTestPublicAssistantsTestsTestIdPut({
        ...props,
        ...Crud.path({ ...props, ...current }, { test_id: "test_id" }),
      } as any) as Effect.Effect<AssistantTestAttributes, any, any>,
    delete: (current) =>
      M_assistants.deleteAssistantTestPublicAssistantsTestsTestIdDelete({
        ...Crud.path(current, { test_id: "test_id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_assistants.getAssistantTestsPublicAssistantsTestsGet,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
