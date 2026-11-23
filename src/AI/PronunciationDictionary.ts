// Telnyx pronunciation dictionary: telnyx_pronunciation_dictionary in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_pronunciation_dictionaries from "#telnyx/services/pronunciation_dictionaries.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PronunciationDictionary}: the create request and the update request of the Telnyx API.
 */
export type PronunciationDictionaryProps = Omit<
  M_pronunciation_dictionaries.CreatePronunciationDictRequest,
  "id"
> &
  Partial<Omit<M_pronunciation_dictionaries.UpdatePronunciationDictRequest, "id">>;

/**
 * Attributes of a deployed {@link PronunciationDictionary}: the object as the Telnyx API returns it.
 */
export type PronunciationDictionaryAttributes = NonNullable<
  M_pronunciation_dictionaries.PronunciationDictResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link PronunciationDictionary} for `PronunciationDictionary.lookup`.
 */
export interface PronunciationDictionaryLookup {
  id: string;
}

export type PronunciationDictionary = Resource<
  "Telnyx.AI.PronunciationDictionary",
  PronunciationDictionaryProps,
  PronunciationDictionaryAttributes,
  never,
  Providers,
  PronunciationDictionaryLookup
>;

/**
 * A pronunciation dictionary, which tells text-to-speech how to say words such as names and acronyms.
 *
 * @resource
 * @product AI
 */
export const PronunciationDictionary = Resource<PronunciationDictionary>(
  "Telnyx.AI.PronunciationDictionary",
);

export const PronunciationDictionaryProvider = () =>
  Crud.provider(PronunciationDictionary, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_pronunciation_dictionaries.getPronunciationDict(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PronunciationDictionaryAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_pronunciation_dictionaries.createPronunciationDict({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PronunciationDictionaryAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_pronunciation_dictionaries.updatePronunciationDict({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PronunciationDictionaryAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_pronunciation_dictionaries.deletePronunciationDict({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_pronunciation_dictionaries.listPronunciationDicts,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
