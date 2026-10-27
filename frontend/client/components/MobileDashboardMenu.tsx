import { type ComponentType, useState } from "react";
import { Link } from "react-router-dom";
import { LogoutButton } from "@/components/LogoutButton";

type DashboardMenuItem = {
  href: string;
  label: string;
  icon?: string;
  Icon?: ComponentType<{ className?: string }>;
};

type MobileDashboardMenuProps = {
  path: string;
  items: DashboardMenuItem[];
};

export function MobileDashboardMenu({
  path,
  items,
}: MobileDashboardMenuProps) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="fixed right-4 top-5 z-[70] flex h-10 w-10 items-center justify-center lg:hidden"
      >
        <img
          src={open ? "/close.png" : "/menu.png"}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 object-contain"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close dashboard menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-transparent lg:hidden"
          />
          <aside className="fixed left-1/2 top-1/2 z-[65] flex h-[82vh] w-[89vw] max-w-[390px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[5px] bg-[#1c1c1c] p-6 text-white shadow-xl lg:hidden">
            <nav className="space-y" aria-label="Dashboard navigation">
              {items.map(({ href, label, icon, Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={closeMenu}
                  className="flex min-h-14 items-center rounded px-4 text-[17px] font-medium leading-tight text-white"
                >
                  {icon ? <img src={icon} alt="" aria-hidden="true" className="mr-3 h-5 w-5 object-contain invert" /> : Icon ? <Icon className="mr-3 h-5 w-5" /> : null}
                  <span>{label}</span>
                </Link>
              ))}
              <LogoutButton
                onClick={() => setOpen(false)}
                className="admin-logout flex min-h-14 w-full items-center rounded-xl px-4 text-left text-[17px] font-medium leading-tight text-white"
                aria-label="Log out"
              >
                Log out
              </LogoutButton>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

export type { DashboardMenuItem };
