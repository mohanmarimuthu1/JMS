import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthProvider";

/**
 * One screen, one shared account, no signup link — signup is disabled
 * at the Supabase project level too (supabase/README.md dashboard
 * checklist), so this form intentionally has no way to create a new
 * account even if someone tried.
 */
export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. session restored on reload) — don't show
  // the login form at all.
  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 mono">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-ink rounded-sm p-6 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold headline text-center">JMS Engineering</h1>
        <p className="text-sm text-muted text-center">Sign in to make a bill</p>

        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
          />
        </div>

        {error && (
          <div className="text-sm text-rust border border-rust/60 bg-rust/5 rounded-sm p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] bg-rust text-white rounded-sm disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
