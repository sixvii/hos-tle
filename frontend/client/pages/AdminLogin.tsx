import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login, loginWithGoogle, storeSession } from "@/lib/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const continueToPassword = () => {
    setError("");
    if (!emailInputRef.current?.checkValidity()) {
      emailInputRef.current?.reportValidity();
      return;
    }
    setStep("password");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login({ email, password, role: "admin" });
      if (session.user.role !== "admin" && session.user.role !== "superadmin") {
        throw new Error("This login is reserved for admin accounts.");
      }
      storeSession(session);
      navigate(session.user.mustChangePassword ? "/admin/change-password" : "/admin");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not sign you in.");
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleLogin = async (credential: string) => {
    setError("");
    const session = await loginWithGoogle({ credential, role: "admin" });
    storeSession(session);
    navigate(session.user.mustChangePassword ? "/admin/change-password" : "/admin");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-[#171717] lg:flex-row">
      <section className="flex min-h-screen w-full flex-col bg-white px-6 py-7 sm:px-10 lg:w-[22%] lg:min-w-[300px] lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="font-display text-[25px] font-extrabold tracking-[-.08em]">
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
         
        </div>
        <div className="my-auto py-12">
          <div className="flex items-center gap-2 text-[#007c68]"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[.12em]">Admin access</span></div>
          <h1 className="mt-7 font-display text-2xl font-extrabold leading-[.98] tracking-[-.06em]">Log in to your account</h1>
          <p className="mt-4 text-sm leading-6 text-black/55">Sign in to manage properties and protect the marketplace.</p>
          <div className="relative mt-8 overflow-hidden">
            <div className={`flex w-[200%] transition-transform duration-500 ease-out ${step === "password" ? "-translate-x-1/2" : "translate-x-0"}`}>
              <div className="w-1/2 shrink-0 pr-1">
                <label className="block text-xs font-bold">Email address<input ref={emailInputRef} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input text-sm" placeholder="" autoComplete="email" /></label>
                <button type="button" onClick={continueToPassword} className="mt-8 inline-flex items-center rounded-[5px]  bg-[#023430] px-2.5 py-1.5 text-[14px] font-[500] text-[#FFFFFF] transition hover:bg-[#023430]">Next </button>
              </div>
              <form onSubmit={submit} className="w-1/2 shrink-0 pl-1">
                <button type="button" onClick={() => { setStep("email"); setError(""); }} className="mb-5 inline-flex items-center text-xs font-bold text-black/45 hover:text-black"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Change email</button>
                <p className="mb-3 text-xs text-black/45">Signing in as <strong className="text-black/75">{email}</strong></p>
                <label className="block text-xs font-bold">Password<div className="relative"><KeyRound className="absolute left-2 top-3 h-4 w-4 text-black/45" />
                <input required autoFocus={step === "password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input pl-9 pr-9 text-sm" placeholder="" autoComplete="current-password" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-2.5 text-black/40">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
                </label>
                {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff0f0] px-3 py-2 text-xs leading-5 text-[#a52a2a]">{error}</p>}
                <button disabled={loading} type="submit" className="mt-6 w-[40] rounded bg-[#023430] py-2 px-2 text-[14px] font-[500] text-white transition hover:bg-[#023430] disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Log in"}</button>
                <Link to="/forgot-password" className="ml-4 text-xs font-semibold text-black/55 underline">Forgot password?</Link>
              </form>
            </div>
          </div>
          <div className="my-3 flex items-center gap-3 text-[11px] font-medium text-black/35"><span className="h-px flex-1 bg-black/10" />OR<span className="h-px flex-1 bg-black/10" /></div>
          <GoogleSignInButton onCredential={submitGoogleLogin} onError={setError} />
          <p className="mt-8 text-center text-[11px] leading-5 text-black/40">Admin accounts are created by the superadmin.</p>
        </div>
      </section>
      <section className="relative min-h-[48vh] w-full overflow-hidden bg-[#003b35] lg:min-h-screen lg:w-[80%]">
        <img src="/admin.png" alt="Admin workspace" className="absolute inset-0 h-full w-full object-cover object-center" />
      </section>
    </div>
  );
}
