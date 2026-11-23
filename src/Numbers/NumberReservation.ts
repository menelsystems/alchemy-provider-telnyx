// Telnyx number reservation: telnyx_number_reservation in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_reservations from "#telnyx/services/phone_number_reservations.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NumberReservation}: the create request of the Telnyx API.
 */
export type NumberReservationProps = Omit<
  M_phone_number_reservations.CreateNumberReservationRequest,
  "number_reservation_id"
>;

/**
 * Attributes of a deployed {@link NumberReservation}: the object as the Telnyx API returns it.
 */
export type NumberReservationAttributes = NonNullable<
  M_phone_number_reservations.GetNumberReservationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NumberReservation} for `NumberReservation.lookup`.
 */
export interface NumberReservationLookup {
  id: string;
}

export type NumberReservation = Resource<
  "Telnyx.Numbers.NumberReservation",
  NumberReservationProps,
  NumberReservationAttributes,
  never,
  Providers,
  NumberReservationLookup
>;

/**
 * A reservation that holds phone numbers for you for a limited time before you order them.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `customer_reference`, `phone_numbers` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const NumberReservation = Resource<NumberReservation>("Telnyx.Numbers.NumberReservation");

export const NumberReservationProvider = () =>
  Crud.provider(NumberReservation, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["customer_reference", "phone_numbers"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { number_reservation_id: "id" });
      return k
        ? (M_phone_number_reservations.getNumberReservation(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NumberReservationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_reservations.createNumberReservation({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<NumberReservationAttributes, any, any>,
    list: () =>
      Paging.all(
        M_phone_number_reservations.listNumberReservations,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete a NumberReservation; it was removed from Alchemy state but still exists in your account.",
  });
