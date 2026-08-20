export interface ToolField {
  key: "input" | "secondary";
  label: string;
  placeholder: string;
  type: "text" | "textarea";
  required: boolean;
}

export interface ToolDefinition {
  id: string;
  label: string;
  description: string;
  fields: ToolField[];
}
