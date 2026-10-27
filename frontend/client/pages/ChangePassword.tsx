import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { changePassword, getStoredSession, storeSession } from "@/lib/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const session = getStoredSession();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return <Navigate to="/login" replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const user = await changePassword(password, session.token);
      storeSession({ ...session, user });
      navigate("/admin", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The password could not be updated.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFBFA] px-5 py-10 text-[#171717]">
      <section className="w-full max-w-[520px] rounded border border-black/10 bg-white p-6 sm:p-8">
        <p className="eyebrow">Security update</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">Change your password</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">
          Your administrator account was created with a temporary password. Set a new password to continue.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-xs font-bold">
            New password
            <div className="relative mt-2">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-black/40" />
              <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded border border-black/15 bg-[#FAFBFA] px-10 pr-11 text-sm outline-none focus:border-black" />
              <button type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-3 text-black/45 hover:text-black">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>
          <label className="block text-xs font-bold">
            Confirm new password
            <div className="relative mt-2">
              <input required minLength={8} type={showConfirmation ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12 w-full rounded border border-black/15 bg-[#FAFBFA] px-3 pr-11 text-sm outline-none focus:border-black" />
              <button type="button" aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirmation((visible) => !visible)} className="absolute right-3 top-3 text-black/45 hover:text-black">
                {showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>
          {error && <p role="alert" className="rounded-xl bg-[#ffe3e3] px-4 py-3 text-xs font-semibold text-[#a52a2a]">{error}</p>}
          <button disabled={loading} type="submit" className="w-full rounded bg-black px-5 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
            {loading ? "Updating password..." : "Continue to dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
