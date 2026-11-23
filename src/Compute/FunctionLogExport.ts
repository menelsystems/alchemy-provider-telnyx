// Telnyx function log export: telnyx_compute_function_log_export in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_functions from "#telnyx/services/functions.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link FunctionLogExport}: the create request of the Telnyx API.
 */
export type FunctionLogExportProps = Omit<M_functions.ExportSetComputeFunctionLogRequest, "id"> & {
  /**
   * The function id.
   */
  function_id: string;
};

/**
 * Attributes of a deployed {@link FunctionLogExport}: the object as the Telnyx API returns it.
 */
export type FunctionLogExportAttributes = NonNullable<
  M_functions.FuncLogExportConfigResponse["data"]
> & { function_id: string };

/**
 * Identifies an existing {@link FunctionLogExport} for `FunctionLogExport.lookup`.
 */
export interface FunctionLogExportLookup {
  function_id: string;
}

export type FunctionLogExport = Resource<
  "Telnyx.Compute.FunctionLogExport",
  FunctionLogExportProps,
  FunctionLogExportAttributes,
  never,
  Providers,
  FunctionLogExportLookup
>;

/**
 * Where a compute function's logs are exported to.
 *
 * Changing `function_id` replaces it.
 *
 * @resource
 * @product Compute
 */
export const FunctionLogExport = Resource<FunctionLogExport>("Telnyx.Compute.FunctionLogExport");

export const FunctionLogExportProvider = () =>
  Crud.provider(FunctionLogExport, {
    local: ["function_id"],
    stables: ["function_id"] as any,
    replaceOn: ["function_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "function_id" });
      return k
        ? (M_functions.getComputeFunctionLogExport(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<FunctionLogExportAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_functions.exportSetComputeFunctionLog({
        ...Crud.omit(props, ["function_id"]),
        ...Crud.path(props, { id: "function_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FunctionLogExportAttributes, any, any>,
    update: ({ current, props }) =>
      M_functions.exportSetComputeFunctionLog({
        ...Crud.omit(props, ["function_id"]),
        ...Crud.path({ ...props, ...current }, { id: "function_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FunctionLogExportAttributes, any, any>,
    delete: (current) =>
      M_functions.deleteComputeFunctionLogExport({
        ...Crud.path(current, { id: "function_id" }),
      } as any).pipe(Effect.asVoid),
  });
