// Telnyx bucket ssl certificate: telnyx_storage_bucket_ssl_certificate in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import * as M_bucket_ssl_certificate from "#telnyx/services/bucket_ssl_certificate.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link BucketSSLCertificate}: the create request of the Telnyx API.
 */
export type BucketSSLCertificateProps = Omit<
  M_bucket_ssl_certificate.AddStorageSSLCertificateRequest,
  "bucketName" | "certificate" | "private_key"
> & {
  /**
   * The bucket name.
   */
  bucket_name: string;
  /**
   * The certificate in PEM format, with any intermediate certificates after it.
   */
  certificate_pem: string;
  /**
   * The certificate's private key in PEM format.
   */
  private_key_pem: string | Redacted.Redacted<string>;
};

/**
 * Attributes of a deployed {@link BucketSSLCertificate}: the object as the Telnyx API returns it.
 */
export type BucketSSLCertificateAttributes = NonNullable<
  M_bucket_ssl_certificate.GetStorageSSLCertificatesResponse["data"]
> & { bucket_name: string };

/**
 * Identifies an existing {@link BucketSSLCertificate} for `BucketSSLCertificate.lookup`.
 */
export interface BucketSSLCertificateLookup {
  bucket_name: string;
}

export type BucketSSLCertificate = Resource<
  "Telnyx.Storage.BucketSSLCertificate",
  BucketSSLCertificateProps,
  BucketSSLCertificateAttributes,
  never,
  Providers,
  BucketSSLCertificateLookup
>;

/**
 * The SSL certificate a storage bucket serves on its custom domain.
 *
 * Changing `bucket_name` replaces it.
 *
 * @resource
 * @product Storage
 */
export const BucketSSLCertificate = Resource<BucketSSLCertificate>(
  "Telnyx.Storage.BucketSSLCertificate",
);

// The certificate and key are uploaded as two PEM files; the API returns only
// the certificate's details, so the PEMs live only in props.
const upload = (props: BucketSSLCertificateProps) =>
  M_bucket_ssl_certificate.addStorageSSLCertificate({
    bucketName: props.bucket_name,
    certificate: new File([props.certificate_pem], "certificate.pem", {
      type: "application/x-pem-file",
    }),
    private_key: new File(
      [
        Redacted.isRedacted(props.private_key_pem)
          ? Redacted.value(props.private_key_pem)
          : props.private_key_pem,
      ],
      "private_key.pem",
      { type: "application/x-pem-file" },
    ) as any,
  }).pipe(Effect.map(Crud.data)) as Effect.Effect<BucketSSLCertificateAttributes, any, any>;

export const BucketSSLCertificateProvider = () =>
  Crud.provider(BucketSSLCertificate, {
    local: ["bucket_name"],
    stables: ["bucket_name"] as any,
    replaceOn: ["bucket_name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { bucketName: "bucket_name" });
      return k
        ? (M_bucket_ssl_certificate.getStorageSSLCertificates(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<BucketSSLCertificateAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: upload,
    update: ({ props }) => upload(props),
    delete: (current) =>
      M_bucket_ssl_certificate.removeStorageSSLCertificate({
        ...Crud.path(current, { bucketName: "bucket_name" }),
      } as any).pipe(Effect.asVoid),
  });
