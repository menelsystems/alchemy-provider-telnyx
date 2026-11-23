// Telnyx tool: telnyx_ai_tool in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as M_assistants from "../../vendor/distilled-telnyx/src/services/assistants.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Tool}: the create request and the update request of the Telnyx API.
 */
export type ToolProps = Omit<M_assistants.CreateToolPostRequest, "tool_id" | "idempotencyKey"> &
  Partial<Omit<M_assistants.UpdateToolToolIdRequest, "tool_id">>;

/**
 * Attributes of a deployed {@link Tool}: the object as the Telnyx API returns it.
 */
export type ToolAttributes = M_assistants.SharedToolResponse & { id: string };

/**
 * Identifies an existing {@link Tool} for `Tool.lookup`.
 */
export interface ToolLookup {
  id: string;
}

export type Tool = Resource<
  "Telnyx.AI.Tool",
  ToolProps,
  ToolAttributes,
  never,
  Providers,
  ToolLookup
>;

/**
 * A shared tool that AI assistants can use, such as a webhook, a handoff or a retrieval.
 *
 * @resource
 * @product AI
 */
export const Tool = Resource<Tool>("Telnyx.AI.Tool");

/** A tool's settings must sit under the attribute named by its type. */
export class ToolTypeMismatch extends Schema.TaggedError<ToolTypeMismatch>()("ToolTypeMismatch", {
  message: Schema.String,
}) {}

const TOOL_VARIANTS = [
  "function",
  "retrieval",
  "handoff",
  "invite",
  "webhook",
  "pay",
  "client_side_tool",
  "update_dynamic_variables",
  "vision",
] as const;

export const ToolProvider = () =>
  Crud.provider(Tool, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { tool_id: "id" });
      return k
        ? (M_assistants.getToolToolId(k as any) as Effect.Effect<ToolAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_assistants.createToolPost({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        ToolAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_assistants.updateToolToolId({
        ...delta,
        ...Crud.path({ ...props, ...current }, { tool_id: "id" }),
      } as any) as Effect.Effect<ToolAttributes, any, any>,
    delete: (current) =>
      M_assistants.deleteToolToolId({ ...Crud.path(current, { tool_id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_assistants.listTools, {} as any, "page-flat") as Effect.Effect<any, any, any>,
    validate: (props) => {
      const type = (props as any).type as string | undefined;
      const wrong = TOOL_VARIANTS.find((v) => v !== type && (props as any)[v] !== undefined);
      return wrong
        ? Effect.fail(
            new ToolTypeMismatch({
              message: `type is "${type}", so set ${type} instead of ${wrong}.`,
            }),
          )
        : Effect.void;
    },
    replaceIf: ({ news, olds }) =>
      // The API does not change a tool's type in place.
      Effect.succeed((olds as any).type !== undefined && (olds as any).type !== (news as any).type),
    normalize: (obj) => {
      // Settings go in under the type's name and come back as tool_definition.
      const type = (obj as any).type as string | undefined;
      const def = (obj as any).tool_definition;
      return Effect.succeed(
        type && def && !(type in (obj as object)) ? Hooks.withField(obj, type, def) : obj,
      );
    },
  });
