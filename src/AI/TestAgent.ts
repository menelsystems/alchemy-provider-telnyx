// Telnyx test agent: telnyx_ai_test_agent in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_tests from "#telnyx/services/ai_tests.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TestAgent}: the create request and the update request of the Telnyx API.
 */
export type TestAgentProps = Omit<M_ai_tests.CreateTestAgentRequest, "id"> &
  Partial<Omit<M_ai_tests.UpdateTestAgentRequest, "id">>;

/**
 * Attributes of a deployed {@link TestAgent}: the object as the Telnyx API returns it.
 */
export type TestAgentAttributes = M_ai_tests.TestAgent & { id: string };

/**
 * Identifies an existing {@link TestAgent} for `TestAgent.lookup`.
 */
export interface TestAgentLookup {
  id: string;
}

export type TestAgent = Resource<
  "Telnyx.AI.TestAgent",
  TestAgentProps,
  TestAgentAttributes,
  never,
  Providers,
  TestAgentLookup
>;

/**
 * A test agent of the AI test framework: the AI assistant under test and how simulated conversations reach it.
 *
 * @resource
 * @product AI
 */
export const TestAgent = Resource<TestAgent>("Telnyx.AI.TestAgent");

export const TestAgentProvider = () =>
  Crud.provider(TestAgent, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_tests.getTestAgent(k as any) as Effect.Effect<TestAgentAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_tests.createTestAgent({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        TestAgentAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_ai_tests.updateTestAgent({
        ...props,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<TestAgentAttributes, any, any>,
    delete: (current) =>
      M_ai_tests.deleteTestAgent({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ai_tests.listTestAgents, {} as any, "page-records") as Effect.Effect<
        any,
        any,
        any
      >,
  });
