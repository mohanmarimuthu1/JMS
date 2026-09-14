import { DocumentForm } from "@/documents/DocumentForm";
import { INVOICE_FORM_CONFIG } from "@/documents/formConfigs";

export function NewInvoicePage() {
  return <DocumentForm config={INVOICE_FORM_CONFIG} />;
}
