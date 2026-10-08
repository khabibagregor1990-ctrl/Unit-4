import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsTeacher } from "@/lib/course";
import { useSession } from "@/lib/session";

const links = [
  { to: "/dashboard", label: "Units" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/progress", label: "Progress" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: isTeacher } = useIsTeacher();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const name =
    (user?.user_metadata?.["display_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Student";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-brand font-display text-lg font-semibold text-primary-foreground">
              L
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">Lingua</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-inksoft">
                English File · Pre-Intermediate
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-inksoft md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={
                  pathname.startsWith(link.to) ? "font-semibold text-brand" : "hover:text-ink"
                }
              >
                {link.label}
              </Link>
            ))}
            {isTeacher ? (
              <Link
                to="/teacher"
                className={
                  pathname.startsWith("/teacher") ? "font-semibold text-brand" : "hover:text-ink"
                }
              >
                Teacher
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-sand py-1 pl-1 pr-3 sm:flex">
              <div className="grid size-7 place-items-center rounded-full bg-amber text-xs font-bold text-ink">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{name}</span>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-inksoft transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">{children}</main>
    </div>
  );
}
