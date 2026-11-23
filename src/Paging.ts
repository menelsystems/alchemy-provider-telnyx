/**
 * Paging through Telnyx list operations.
 *
 * The Telnyx spec mixes paging styles, and distilled's page-number strategy
 * needs a flat input token, so the SDK doesn't stamp pagination traits.
 * `all` walks any typed list operation with Effect's `Stream.paginate`.
 */
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";

/** How a list operation pages. */
export type Style =
  /** `page: { number, size }` in; `meta.total_pages` out (most lists). */
  | "page-flat"
  /** `page_number_` / `page_size_` in; `meta.total_pages` out. */
  | "page-flat"
  /** `page` / `recordsPerPage` (10DLC); a short page is the last. */
  | "page-records"
  /** `page_after_` cursor in; `meta.cursors.after` out. */
  | "cursor"
  /** One request. */
  | "none";

const PAGE_SIZE = 250;
const MAX_PAGES = 1_000;

/** The element type of a page: `data`, `records`, `results`, or a bare array. */
export type ItemOf<O> =
  O extends ReadonlyArray<infer A>
    ? A
    : O extends { readonly data?: ReadonlyArray<infer A> | null }
      ? A
      : O extends { readonly records?: ReadonlyArray<infer A> | null }
        ? A
        : O extends { readonly results?: ReadonlyArray<infer A> | null }
          ? A
          : unknown;

const itemsOf = (page: unknown): ReadonlyArray<unknown> => {
  if (Array.isArray(page)) return page;
  const p = (page ?? {}) as Record<string, unknown>;
  const items = p.data ?? p.records ?? p.results;
  return Array.isArray(items) ? items : [];
};

const metaOf = (page: unknown) =>
  ((Array.isArray(page) ? undefined : (page as { meta?: unknown } | undefined)?.meta) ?? {}) as {
    total_pages?: number;
    cursors?: { after?: string | null };
    end_cursor?: string | null;
  };

const inputFor = (
  style: Style,
  input: Record<string, unknown>,
  page: number,
  cursor: string | undefined,
) => {
  switch (style) {
    case "page-flat":
      return { ...input, page_number_: page, page_size_: PAGE_SIZE };
    case "page-records":
      return { ...input, page, recordsPerPage: PAGE_SIZE };
    case "cursor":
      return { ...input, page_size_: PAGE_SIZE, ...(cursor ? { page_after_: cursor } : {}) };
    case "none":
      return input;
  }
};

/** Every item of a list operation, across pages, up to `maxItems`. */
export const all = <I extends object, O, E, R>(
  operation: (input: I) => Effect.Effect<O, E, R>,
  input: I,
  style: Style = "page-flat",
  maxItems = Number.POSITIVE_INFINITY,
): Effect.Effect<ReadonlyArray<ItemOf<O>>, E, R> =>
  Stream.paginate({ page: 1, cursor: undefined as string | undefined }, (state) =>
    operation(
      inputFor(style, input as Record<string, unknown>, state.page, state.cursor) as I,
    ).pipe(
      Effect.map((res) => {
        const items = itemsOf(res) as ReadonlyArray<ItemOf<O>>;
        const meta = metaOf(res);
        let next: Option.Option<{ page: number; cursor: string | undefined }> = Option.none();
        if (style === "cursor") {
          const after = meta.cursors?.after ?? meta.end_cursor ?? undefined;
          if (after && after !== state.cursor && items.length > 0) {
            next = Option.some({ page: state.page + 1, cursor: after });
          }
        } else if (style !== "none" && items.length > 0 && state.page < MAX_PAGES) {
          const more =
            meta.total_pages !== undefined
              ? state.page < meta.total_pages
              : items.length >= PAGE_SIZE;
          if (more) next = Option.some({ page: state.page + 1, cursor: undefined });
        }
        return [items, next] as const;
      }),
    ),
  ).pipe(
    Stream.take(maxItems),
    Stream.runCollect,
    Effect.map((chunk) => Array.from(chunk)),
  );
