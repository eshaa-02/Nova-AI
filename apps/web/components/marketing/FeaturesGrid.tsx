import {
  MessageSquare,
  ImageIcon,
  Mic,
  Video,
  Music,
  Wand2,
  Search,
  FileText,
  Wrench,
} from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Chat", description: "Fluid, multi-turn conversations with streaming responses and full history." },
  { icon: ImageIcon, title: "Image Generation", description: "Turn a description into a polished image with style and aspect controls." },
  { icon: Mic, title: "Voice Chat", description: "Speak naturally and hear Nova respond in a live voice conversation." },
  { icon: Video, title: "Video Creation", description: "Generate short-form video from a prompt, style, and duration." },
  { icon: Music, title: "Music Generation", description: "Create original tracks by genre, mood, and length." },
  { icon: Wand2, title: "Photo Editing", description: "Remove backgrounds, enhance, and edit photos with natural-language prompts." },
  { icon: Search, title: "Web Search", description: "Get a cited, up-to-date answer pulled from real sources." },
  { icon: FileText, title: "File Analysis", description: "Upload a document and ask questions, summarize, or extract data." },
  { icon: Wrench, title: "AI Tools", description: "Purpose-built assistants for writing, code, study, and more." },
];

export function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-8xl px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-text sm:text-4xl">One workspace, every capability</h2>
        <p className="mt-4 text-text-secondary">
          Nova AI brings conversation, creation, and analysis together — no switching between tools.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group bg-background p-7 transition-colors duration-fast hover:bg-surface"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-accent transition-colors group-hover:border-accent/40">
              <Icon size={18} strokeWidth={1.6} />
            </div>
            <h3 className="mt-4 text-[15px] font-medium text-text">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
