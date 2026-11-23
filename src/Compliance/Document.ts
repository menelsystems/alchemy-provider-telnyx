// Telnyx document: telnyx_document in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_documents from "#telnyx/services/documents.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Document}: the create request and the update request of the Telnyx API.
 */
export type DocumentProps = Omit<M_documents.CreateDocumentRequest, "id"> &
  Partial<Omit<M_documents.UpdateDocumentRequest, "id">>;

/**
 * Attributes of a deployed {@link Document}: the object as the Telnyx API returns it.
 */
export type DocumentAttributes = NonNullable<M_documents.GetDocumentResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Document} for `Document.lookup`.
 */
export interface DocumentLookup {
  id: string;
}

export type Document = Resource<
  "Telnyx.Compliance.Document",
  DocumentProps,
  DocumentAttributes,
  never,
  Providers,
  DocumentLookup
>;

/**
 * A document uploaded to Telnyx, such as a letter of authorization or an invoice for porting, from a URL or base64 content.
 *
 * Changing `file`, `url` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const Document = Resource<Document>("Telnyx.Compliance.Document");

export const DocumentProvider = () =>
  Crud.provider(Document, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["file", "url"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_documents.getDocument(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            DocumentAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_documents.createDocument({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<DocumentAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_documents.updateDocument({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DocumentAttributes, any, any>,
    delete: (current) =>
      M_documents.deleteDocument({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_documents.listDocuments, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
