// Telnyx test scenario: telnyx_ai_test_scenario in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_tests from "../../vendor/distilled-telnyx/src/services/ai_tests.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TestScenario}: the create request and the update request of the Telnyx API.
 */
export type TestScenarioProps = Omit<M_ai_tests.CreateEvaluatorScenarioRequest, "id"> &
  Partial<Omit<M_ai_tests.UpdateEvaluatorScenarioRequest, "id">>;

/**
 * Attributes of a deployed {@link TestScenario}: the object as the Telnyx API returns it.
 */
export type TestScenarioAttributes = M_ai_tests.EvaluatorScenarioDetail & { id: string };

/**
 * Identifies an existing {@link TestScenario} for `TestScenario.lookup`.
 */
export interface TestScenarioLookup {
  id: string;
}

export type TestScenario = Resource<
  "Telnyx.AI.TestScenario",
  TestScenarioProps,
  TestScenarioAttributes,
  never,
  Providers,
  TestScenarioLookup
>;

/**
 * A scenario of the AI test framework, a simulated conversation with a personality, instructions and the metrics that grade it.
 *
 * @resource
 * @product AI
 */
export const TestScenario = Resource<TestScenario>("Telnyx.AI.TestScenario");

export const TestScenarioProvider = () =>
  Crud.provider(TestScenario, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_tests.getEvaluatorScenario(k as any) as Effect.Effect<
            TestScenarioAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_tests.createEvaluatorScenario({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<TestScenarioAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ai_tests.updateEvaluatorScenario({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<TestScenarioAttributes, any, any>,
    delete: (current) =>
      M_ai_tests.deleteEvaluatorScenario({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ai_tests.listEvaluatorScenarios, {} as any, "page-records") as Effect.Effect<
        any,
        any,
        any
      >,
  });
