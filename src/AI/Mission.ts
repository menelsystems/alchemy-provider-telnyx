// Telnyx mission: telnyx_ai_mission in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_missions from "#telnyx/services/missions.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Mission}: the create request and the update request of the Telnyx API.
 */
export type MissionProps = Omit<M_missions.PostPublicMissionsMissionsRequest, "mission_id"> &
  Partial<Omit<M_missions.PutPublicMissionsMissionsMissionIdRequest, "mission_id">>;

/**
 * Attributes of a deployed {@link Mission}: the object as the Telnyx API returns it.
 */
export type MissionAttributes = NonNullable<M_missions.MissionResponse["data"]> & {
  mission_id: string;
};

/**
 * Identifies an existing {@link Mission} for `Mission.lookup`.
 */
export interface MissionLookup {
  mission_id: string;
}

export type Mission = Resource<
  "Telnyx.AI.Mission",
  MissionProps,
  MissionAttributes,
  never,
  Providers,
  MissionLookup
>;

/**
 * An AI mission, a long-running task an AI agent carries out with its own model, instructions and tools.
 *
 * @resource
 * @product AI
 */
export const Mission = Resource<Mission>("Telnyx.AI.Mission");

export const MissionProvider = () =>
  Crud.provider(Mission, {
    local: ["mission_id"],
    stables: ["mission_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { mission_id: "mission_id" });
      return k
        ? (M_missions.getPublicMissionsMissionsMissionId(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MissionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_missions.postPublicMissionsMissions({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MissionAttributes, any, any>,
    update: ({ current, props }) =>
      M_missions.putPublicMissionsMissionsMissionId({
        ...props,
        ...Crud.path({ ...props, ...current }, { mission_id: "mission_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MissionAttributes, any, any>,
    delete: (current) =>
      M_missions.deletePublicMissionsMissionsMissionId({
        ...Crud.path(current, { mission_id: "mission_id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_missions.getPublicMissionsMissions, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
