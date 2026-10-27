import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { requestPasswordReset, resetPassword } from "@/lib/api";

export default function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (token && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (token) {
        await resetPassword(token, password);
        setNotice("Your password has been reset. You can now log in.");
      } else {
        await requestPasswordReset(email);
        setNotice("If an account exists for that email, a reset link will be sent.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not complete your request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f2] px-4 py-10 text-[#171717]">
      <section className="w-full max-w-[420px] rounded-[4px] bg-white p-7 shadow-xl sm:p-10">
        <Link to="/" className="inline-block">
          <img src="/hostle.jpeg" alt="Hostle" className="h-9 w-auto object-contain" />
        </Link>
        <h1 className="mt-8 font-display text-2xl font-extrabold">{token ? "Choose a new password" : "Reset your password"}</h1>
        <p className="mt-2 text-sm leading-6 text-black/60">
          {token ? "Your new password must be at least 8 characters." : "Enter your account email and we will send a password reset link."}
        </p>

        {notice ? (
          <div role="status" className="mt-6 rounded border border-[#d9e9dc] bg-[#f2f8f2] p-4 text-sm leading-6 text-[#255b34]">
            {notice}
            {token && <Link to="/login" className="mt-3 block font-bold underline">Return to log in</Link>}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {token ? <>
              <label className="block text-sm font-semibold">New password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input text-sm" /></label>
              <label className="block text-sm font-semibold">Confirm new password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="auth-input text-sm" /></label>
            </> : (
              <label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input text-sm" placeholder="you@example.com" /></label>
            )}
            {error && <p role="alert" className="rounded bg-[#fff0f0] px-3 py-2 text-xs leading-5 text-[#a52a2a]">{error}</p>}
            <button disabled={busy} type="submit" className="w-full rounded-full bg-black py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-60">
              {busy ? "Please wait..." : token ? "Reset password" : "Send reset link"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-black/60 underline">Back to log in</Link>
      </section>
    </main>
  );
}