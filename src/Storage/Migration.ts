// Telnyx migration: telnyx_storage_migration in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_data_migration from "#telnyx/services/data_migration.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Migration}: the create request of the Telnyx API.
 */
export type MigrationProps = Omit<M_data_migration.CreateMigrationRequest, "id">;

/**
 * Attributes of a deployed {@link Migration}: the object as the Telnyx API returns it.
 */
export type MigrationAttributes = NonNullable<M_data_migration.GetMigrationResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Migration} for `Migration.lookup`.
 */
export interface MigrationLookup {
  id: string;
}

export type Migration = Resource<
  "Telnyx.Storage.Migration",
  MigrationProps,
  MigrationAttributes,
  never,
  Providers,
  MigrationLookup
>;

/**
 * A migration that copies a bucket from a migration source into Telnyx Storage. The API cannot delete migrations; stop one with the telnyx_storage_migration_stop action.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `refresh`, `source_id`, `target_bucket_name`, `target_region` replaces it.
 *
 * @resource
 * @product Storage
 */
export const Migration = Resource<Migration>("Telnyx.Storage.Migration");

export const MigrationProvider = () =>
  Crud.provider(Migration, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["refresh", "source_id", "target_bucket_name", "target_region"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_data_migration.getMigration(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            MigrationAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_data_migration.createMigration({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MigrationAttributes, any, any>,
    list: () =>
      Paging.all(M_data_migration.listMigrations, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete storage migrations. The migration was removed from Alchemy state but still exists in your Telnyx account.",
  });
