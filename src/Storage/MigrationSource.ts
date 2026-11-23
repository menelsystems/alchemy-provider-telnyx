// Telnyx migration source: telnyx_storage_migration_source in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_data_migration from "#telnyx/services/data_migration.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MigrationSource}: the create request of the Telnyx API.
 */
export type MigrationSourceProps = Omit<M_data_migration.CreateMigrationSourceRequest, "id">;

/**
 * Attributes of a deployed {@link MigrationSource}: the object as the Telnyx API returns it.
 */
export type MigrationSourceAttributes = NonNullable<
  M_data_migration.GetMigrationSourceResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link MigrationSource} for `MigrationSource.lookup`.
 */
export interface MigrationSourceLookup {
  id: string;
}

export type MigrationSource = Resource<
  "Telnyx.Storage.MigrationSource",
  MigrationSourceProps,
  MigrationSourceAttributes,
  never,
  Providers,
  MigrationSourceLookup
>;

/**
 * A bucket in another cloud that storage migrations copy from, with the credentials to read it.
 *
 * Changing `bucket_name`, `provider_auth`, `provider`, `source_region` replaces it.
 *
 * @resource
 * @product Storage
 */
export const MigrationSource = Resource<MigrationSource>("Telnyx.Storage.MigrationSource");

export const MigrationSourceProvider = () =>
  Crud.provider(MigrationSource, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["bucket_name", "provider_auth", "provider", "source_region"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_data_migration.getMigrationSource(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MigrationSourceAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_data_migration.createMigrationSource({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MigrationSourceAttributes, any, any>,
    delete: (current) =>
      M_data_migration.deleteMigrationSource({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_data_migration.listMigrationSources, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
