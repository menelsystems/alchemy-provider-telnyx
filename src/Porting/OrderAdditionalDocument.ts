// Telnyx order additional document: telnyx_porting_order_additional_document in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "../../vendor/distilled-telnyx/src/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OrderAdditionalDocument}: the create request of the Telnyx API.
 */
export type OrderAdditionalDocumentProps = Omit<
  M_porting_orders.CreateAdditionalDocumentsRequest,
  "id" | "additional_document_id" | "additional_documents"
> & {
  /** The document to attach (from \`Telnyx.Compliance.Document\`). */
  document_id: string;
  /** What the document is, e.g. \`loa\` or \`invoice\`. */
  document_type: string;
  /**
   * Identifies the associated porting order
   */
  porting_order_id: string;
};

/**
 * Attributes of a deployed {@link OrderAdditionalDocument}: the object as the Telnyx API returns it.
 */
export type OrderAdditionalDocumentAttributes = NonNullable<
  M_porting_orders.ListAdditionalDocumentsResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link OrderAdditionalDocument} for `OrderAdditionalDocument.lookup`.
 */
export interface OrderAdditionalDocumentLookup {
  porting_order_id: string;
  id: string;
}

export type OrderAdditionalDocument = Resource<
  "Telnyx.Porting.OrderAdditionalDocument",
  OrderAdditionalDocumentProps,
  OrderAdditionalDocumentAttributes,
  never,
  Providers,
  OrderAdditionalDocumentLookup
>;

/**
 * A document attached to a porting order in addition to its LOA and invoice.
 *
 * Changing `document_id`, `document_type`, `porting_order_id` replaces it.
 *
 * @resource
 * @product Porting
 */
export const OrderAdditionalDocument = Resource<OrderAdditionalDocument>(
  "Telnyx.Porting.OrderAdditionalDocument",
);

export const OrderAdditionalDocumentProvider = () =>
  Crud.provider(OrderAdditionalDocument, {
    local: ["id", "porting_order_id"],
    stables: ["id"] as any,
    replaceOn: ["document_id", "document_type", "porting_order_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { id: "porting_order_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_porting_orders.listAdditionalDocuments,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<OrderAdditionalDocumentAttributes | undefined, any, any>;
    },
    create: (props) =>
      // The API attaches documents in batches; each resource is one document.
      M_porting_orders.createAdditionalDocuments({
        additional_documents: [
          { document_id: props.document_id, document_type: props.document_type },
        ],
        ...Crud.path(props, { id: "porting_order_id" }),
      } as any).pipe(Effect.map(Crud.first)) as Effect.Effect<
        OrderAdditionalDocumentAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_porting_orders.deleteAdditionalDocument({
        ...Crud.path(current, { id: "porting_order_id", additional_document_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
