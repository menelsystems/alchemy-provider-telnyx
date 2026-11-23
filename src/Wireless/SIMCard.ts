// Telnyx sim card: telnyx_sim_card in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_sim_cards from "../../vendor/distilled-telnyx/src/services/sim_cards.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SIMCard}: the create request of the Telnyx API.
 */
export type SIMCardProps = Omit<M_sim_cards.UpdateSimCardRequest, "id"> & {
  /**
   * Whether destroy deletes the object in Telnyx. By default destroy only removes it from Terraform state. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  release_on_destroy?: boolean;
  /**
   * The sim card id.
   */
  sim_card_id: string;
};

/**
 * Attributes of a deployed {@link SIMCard}: the object as the Telnyx API returns it.
 */
export type SIMCardAttributes = NonNullable<M_sim_cards.GetSimCardResponse["data"]> & {
  sim_card_id: string;
};

/**
 * Identifies an existing {@link SIMCard} for `SIMCard.lookup`.
 */
export interface SIMCardLookup {
  sim_card_id: string;
}

export type SIMCard = Resource<
  "Telnyx.Wireless.SIMCard",
  SIMCardProps,
  SIMCardAttributes,
  never,
  Providers,
  SIMCardLookup
>;

/**
 * A SIM card in your account. Create adopts a SIM card you already registered or purchased and manages its settings. Destroy keeps the SIM card unless release_on_destroy is true, which decommissions it.
 *
 * Destroy keeps it in your account unless `release_on_destroy: true`.
 * Changing `sim_card_id` replaces it.
 *
 * @resource
 * @product Wireless
 */
export const SIMCard = Resource<SIMCard>("Telnyx.Wireless.SIMCard");

export const SIMCardProvider = () =>
  Crud.provider(SIMCard, {
    local: ["release_on_destroy", "sim_card_id"],
    stables: ["sim_card_id"] as any,
    replaceOn: ["sim_card_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "sim_card_id" });
      return k
        ? (M_sim_cards.getSimCard(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            SIMCardAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_sim_cards.updateSimCard({
        ...Crud.omit(props, ["release_on_destroy", "sim_card_id"]),
        ...Crud.path(props, { id: "sim_card_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<SIMCardAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_sim_cards.updateSimCard({
        ...Crud.omit(delta, ["release_on_destroy", "sim_card_id"]),
        ...Crud.path({ ...props, ...current }, { id: "sim_card_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<SIMCardAttributes, any, any>,
    delete: (current) =>
      M_sim_cards.deleteSimCard({ ...Crud.path(current, { id: "sim_card_id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_sim_cards.getSimCards, {} as any, "page-flat") as Effect.Effect<any, any, any>,
    retain: (props) =>
      props.release_on_destroy
        ? undefined
        : "This SIMCard stays in your Telnyx account, where it may still be billed. Set release_on_destroy: true and deploy before destroying to release it.",
  });
