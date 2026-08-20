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
  buildPrompt: (values: { input: string; secondary?: string }) => string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: "summarizer",
    label: "Summarizer",
    description: "Condense long text into a short, clear summary.",
    fields: [{ key: "input", label: "Text", placeholder: "Paste the text to summarize...", type: "textarea", required: true }],
    buildPrompt: ({ input }) => `Summarize the following text concisely, in your own words:\n\n${input}`,
  },
  {
    id: "translator",
    label: "Translator",
    description: "Translate text into another language.",
    fields: [
      { key: "input", label: "Text", placeholder: "Text to translate...", type: "textarea", required: true },
      { key: "secondary", label: "Target language", placeholder: "e.g. French", type: "text", required: true },
    ],
    buildPrompt: ({ input, secondary }) =>
      `Translate the following text into ${secondary}. Reply with only the translation, nothing else:\n\n${input}`,
  },
  {
    id: "email-writer",
    label: "Email Writer",
    description: "Draft a professional email from a short brief.",
    fields: [
      { key: "input", label: "What's the email about?", placeholder: "e.g. Following up on last week's proposal...", type: "textarea", required: true },
      { key: "secondary", label: "Tone (optional)", placeholder: "e.g. friendly, formal, brief", type: "text", required: false },
    ],
    buildPrompt: ({ input, secondary }) =>
      `Write a professional email based on this brief${secondary ? `, in a ${secondary} tone` : ""}. Include a subject line:\n\n${input}`,
  },
  {
    id: "grammar-assistant",
    label: "Grammar Assistant",
    description: "Fix grammar and spelling while preserving your meaning and tone.",
    fields: [{ key: "input", label: "Text", placeholder: "Paste text to correct...", type: "textarea", required: true }],
    buildPrompt: ({ input }) =>
      `Fix grammar, spelling, and punctuation in the following text. Preserve the original meaning, tone, and voice. Reply with only the corrected text:\n\n${input}`,
  },
  {
    id: "code-explainer",
    label: "Code Explainer",
    description: "Explain what a piece of code does, step by step.",
    fields: [{ key: "input", label: "Code", placeholder: "Paste code here...", type: "textarea", required: true }],
    buildPrompt: ({ input }) => `Explain what the following code does, step by step, for someone learning to read it:\n\n${input}`,
  },
  {
    id: "resume-helper",
    label: "Resume Helper",
    description: "Make resume bullet points more impactful and specific.",
    fields: [{ key: "input", label: "Bullet point(s)", placeholder: "Paste your resume bullet points...", type: "textarea", required: true }],
    buildPrompt: ({ input }) =>
      `Rewrite the following resume bullet point(s) to be more impactful, specific, and results-oriented. Keep them truthful — don't invent numbers that weren't given:\n\n${input}`,
  },
  {
    id: "study-assistant",
    label: "Study Assistant",
    description: "Turn study material into a study guide with practice questions.",
    fields: [{ key: "input", label: "Material", placeholder: "Paste notes or a topic to study...", type: "textarea", required: true }],
    buildPrompt: ({ input }) =>
      `Create a concise study guide from the following material: key points as bullets, then 3-5 practice questions with answers:\n\n${input}`,
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes",
    description: "Turn raw notes into a clean summary with action items.",
    fields: [{ key: "input", label: "Raw notes", placeholder: "Paste your rough meeting notes...", type: "textarea", required: true }],
    buildPrompt: ({ input }) =>
      `Turn the following raw meeting notes into a clean summary with clear sections and a bulleted list of action items (with owners if mentioned):\n\n${input}`,
  },
  {
    id: "content-writer",
    label: "Content Writer",
    description: "Draft content (blog post, social post, etc.) from a brief.",
    fields: [
      { key: "input", label: "Brief", placeholder: "What should this content be about?", type: "textarea", required: true },
      { key: "secondary", label: "Format (optional)", placeholder: "e.g. blog post, tweet, product description", type: "text", required: false },
    ],
    buildPrompt: ({ input, secondary }) =>
      `Write ${secondary || "a piece of content"} based on this brief:\n\n${input}`,
  },
  {
    id: "json-formatter",
    label: "JSON Formatter",
    description: "Clean up and validate JSON, fixing minor issues.",
    fields: [{ key: "input", label: "JSON", placeholder: "Paste JSON here...", type: "textarea", required: true }],
    buildPrompt: ({ input }) =>
      `Reformat the following as clean, properly indented JSON. If it has small syntax errors, fix them while preserving the data as closely as possible. Reply with only the JSON, no explanation:\n\n${input}`,
  },
  {
    id: "sql-helper",
    label: "SQL Helper",
    description: "Write, explain, or optimize a SQL query.",
    fields: [
      { key: "input", label: "Query or request", placeholder: "Describe what you need, or paste a query...", type: "textarea", required: true },
      { key: "secondary", label: "Task (optional)", placeholder: "write, explain, or optimize", type: "text", required: false },
    ],
    buildPrompt: ({ input, secondary }) =>
      `${secondary ? `Task: ${secondary}. ` : ""}Help with the following SQL request. If writing a query, explain it briefly afterward:\n\n${input}`,
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}
