// Telnyx cloudfs filesystem: telnyx_storage_cloudfs_filesystem in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_cloudfs_filesystems from "../../vendor/distilled-telnyx/src/services/cloudfs_filesystems.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CloudFSFilesystem}: the create request and the update request of the Telnyx API.
 */
export type CloudFSFilesystemProps = Omit<
  M_cloudfs_filesystems.CreateCloudfsFilesystemRequest,
  "id" | "idempotencyKey"
> &
  Partial<Omit<M_cloudfs_filesystems.UpdateCloudfsFilesystemRequest, "id">>;

/**
 * Attributes of a deployed {@link CloudFSFilesystem}: the object as the Telnyx API returns it.
 */
export type CloudFSFilesystemAttributes = NonNullable<
  M_cloudfs_filesystems.CloudfsFilesystemDetailResponseWrapper["data"]
> & { id: string };

/**
 * Identifies an existing {@link CloudFSFilesystem} for `CloudFSFilesystem.lookup`.
 */
export interface CloudFSFilesystemLookup {
  id: string;
}

export type CloudFSFilesystem = Resource<
  "Telnyx.Storage.CloudFSFilesystem",
  CloudFSFilesystemProps,
  CloudFSFilesystemAttributes,
  never,
  Providers,
  CloudFSFilesystemLookup
>;

/**
 * A CloudFS filesystem, a POSIX filesystem backed by Telnyx Storage.
 *
 * Changing `region` replaces it.
 *
 * @resource
 * @product Storage
 */
export const CloudFSFilesystem = Resource<CloudFSFilesystem>("Telnyx.Storage.CloudFSFilesystem");

export const CloudFSFilesystemProvider = () =>
  Crud.provider(CloudFSFilesystem, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["region"] as any,
    preserve: ["meta_token"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_cloudfs_filesystems.getCloudfsFilesystem(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<CloudFSFilesystemAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_cloudfs_filesystems.createCloudfsFilesystem({
        idempotencyKey: crypto.randomUUID(),
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<CloudFSFilesystemAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_cloudfs_filesystems.updateCloudfsFilesystem({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<CloudFSFilesystemAttributes, any, any>,
    delete: (current) =>
      M_cloudfs_filesystems.deleteCloudfsFilesystem({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_cloudfs_filesystems.listCloudfsFilesystems,
        {} as any,
        "cursor",
      ) as Effect.Effect<any, any, any>,
  });
