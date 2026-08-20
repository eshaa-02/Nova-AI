import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-surface p-12 lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <div className="max-w-md">
          <h1 className="font-display text-4xl leading-tight text-text">Your thinking, refined.</h1>
          <p className="mt-4 text-text-secondary leading-relaxed">
            One workspace for conversation, creation, research, and analysis — designed to feel
            as considered as the work you do inside it.
          </p>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Nova AI</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <h2 className="font-display text-2xl text-text">{title}</h2>
          <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
