import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileDashboardMenu } from "@/components/MobileDashboardMenu";

type MenuItem = {
  href: string;
  label: string;
  icon: string;
};

type StudentDashboardMenuProps = {
  path: string;
  items: MenuItem[];
  children?: ReactNode;
};

export function StudentDashboardMenu({
  path,
  items,
}: StudentDashboardMenuProps) {
  const renderItem = (item: MenuItem, compact: boolean) => {
    const active = path === item.href;

    return (
      <Link
        key={item.href}
        to={item.href}
        title={item.label}
        aria-label={item.label}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`flex items-center gap-3 rounded-[5px] transition-colors ${compact ? "h-11 shrink-0 px-4" : "px-3 py-3"} ${compact ? "bg-[#F6B544] text-white hover:bg-[#e4a331]" : active ? "bg-black text-white" : "text-black/55 hover:bg-[#FAFBFA]"}`}
      >
        <img
          src={item.icon}
          alt=""
          aria-hidden="true"
          className={`object-contain ${compact ? "h-5 w-5 invert" : "h-4 w-4"} ${active ? "invert" : "opacity-80"}`}
        />
        <span className={compact ? "text-[12px] font-[500] text-white" : "text-[12px] font-[500]"}>{item.label}</span>
      </Link>
    );
  };

  const desktopMenu = (
    <aside className="hidden h-full w-[220px] flex-col rounded-none bg-transparent p-0 text-[#171717] lg:flex">
      <h2 className="mt-2 font-display text-xl font-extrabold text-black">
        Dashboard
      </h2>
      <nav className="mt-8 space-y-1" aria-label="Student dashboard navigation">
        {items.map((item) => renderItem(item, false))}
        <LogoutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[12px] font-[500] text-black/55 hover:bg-[#FAFBFA]" aria-label="Log out">
          <img src="/icons/logout.png" alt="" aria-hidden="true" className="h-4 w-4" />
          Log out
        </LogoutButton>
      </nav>
    </aside>
  );

  return (
    <>
      {desktopMenu}
      <MobileDashboardMenu path={path} items={items} />
    </>
  );
}

export type { MenuItem };
