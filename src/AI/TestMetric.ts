// Telnyx test metric: telnyx_ai_test_metric in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_tests from "../../vendor/distilled-telnyx/src/services/ai_tests.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TestMetric}: the create request and the update request of the Telnyx API.
 */
export type TestMetricProps = Omit<M_ai_tests.CreateTestMetricRequest, "id"> &
  Partial<Omit<M_ai_tests.UpdateTestMetricRequest, "id">>;

/**
 * Attributes of a deployed {@link TestMetric}: the object as the Telnyx API returns it.
 */
export type TestMetricAttributes = M_ai_tests.AiTestMetric & { id: string };

/**
 * Identifies an existing {@link TestMetric} for `TestMetric.lookup`.
 */
export interface TestMetricLookup {
  id: string;
}

export type TestMetric = Resource<
  "Telnyx.AI.TestMetric",
  TestMetricProps,
  TestMetricAttributes,
  never,
  Providers,
  TestMetricLookup
>;

/**
 * A metric of the AI test framework, which grades test conversations of the agents it applies to.
 *
 * Changing `assistant_id` replaces it.
 *
 * @resource
 * @product AI
 */
export const TestMetric = Resource<TestMetric>("Telnyx.AI.TestMetric");

export const TestMetricProvider = () =>
  Crud.provider(TestMetric, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["assistant_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_tests.getTestMetric(k as any) as Effect.Effect<TestMetricAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_tests.createTestMetric({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        TestMetricAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_ai_tests.updateTestMetric({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<TestMetricAttributes, any, any>,
    delete: (current) =>
      M_ai_tests.deleteTestMetric({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ai_tests.listTestMetrics, {} as any, "none") as Effect.Effect<any, any, any>,
  });
