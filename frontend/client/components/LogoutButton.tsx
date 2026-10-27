import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api";

type LogoutButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function LogoutButton({ children, className, ...props }: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <button type="button" onClick={handleLogout} className={className} {...props}>
      {children}
    </button>
  );
}

export function SettingsLogoutAction() {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-bold">Log out</p>
        <p className="mt-1 text-xs text-black/50">
          End your current session on this device.
        </p>
      </div>
      <LogoutButton className="inline-flex w-fit items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white sm:ml-auto">
        <LogOut className="h-4 w-4" />
        Log out
      </LogoutButton>
    </div>
  );
}
