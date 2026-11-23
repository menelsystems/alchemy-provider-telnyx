// Telnyx display identity record phone number: telnyx_display_identity_record_phone_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_numbers from "../../vendor/distilled-telnyx/src/services/phone_numbers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DisplayIdentityRecordPhoneNumber}: the create request of the Telnyx API.
 */
export type DisplayIdentityRecordPhoneNumberProps = Omit<
  M_phone_numbers.AddDirPhoneNumbersSimplifiedRequest,
  "dir_id" | "phone_numbers"
> & {
  /** The phone number, in E.164 format. Changing it replaces the resource. */
  phone_number: string;
  /**
   * The dir id.
   */
  dir_id: string;
};

/**
 * Attributes of a deployed {@link DisplayIdentityRecordPhoneNumber}: the object as the Telnyx API returns it.
 */
export type DisplayIdentityRecordPhoneNumberAttributes = NonNullable<
  M_phone_numbers.PhoneNumberList["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link DisplayIdentityRecordPhoneNumber} for `DisplayIdentityRecordPhoneNumber.lookup`.
 */
export interface DisplayIdentityRecordPhoneNumberLookup {
  dir_id: string;
  id: string;
}

export type DisplayIdentityRecordPhoneNumber = Resource<
  "Telnyx.Compliance.DisplayIdentityRecordPhoneNumber",
  DisplayIdentityRecordPhoneNumberProps,
  DisplayIdentityRecordPhoneNumberAttributes,
  never,
  Providers,
  DisplayIdentityRecordPhoneNumberLookup
>;

/**
 * A phone number that shows a DIR's branded identity when it calls. Telnyx vets the number; status says how far.
 *
 * Changing `dir_id`, `documents`, `phone_number` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const DisplayIdentityRecordPhoneNumber = Resource<DisplayIdentityRecordPhoneNumber>(
  "Telnyx.Compliance.DisplayIdentityRecordPhoneNumber",
);

export const DisplayIdentityRecordPhoneNumberProvider = () =>
  Crud.provider(DisplayIdentityRecordPhoneNumber, {
    local: ["dir_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["dir_id", "documents", "phone_number"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { dir_id: "dir_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_phone_numbers.listDirPhoneNumbersSimplified,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<DisplayIdentityRecordPhoneNumberAttributes | undefined, any, any>;
    },
    create: ({ phone_number, ...props }) =>
      // The API adds numbers in batches; each resource is one number.
      M_phone_numbers.addDirPhoneNumbersSimplified({
        ...Crud.omit(props, ["dir_id"]),
        phone_numbers: [phone_number],
        ...Crud.path(props, { dir_id: "dir_id" }),
      } as any).pipe(Effect.map(Crud.first)) as Effect.Effect<
        DisplayIdentityRecordPhoneNumberAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_phone_numbers.deleteDirPhoneNumbersSimplified({
        ...Crud.path(current, { dir_id: "dir_id" }),
        phone_numbers: [String((current as any).phone_number)],
      } as any).pipe(Effect.asVoid),
  });
