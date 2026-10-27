import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LogoutButton } from "@/components/LogoutButton";
import {
  MobileDashboardMenu,
  type DashboardMenuItem,
} from "@/components/MobileDashboardMenu";
export default function OwnerDashboard() {
  const mobileItems: DashboardMenuItem[] = [
    { href: "/owner/dashboard", icon: "/owner/overview.png", label: "Overview" },
    { href: "/owner/properties", icon: "/owner/properties.png", label: "Properties" },
    { href: "/owner/rooms", icon: "/owner/bedsandrooms.png", label: "Rooms & beds" },
    { href: "/owner/applications", icon: "/owner/application.png", label: "Applications" },
    { href: "/owner/messages", icon: "/owner/message.png", label: "Messages" },
    { href: "/owner/settings", icon: "/icons/user.png", label: "Settings" },
  ];
  return (
    <div className="dashboard-page min-h-screen text-[#171717]">
      <header className=" bg-black text-white">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
         
          <LogoutButton className="mr-12 text-xs font-bold text-white/60 lg:mr-0">
            <LogOut className="mr-2 inline h-4 w-4" /> Logout
          </LogoutButton>
        </div>
      </header>
      <MobileDashboardMenu path="/owner/dashboard" items={mobileItems} />
      <div className="mx-auto grid max-w-[1400px] gap-28 px-5 py-10 lg:grid-cols-[210px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          
          <nav className="mt-8 space-y-1">
            {[
              ["/owner/overview.png", "Overview"],
              ["/owner/properties.png", "Properties"],
              ["/owner/bedsandrooms.png", "Rooms & beds"],
              ["/owner/application.png", "Applications"],
              ["/owner/message.png", "Messages"],
              ["/owner/settings.png", "Settings"],
            ].map(([icon, label], i) => (
              <a
                href="#"
                key={label as string}
                className={`flex items-center gap-3 rounded px-3 py-3 text-sm font-[500] ${i === 0 ? "bg-black text-white" : "text-black/55 hover:bg-white"}`}
              >
                <img src={icon} alt="" aria-hidden="true" className={`h-4 w-4 object-contain ${i === 0 ? "invert" : ""}`} />
                {label as string}
              </a>
            ))}
          </nav>
        </aside>
        <main className="w-full max-w-[1000px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Tuesday, September 8</p>
             
              <p className="mt-2 text-sm text-black/50">
                Your properties are performing well.
              </p>
            </div>
            <button className="w-fit rounded-full bg-black px-5 py-3 text-sm font-bold text-white">
              <Plus className="mr-2 inline h-4 w-4" /> Add property
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["245", "Total beds", Building2],
              ["218", "Occupied", Users],
              ["27", "Available", BedDouble],
            ].map(([num, label, Icon]) => (
              <div
                className="rounded-2xl border border-black/10 bg-white p-5"
                key={label as string}
              >
                <Icon className="h-5 w-5 text-[#a36500]" />
                <p className="mt-6 font-display text-3xl font-extrabold">
                  {num as string}
                </p>
                <p className="mt-1 text-xs text-black/50">{label as string}</p>
              </div>
            ))}
          </div>
          <section className="mt-8 rounded-2xl bg-black p-6 text-white">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#f5b544]">
                  Portfolio occupancy
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold">89%</p>
              </div>
              <p className="text-xs text-white/50">+6.4% this month</p>
            </div>
            <div className="mt-6 h-3 rounded-full bg-white/15">
              <div className="h-full w-[89%] rounded-full bg-[#f5b544]" />
            </div>
            <div className="mt-3 flex justify-between text-xs text-white/45">
              <span>218 occupied beds</span>
              <span>27 available</span>
            </div>
          </section>
          <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Needs your attention</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold">
                  Recent applications
                </h2>
              </div>
              <a href="#" className="text-xs font-bold text-[#a36500]">
                View all <ArrowRight className="ml-1 inline h-3 w-3" />
              </a>
            </div>
            <div className="mt-5 divide-y divide-black/10">
              {[
                [
                  "Sarah Johnson",
                  "Greenfield Residence · Single room",
                  "Submitted Sept 4",
                ],
                [
                  "Daniel Okafor",
                  "Greenfield Residence · Shared room",
                  "Submitted Sept 3",
                ],
                [
                  "Maya Bello",
                  "Campus View House · Single room",
                  "Submitted Sept 2",
                ],
              ].map(([name, details, date]) => (
                <div
                  className="flex items-center justify-between gap-4 py-4"
                  key={name}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5b544] text-xs font-bold">
                      {(name as string)
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{name as string}</p>
                      <p className="mt-1 text-xs text-black/45">
                        {details as string}
                      </p>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 text-xs font-bold text-[#1f9d55] sm:flex">
                    <CheckCircle2 className="h-4 w-4" /> {date as string}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
