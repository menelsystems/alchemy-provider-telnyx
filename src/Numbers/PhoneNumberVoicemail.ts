// Telnyx phone number voicemail: telnyx_phone_number_voicemail in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_voicemail from "../../vendor/distilled-telnyx/src/services/voicemail.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberVoicemail}: the create request and the update request of the Telnyx API.
 */
export type PhoneNumberVoicemailProps = Omit<
  M_voicemail.CreateVoicemailRequest,
  "phone_number_id"
> &
  Partial<Omit<M_voicemail.UpdateVoicemailRequest, "phone_number_id">> & {
    /**
     * The phone number id.
     */
    phone_number_id: string;
  };

/**
 * Attributes of a deployed {@link PhoneNumberVoicemail}: the object as the Telnyx API returns it.
 */
export type PhoneNumberVoicemailAttributes = NonNullable<
  M_voicemail.GetVoicemailResponse["data"]
> & { phone_number_id: string };

/**
 * Identifies an existing {@link PhoneNumberVoicemail} for `PhoneNumberVoicemail.lookup`.
 */
export interface PhoneNumberVoicemailLookup {
  phone_number_id: string;
}

export type PhoneNumberVoicemail = Resource<
  "Telnyx.Numbers.PhoneNumberVoicemail",
  PhoneNumberVoicemailProps,
  PhoneNumberVoicemailAttributes,
  never,
  Providers,
  PhoneNumberVoicemailLookup
>;

/**
 * The voicemail of a phone number. Destroy removes it from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const PhoneNumberVoicemail = Resource<PhoneNumberVoicemail>(
  "Telnyx.Numbers.PhoneNumberVoicemail",
);

export const PhoneNumberVoicemailProvider = () =>
  Crud.provider(PhoneNumberVoicemail, {
    local: ["phone_number_id"],
    stables: ["phone_number_id"] as any,
    replaceOn: ["phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number_id: "phone_number_id" });
      return k
        ? (M_voicemail.getVoicemail(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            PhoneNumberVoicemailAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_voicemail.createVoicemail({
        ...Crud.omit(props, ["phone_number_id"]),
        ...Crud.path(props, { phone_number_id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberVoicemailAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_voicemail.updateVoicemail({
        ...Crud.omit(delta, ["phone_number_id"]),
        ...Crud.path({ ...props, ...current }, { phone_number_id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberVoicemailAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a PhoneNumberVoicemail; it was removed from Alchemy state but still exists in your account.",
  });
