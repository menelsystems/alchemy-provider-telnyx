// Telnyx sql database: telnyx_storage_sql_database in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_sql_databases from "#telnyx/services/sql_databases.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SQLDatabase}: the create request of the Telnyx API.
 */
export type SQLDatabaseProps = Omit<M_sql_databases.CreateSqlDatabaseRequest, "id">;

/**
 * Attributes of a deployed {@link SQLDatabase}: the object as the Telnyx API returns it.
 */
export type SQLDatabaseAttributes = NonNullable<
  M_sql_databases.SqlDatabaseResponseWrapper["data"]
> & { id: string };

/**
 * Identifies an existing {@link SQLDatabase} for `SQLDatabase.lookup`.
 */
export interface SQLDatabaseLookup {
  id: string;
}

export type SQLDatabase = Resource<
  "Telnyx.Storage.SQLDatabase",
  SQLDatabaseProps,
  SQLDatabaseAttributes,
  never,
  Providers,
  SQLDatabaseLookup
>;

/**
 * A SQL database in Telnyx Storage.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product Storage
 */
export const SQLDatabase = Resource<SQLDatabase>("Telnyx.Storage.SQLDatabase");

export const SQLDatabaseProvider = () =>
  Crud.provider(SQLDatabase, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_sql_databases.getSqlDatabase(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            SQLDatabaseAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_sql_databases.createSqlDatabase({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<SQLDatabaseAttributes, any, any>,
    delete: (current) =>
      M_sql_databases.deleteSqlDatabase({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_sql_databases.listSqlDatabases, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    wait: (created) =>
      // Provisioned asynchronously: keys and queries answer 409 until provision_ok.
      Hooks.waitForStatus(
        M_sql_databases.getSqlDatabase({ id: created.id } as any).pipe(Effect.map(Crud.data)),
        {
          ready: ["provision_ok", ""],
          failed: ["provision_failed", "deleting", "delete_failed"],
          what: `SQLDatabase ${created.id}`,
          every: "2 seconds",
        },
      ) as Effect.Effect<SQLDatabaseAttributes, any, any>,
  });
