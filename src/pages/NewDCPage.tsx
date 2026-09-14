import { DocumentForm } from "@/documents/DocumentForm";
import { DC_FORM_CONFIG } from "@/documents/formConfigs";

export function NewDCPage() {
  return <DocumentForm config={DC_FORM_CONFIG} />;
}
