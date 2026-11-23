// Telnyx rcs agent test device: telnyx_rcs_agent_test_device in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_rcs_agents from "../../vendor/distilled-telnyx/src/services/rcs_agents.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link RCSAgentTestDevice}: the create request of the Telnyx API.
 */
export type RCSAgentTestDeviceProps = Omit<
  M_rcs_agents.AddRcsAgentTestDeviceRequest,
  "id" | "test_device_id"
> & {
  /**
   * The agent id.
   */
  agent_id: string;
};

/**
 * Attributes of a deployed {@link RCSAgentTestDevice}: the object as the Telnyx API returns it.
 */
export type RCSAgentTestDeviceAttributes = M_rcs_agents.ListRcsAgentTestDevicesResponse[number] & {
  test_device_id: string;
};

/**
 * Identifies an existing {@link RCSAgentTestDevice} for `RCSAgentTestDevice.lookup`.
 */
export interface RCSAgentTestDeviceLookup {
  agent_id: string;
  test_device_id: string;
}

export type RCSAgentTestDevice = Resource<
  "Telnyx.Messaging.RCSAgentTestDevice",
  RCSAgentTestDeviceProps,
  RCSAgentTestDeviceAttributes,
  never,
  Providers,
  RCSAgentTestDeviceLookup
>;

/**
 * A test device invited to an RCS agent, which can receive the agent's messages before launch.
 *
 * Changing `agent_id`, `phone_number` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const RCSAgentTestDevice = Resource<RCSAgentTestDevice>(
  "Telnyx.Messaging.RCSAgentTestDevice",
);

export const RCSAgentTestDeviceProvider = () =>
  Crud.provider(RCSAgentTestDevice, {
    local: ["agent_id", "test_device_id"],
    stables: ["test_device_id"] as any,
    replaceOn: ["agent_id", "phone_number"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "test_device_id" });
      const parent = Crud.key(ref, { id: "agent_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_rcs_agents.listRcsAgentTestDevices, { ...parent } as any, "none").pipe(
        Effect.map((items) =>
          (items as any[]).find((it) => String(it?.["test_device_id"]) === id.id),
        ),
      ) as Effect.Effect<RCSAgentTestDeviceAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_rcs_agents.addRcsAgentTestDevice({
        ...Crud.omit(props, ["agent_id"]),
        ...Crud.path(props, { id: "agent_id" }),
      } as any) as Effect.Effect<RCSAgentTestDeviceAttributes, any, any>,
    delete: (current) =>
      M_rcs_agents.removeRcsAgentTestDevice({
        ...Crud.path(current, { id: "agent_id", test_device_id: "test_device_id" }),
      } as any).pipe(Effect.asVoid),
  });
