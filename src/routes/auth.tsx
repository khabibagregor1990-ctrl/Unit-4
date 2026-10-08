import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lingua English" },
      {
        name: "description",
        content: "Sign in or create a student account to watch lessons and practise English tasks.",
      },
      { property: "og:title", content: "Sign in — Lingua English" },
      {
        property: "og:description",
        content: "Sign in to your English class account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-brand font-display text-lg font-semibold text-primary-foreground">
            L
          </div>
          <span className="font-display text-xl font-semibold">Lingua</span>
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-card p-7">
          <h1 className="font-display text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-inksoft">
            {mode === "signin"
              ? "Sign in to continue your lessons."
              : "Sign up to start the lessons and save your scores."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {mode === "signup" ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            ) : null}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-inksoft">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold"
          >
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm text-inksoft">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-brand"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
