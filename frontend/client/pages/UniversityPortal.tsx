import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogoutButton, SettingsLogoutAction } from "@/components/LogoutButton";
import PropertyMediaCover from "@/components/PropertyMediaCover";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

type PropertyStatus = "under_review" | "verified" | "changes_requested";
type UniversityProperty = {
  property?: {
    name?: string;
    description?: string;
    city?: string;
    area?: string;
    university?: string;
    distance?: string;
  };
  photos?: string[];
  videos?: string[];
  amenities?: string[];
  rooms?: { name: string; beds: number; units?: number; price: string }[];
  submittedAt?: string;
  status?: PropertyStatus;
};

const nav = [
  ["/university", LayoutDashboard, "Overview"],
  ["/university/accommodation", Building2, "Accommodation"],
  ["/university/verification", ClipboardCheck, "Verification"],
  ["/university/recommendations", ShieldCheck, "Recommendations"],
  ["/university/students", Users, "Student support"],
  ["/university/reports", BarChart3, "Reports"],
  ["/university/settings", Settings, "Settings"],
] as const;
const titles: Record<string, [string, string]> = {
  "/university": ["Overview", "Your university accommodation workspace."],
  "/university/accommodation": [
    "Accommodation",
    "Review the accommodation network connected to your university.",
  ],
  "/university/verification": [
    "Verification",
    "Assess properties before recommending them to students.",
  ],
  "/university/recommendations": [
    "Recommendations",
    "Manage the properties your students can trust.",
  ],
  "/university/students": [
    "Student support",
    "Help students find a suitable place to live.",
  ],
  "/university/reports": [
    "Reports",
    "Understand accommodation demand and support needs.",
  ],
  "/university/settings": [
    "Settings",
    "Manage your university workspace and preferences.",
  ],
};

function readProperty(): UniversityProperty | null {
  try {
    const saved = window.localStorage.getItem("arc-owner-property");
    return saved ? (JSON.parse(saved) as UniversityProperty) : null;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: ReactNode }) {
  const path = useLocation().pathname;
  return (
    <div className="dashboard-page min-h-screen text-[#171717]">
      <header className="bg-black text-white">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          
          <LogoutButton className="text-xs font-bold text-white/60">
            <LogOut className="mr-2 inline h-4 w-4" /> Exit
          </LogoutButton>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] gap-28 px-5 py-8 lg:grid-cols-[230px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <p className="eyebrow">University partner</p>
          <h2 className="mt-2 font-display text-xl font-extrabold">
            Campus workspace
          </h2>
          <nav className="mt-8 space-y-1">
            {nav.map(([href, Icon, label]) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path === href ? "bg-black text-white" : "text-black/55 hover:bg-white"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="w-full max-w-[1000px]">{children}</main>
      </div>
    </div>
  );
}

function Heading({ path }: { path: string }) {
  const [title, subtitle] = titles[path] ?? [
    "University workspace",
    "Support students with trusted accommodation.",
  ];
  return (
    <div>
      <p className="eyebrow">University partner</p>
      <h1 className="mt-2 font-poppins text-4xl font-[550] tracking-[-.06em] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-black/50">{subtitle}</p>
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  copy,
  action = "Explore accommodation",
  href = "/university/accommodation",
}: {
  icon: typeof Building2;
  title: string;
  copy: string;
  action?: string;
  href?: string;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center sm:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
        <Icon />
      </div>
      <h2 className="mt-5 font-display text-2xl font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
        {copy}
      </p>
      <Link
        to={href}
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
      >
        {action}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </section>
  );
}

function Status({ status }: { status: PropertyStatus }) {
  const copy =
    status === "verified"
      ? "Verified"
      : status === "changes_requested"
        ? "Changes requested"
        : "Under review";
  const styles =
    status === "verified"
      ? "bg-[#dff3e6] text-[#16733b]"
      : status === "changes_requested"
        ? "bg-[#ffe3e3] text-[#a52a2a]"
        : "bg-[#fff4d6] text-[#8a5d00]";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold ${styles}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {copy}
    </span>
  );
}

function PropertyCard({
  property,
  onReview,
}: {
  property: UniversityProperty;
  onReview?: () => void;
}) {
  const details = property.property ?? {};
  return (
    <article className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5b544]/25">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold">
              {details.name || "Unnamed property"}
            </h2>
            <p className="mt-1 text-sm text-black/50">
              {details.city || "City not set"}
              {details.area ? ` · ${details.area}` : ""}{" "}
              {details.university ? `· Near ${details.university}` : ""}
            </p>
          </div>
        </div>
        {property.status && <Status status={property.status} />}
      </div>
      <div className="mt-5 h-40 overflow-hidden rounded-xl">
        <PropertyMediaCover
          name={details.name || "Property"}
          photos={property.photos}
          videos={property.videos}
        />
      </div>
      <div className="mt-7 grid gap-5 border-t border-black/10 pt-6 sm:grid-cols-4">
        <div>
          <p className="text-xs text-black/45">Media</p>
          <p className="mt-1 text-lg font-bold">
            {(property.photos?.length ?? 0) + (property.videos?.length ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-black/45">Amenities</p>
          <p className="mt-1 text-lg font-bold">
            {property.amenities?.length ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-black/45">Room types</p>
          <p className="mt-1 text-lg font-bold">
            {property.rooms?.length ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-black/45">Bed spaces</p>
          <p className="mt-1 text-lg font-bold">
            {property.rooms?.reduce((sum, room) => sum + room.beds * (room.units ?? 1), 0) ?? 0}
          </p>
        </div>
      </div>
      {onReview && (
        <button
          onClick={onReview}
          className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
        >
          Review property <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      )}
    </article>
  );
}

function Overview({ property }: { property: UniversityProperty | null }) {
  return (
    <>
      {
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <Building2 className="h-5 w-5 text-[#a36500]" />
            <p className="mt-6 font-display text-3xl font-extrabold">
              {property ? "1" : "—"}
            </p>
            <p className="mt-1 text-xs text-black/50">Connected properties</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <ClipboardCheck className="h-5 w-5 text-[#a36500]" />
            <p className="mt-6 font-display text-3xl font-extrabold">
              {property?.status === "under_review" ? "1" : "—"}
            </p>
            <p className="mt-1 text-xs text-black/50">Awaiting verification</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <Users className="h-5 w-5 text-[#a36500]" />
            <p className="mt-6 font-display text-3xl font-extrabold">—</p>
            <p className="mt-1 text-xs text-black/50">Students supported</p>
          </div>
        </div>
      }
      {property ? (
        <PropertyCard property={property} />
      ) : (
        <Empty
          icon={Building2}
          title="No accommodation connected"
          copy="Properties submitted by hostel partners for your university will appear here."
          action="Review accommodation"
        />
      )}
    </>
  );
}

function Verification({
  property,
  setProperty,
}: {
  property: UniversityProperty | null;
  setProperty: (property: UniversityProperty) => void;
}) {
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState<PropertyStatus | null>(null);
  if (!property)
    return (
      <Empty
        icon={ClipboardCheck}
        title="Verification queue is empty"
        copy="There are no accommodation properties awaiting review right now."
        action="View accommodation"
      />
    );
  const update = (status: PropertyStatus) => {
    const next = { ...property, status };
    window.localStorage.setItem("arc-owner-property", JSON.stringify(next));
    setProperty(next);
    setConfirming(null);
    setNotice(
      status === "verified"
        ? "Property verified and ready for recommendations."
        : "Changes requested from the property owner.",
    );
  };
  return (
    <>
      <PropertyCard
        property={property}
        onReview={() => setConfirming("verified")}
      />
      {notice && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#dff3e6] px-4 py-3 text-xs font-bold text-[#16733b]"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => setConfirming("changes_requested")}
          className="rounded-full border border-[#a52a2a]/20 px-4 py-3 text-xs font-bold text-[#a52a2a]"
        >
          Request changes
        </button>
        <button
          onClick={() => setConfirming("verified")}
          className="rounded-full bg-black px-4 py-3 text-xs font-bold text-white"
        >
          Verify property <Check className="ml-2 inline h-4 w-4" />
        </button>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-7">
            <button
              onClick={() => setConfirming(null)}
              className="float-right rounded-full p-1 text-black/45"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="eyebrow">Confirm review action</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {confirming === "verified"
                ? "Verify this property?"
                : "Request changes?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              This status will be shared with the property workspace when
              backend synchronization is connected.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-full border border-black/15 py-3 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => update(confirming)}
                className="flex-1 rounded-full bg-black py-3 text-xs font-bold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Accommodation({ property }: { property: UniversityProperty | null }) {
  return property ? (
    <PropertyCard property={property} />
  ) : (
    <Empty
      icon={Building2}
      title="No accommodation yet"
      copy="Approved and submitted accommodation partners will appear here when connected to your university."
      action="Invite a property partner"
    />
  );
}
function Generic({ title }: { title: string }) {
  return (
    <Empty
      icon={CheckCircle2}
      title={`${title} workspace ready`}
      copy="This frontend surface is ready for live university data, filters, actions, and API integration."
      action="Return to overview"
      href="/university"
    />
  );
}

function UniversitySettings() {
  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
      <p className="eyebrow">Account</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold">
        University settings
      </h2>
      <SettingsLogoutAction />
    </section>
  );
}

export default function UniversityPortal() {
  const path = useLocation().pathname;
  const [property, setProperty] = useState<UniversityProperty | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setProperty(readProperty());
    setLoading(false);
  }, []);
  if (loading)
    return (
      <Shell>
        <div className="h-64 animate-pulse rounded-2xl bg-black/5" />
      </Shell>
    );
  return (
    <Shell>
      <Heading path={path} />
      {path === "/university" ? (
        <Overview property={property} />
      ) : path === "/university/accommodation" ? (
        <Accommodation property={property} />
      ) : path === "/university/verification" ? (
        <Verification property={property} setProperty={setProperty} />
      ) : path === "/university/settings" ? (
        <UniversitySettings />
      ) : (
        <Generic title={titles[path]?.[0] ?? "University"} />
      )}
    </Shell>
  );
}
