import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Mail, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, loginWithGoogle, signup, storeSession } from "@/lib/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";

type LoginProps = {
  embedded?: boolean;
  initialMode?: "login" | "signup";
  onClose?: () => void;
};

export default function Login({ embedded = false, initialMode, onClose }: LoginProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "owner">("student");
  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? (location.pathname === "/signup" ? "signup" : "login"));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"" | "female" | "male" | "non_binary" | "prefer_not_to_say">("");
  const [ownerType, setOwnerType] = useState<"personal" | "company">("personal");
  const [companyAddress, setCompanyAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const signupMode = mode === "signup";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = signupMode
        ? await signup({
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            email,
            password,
            role,
            ...(role === "student"
              ? { schoolName, phoneNumber, gender: gender || undefined }
              : {
                  phoneNumber,
                  ownerType,
                  companyAddress: ownerType === "company" ? companyAddress : undefined,
                }),
          })
        : await login({ email, password, role });
      storeSession(response);
      if (response.user.mustChangePassword) {
        navigate("/admin/change-password");
        onClose?.();
        return;
      }
      const destination = response.user.role === "owner"
        ? "/owner/dashboard"
        : response.user.role === "university"
          ? "/university"
          : response.user.role === "admin" || response.user.role === "superadmin"
            ? "/admin"
            : "/dashboard";
      navigate(destination);
      onClose?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not complete authentication.");
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleLogin = async (credential: string) => {
    setError("");
    const response = await loginWithGoogle({ credential, role });
    storeSession(response);
    const destination = response.user.role === "owner"
      ? "/owner/dashboard"
      : response.user.role === "university"
        ? "/university"
        : response.user.role === "admin" || response.user.role === "superadmin"
          ? "/admin"
          : "/dashboard";
    navigate(destination);
    onClose?.();
  };

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setError("");
  };

  return (
    <div className={embedded ? "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 text-white" : "relative min-h-screen overflow-hidden bg-[#242424] text-white"}>
      {!embedded && (
        <>
          <div className="auth-underlay" />
          <div className="absolute inset-0 bg-black/75" />
          <header className="relative z-10 mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
            <Link to="/" className="font-display text-[25px] font-extrabold tracking-[-.08em]"><img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" /></Link>
            <Link to="/" className="text-xs font-bold text-white/70 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4" /> Back to home</Link>
          </header>
        </>
      )}

      <main className={embedded ? "w-full max-w-[770px]" : "relative z-10 flex min-h-[calc(100vh-74px)] items-center justify-center px-4 py-10"}>
        <section className="relative grid w-full max-w-[770px] overflow-hidden rounded-[4px] bg-white text-[#171717] shadow-2xl md:grid-cols-[.9fr_1.1fr]">
          {onClose ? <button type="button" aria-label="Close authentication" onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full p-1 text-black/50 transition hover:bg-black/10 hover:text-black"><X className="h-4 w-4" /></button> : <Link aria-label="Close authentication" to="/" className="absolute right-3 top-3 z-10 rounded-full p-1 text-black/50 transition hover:bg-black/10 hover:text-black"><X className="h-4 w-4" /></Link>}
          <div className="flex flex-col justify-between border-r border-black/10 p-7 sm:p-9">
            <div>
              <div className="font-display text-[26px] font-extrabold tracking-[-.08em]"><img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" /></div>
              <h1 className="mt-7 max-w-[190px] font-display text-[17px] md:text-[28px] font-extrabold leading-6">{signupMode ? "Find your next room" : "Effortlessly find student housing"}</h1>
              <p className="mt-5 text-[15px] leading-5 text-black/75">{signupMode ? "Find a place to live, compare your options and move in with confidence." : "Find trusted student accommodation near your university with everything in one place."}</p>
              <div className="mt-5 space-y-3 text-[13px] text-[#F6B544]">
                <p><Check className="mr-2 inline h-3 w-3 text-[#a36500]" /> {signupMode ? "Search verified hostels" : "Verified properties and owners"}</p>
                <p><Check className="mr-2 inline h-3 w-3 text-[#a36500]" /> {signupMode ? "Reserve your space securely" : "Clear pricing and availability"}</p>
                <p><Check className="mr-2 inline h-3 w-3 text-[#a36500]" /> {signupMode ? "Manage everything in one place" : "Student support when you need it"}</p>
              </div>
            </div>
            <p className="mt-8 text-[13px] leading-4 text-black/70">By creating an account, you agree to the <Link className="underline" to="/terms">Terms of Service</Link> and <Link className="underline" to="/privacy">Privacy Policy</Link>.</p>
          </div>

          <div className="p-10 sm:p-12">
            <div className="mb-5"><h2 className="font-display text-[19px] md:text-[28px] font-extrabold">{signupMode ? "Create your arc() account" : "Welcome back"}</h2>
            <p className="mt-1 text-[14px] text-black/75">{signupMode ? "Start your accommodation journey" : "Log in to continue to your account"}</p>
            </div>
            <div className="mb-5 grid grid-cols-2 rounded-full bg-[#f3f3f1] p-1">
              <button type="button" onClick={() => setRole("student")} className={`rounded-full py-2 text-[13.5px] font-[520] ${role === "student" ? "bg-black text-white" : "text-black/45"}`}> Student</button>
              <button type="button" onClick={() => setRole("owner")} className={`rounded-full py-2 text-[13.5px] font-bold ${role === "owner" ? "bg-black text-white" : "text-black/45"}`}>Owner</button>
              </div>
            <form onSubmit={submit} className="space-y-3">
              {signupMode && <div className="grid gap-3 sm:grid-cols-2"><label className="block text-[14px] font-bold text-black/85">First name <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="auth-input text-[14px]" placeholder="First name" autoComplete="given-name" /></label><label className="block text-[14px] font-bold text-black/85">Last name <input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="auth-input text-[14px]" placeholder="Last name" autoComplete="family-name" /></label></div>}
              {signupMode && role === "student" && <>
                <label className="block text-[14px] font-bold text-black/85">School name <input required value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="auth-input text-[14px]" placeholder="Your school or university" autoComplete="organization" /></label>
                <label className="block text-[14px] font-bold text-black/85">Phone number <input required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="auth-input text-[14px]" placeholder="0800 000 0000" type="tel" autoComplete="tel" /></label>
                <label className="block text-[14px] font-bold text-black/85">Gender <select required value={gender} onChange={(event) => setGender(event.target.value as typeof gender)} className="auth-input text-[14px]" autoComplete="sex"><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
              </>}
              {signupMode && role === "owner" && <>
                <label className="block text-[14px] font-bold text-black/85">Phone number <input required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="auth-input text-[14px]" placeholder="0800 000 0000" type="tel" autoComplete="tel" /></label>
                <label className="block text-[14px] font-bold text-black/85">Personal or company <select value={ownerType} onChange={(event) => setOwnerType(event.target.value as "personal" | "company")} className="auth-input text-[14px]" autoComplete="organization-title"><option value="personal">Personal</option><option value="company">Company</option></select></label>
                {ownerType === "company" && <label className="block text-[14px] font-bold text-black/85">Company address <input required value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} className="auth-input text-[14px]" placeholder="Street address, city, country" autoComplete="street-address" /></label>}
              </>}
              <label className="block text-[13.5px] font-[550] text-black/95">Email<div className="relative ">
                <Mail className="absolute left-2 top-3.5 h-4.5 w-4.5 text-black/70" />
                <input required value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="auth-input pl-10 text-[14px] text-black/80 font-[550] " placeholder="you@example.com" autoComplete="email" /></div>
                </label>
              <label className="block text-[13.5px] font-[550] text-black/95">Password<div className="relative"><KeyRound className="absolute left-2 top-3.5 h-4.5 w-4.5 text-black/70" /><input required minLength={signupMode ? 8 : 1} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} className="auth-input pl-10 pr-8 text-[14px] text-black/80" placeholder={signupMode ? "At least 8 characters" : "Your password"} autoComplete={signupMode ? "new-password" : "current-password"} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-black/35">{showPassword ? <EyeOff className="h-5.5 w-5.5" /> : <Eye className="h-5.5 w-5.5" />}</button></div></label>
              {!signupMode && <div className="-mt-1 text-right"><Link to="/forgot-password" className="text-xs font-semibold text-black/55 underline">Forgot password?</Link></div>}
              {error && <p role="alert" className="rounded-lg bg-[#fff0f0] px-3 py-2 text-[10px] leading-4 text-[#a52a2a]">{error}</p>}
              <button disabled={loading} type="submit" className="mt-2 w-full rounded-full bg-black py-3 text-[13.5px] font-bold text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-60">{loading ? "Connecting..." : signupMode ? "Create account" : "Log in"}</button>
            </form>
            {!signupMode && <>
              <div className="my-3 flex items-center gap-3 text-[11px] font-medium text-black/35"><span className="h-px flex-1 bg-black/10" />OR<span className="h-px flex-1 bg-black/10" /></div>
              <GoogleSignInButton onCredential={submitGoogleLogin} onError={setError} />
            </>}
            <p className="mt-6 text-center text-[13.5px] text-black/75">{signupMode ? "Already have an account?" : "Don’t have an account?"} <button type="button" onClick={() => switchMode(signupMode ? "login" : "signup")} className="font-bold text-black underline">{signupMode ? "Log in" : "Sign up"}</button></p>
            {!signupMode && <p className="mt-3 text-center text-xs text-black/45"><Link to="/admin/login" className="font-bold underline">Admin login</Link></p>}
          </div>
        </section>
      </main>
    </div>
  );
}
