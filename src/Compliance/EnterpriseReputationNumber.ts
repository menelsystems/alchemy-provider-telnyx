// Telnyx enterprise reputation number: telnyx_enterprise_reputation_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_reputation from "#telnyx/services/reputation.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link EnterpriseReputationNumber}: the create request of the Telnyx API.
 */
export type EnterpriseReputationNumberProps = Omit<
  M_reputation.AssociateReputationNumbersRequest,
  "enterprise_id" | "phone_number" | "phone_numbers"
> & {
  /**
   * The enterprise id.
   */
  enterprise_id: string;
  /**
   * The phone number to monitor, in E.164 format with a leading `+`.
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link EnterpriseReputationNumber}: the object as the Telnyx API returns it.
 */
export type EnterpriseReputationNumberAttributes = NonNullable<
  M_reputation.ReputationPhoneNumberWithReputation["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link EnterpriseReputationNumber} for `EnterpriseReputationNumber.lookup`.
 */
export interface EnterpriseReputationNumberLookup {
  enterprise_id: string;
  phone_number: string;
}

export type EnterpriseReputationNumber = Resource<
  "Telnyx.Compliance.EnterpriseReputationNumber",
  EnterpriseReputationNumberProps,
  EnterpriseReputationNumberAttributes,
  never,
  Providers,
  EnterpriseReputationNumberLookup
>;

/**
 * A phone number under reputation monitoring for an enterprise, with its ownership status and latest reputation data.
 *
 * Changing `enterprise_id`, `phone_number` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const EnterpriseReputationNumber = Resource<EnterpriseReputationNumber>(
  "Telnyx.Compliance.EnterpriseReputationNumber",
);

export const EnterpriseReputationNumberProvider = () =>
  Crud.provider(EnterpriseReputationNumber, {
    local: ["enterprise_id", "phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["enterprise_id", "phone_number"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { enterprise_id: "enterprise_id", phone_number: "phone_number" });
      return k
        ? (M_reputation.getPhoneNumberReputation(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<EnterpriseReputationNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      // The API registers numbers in batches; each resource is one number.
      M_reputation.associateReputationNumbers({
        ...Crud.omit(props, ["enterprise_id", "phone_number"]),
        phone_numbers: [props.phone_number],
        ...Crud.path(props, { enterprise_id: "enterprise_id" }),
      } as any).pipe(Effect.map(Crud.first)) as Effect.Effect<
        EnterpriseReputationNumberAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_reputation.disassociateReputationNumber({
        ...Crud.path(current, { enterprise_id: "enterprise_id", phone_number: "phone_number" }),
      } as any).pipe(Effect.asVoid),
  });
