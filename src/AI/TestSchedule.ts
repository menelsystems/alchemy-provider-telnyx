// Telnyx test schedule: telnyx_ai_test_schedule in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_tests from "../../vendor/distilled-telnyx/src/services/ai_tests.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TestSchedule}: the create request and the update request of the Telnyx API.
 */
export type TestScheduleProps = Omit<M_ai_tests.CreateScheduledTestJobRequest, "id"> &
  Partial<Omit<M_ai_tests.UpdateScheduledTestJobRequest, "id">>;

/**
 * Attributes of a deployed {@link TestSchedule}: the object as the Telnyx API returns it.
 */
export type TestScheduleAttributes = M_ai_tests.ScheduledTestJob & { id: string };

/**
 * Identifies an existing {@link TestSchedule} for `TestSchedule.lookup`.
 */
export interface TestScheduleLookup {
  id: string;
}

export type TestSchedule = Resource<
  "Telnyx.AI.TestSchedule",
  TestScheduleProps,
  TestScheduleAttributes,
  never,
  Providers,
  TestScheduleLookup
>;

/**
 * A schedule that runs AI test framework scenarios on a cron expression.
 *
 * @resource
 * @product AI
 */
export const TestSchedule = Resource<TestSchedule>("Telnyx.AI.TestSchedule");

export const TestScheduleProvider = () =>
  Crud.provider(TestSchedule, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_tests.getScheduledTestJob(k as any) as Effect.Effect<
            TestScheduleAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_tests.createScheduledTestJob({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<TestScheduleAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ai_tests.updateScheduledTestJob({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<TestScheduleAttributes, any, any>,
    delete: (current) =>
      M_ai_tests.deleteScheduledTestJob({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ai_tests.listScheduledTestJobs, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
