import { useState } from "react";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      prompt: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not be loaded."));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const beginSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError("Google sign-in is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      await loadGoogleIdentityScript();
      if (!window.google) throw new Error("Google sign-in could not be initialized.");
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          void onCredential(credential)
            .catch((error: unknown) => onError(error instanceof Error ? error.message : "Google sign-in failed."))
            .finally(() => setLoading(false));
        },
      });
      window.google.accounts.id.prompt();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      onError(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  };

  return (
    <button
      type="button"
      onClick={beginSignIn}
      disabled={loading}
      className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white py-2.5 text-[13.5px] font-semibold text-black/80 transition hover:bg-black/[.03] disabled:cursor-wait disabled:opacity-60"
    >
      <img src="/icons/google.png" alt="" className="h-4 w-4 object-contain" />
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}