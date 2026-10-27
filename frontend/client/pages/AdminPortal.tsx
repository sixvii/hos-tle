import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogoutButton, SettingsLogoutAction } from "@/components/LogoutButton";
import PropertyMediaCover from "@/components/PropertyMediaCover";
import { MobileDashboardMenu } from "@/components/MobileDashboardMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getAdminOverview,
  getAdminBookings,
  getAdminDisputes,
  getAdminReports,
  getAdminProperties,
  getAdminUsers,
  getAdminVerification,
  deleteAdminUser,
  getStoredSessionToken,
  getStoredSession,
  getProfilePhoto,
  reviewProperty,
  storeProfilePhoto,
  storeSession,
  updateAdminUserStatus,
  updateProfilePhoto,
  uploadImageToCloudinary,
  type AdminMetrics,
  type AdminBooking,
  type AdminDispute,
  type AdminReports,
  type AdminUser,
  type BackendProperty,
} from "@/lib/api";
import { createAdminAccount } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ChevronDown,
  CircleHelp,
  DollarSign,
  Eye,
  EyeOff,
  FileWarning,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

type PropertyStatus = "under_review" | "verified" | "changes_requested";
type PropertyRecord = {
  id?: string;
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
type ApplicationRecord = {
  id: string;
  firstName: string;
  lastName: string;
  university: string;
  status?: string;
};

function toPropertyRecord(property: BackendProperty): PropertyRecord {
  return {
    id: property.id,
    property,
    photos: property.photos,
    videos: property.videos,
    amenities: property.amenities,
    rooms: property.rooms.map((room) => ({ ...room, price: `₦${room.price.toLocaleString()}` })),
    status: property.status === "draft" ? "under_review" : property.status,
  };
}

const nav = [
  { href: "/admin", label: "Overview", icon: "/admin/overview.png" },
  { href: "/admin/users", label: "Users", icon: "/admin/user.png" },
  { href: "/admin/properties", label: "Properties", icon: "/admin/properties.png" },
  { href: "/admin/verification", label: "Verification", icon: "/admin/verification.png" },
  { href: "/admin/bookings", label: "Bookings", icon: "/admin/bookings.png" },
  { href: "/admin/payments", label: "Payments", icon: "/admin/payments.png" },
  { href: "/admin/disputes", label: "Disputes", icon: "/admin/dispute.png" },
  { href: "/admin/reports", label: "Reports", icon: "/admin/report.png" },
  { href: "/admin/settings", label: "Settings", icon: "/admin/settings.png" },
] as const;
const titles: Record<string, [string, string]> = {
  "/admin": ["OVERVIEW", "Monitor the hostel marketplace."],
  "/admin/users": [
    "USERS",
    "Manage students, owners, and university partners.",
  ],
  "/admin/properties": [
    "PROPERTIES",
    "Review the accommodation marketplace inventory.",
  ],
  "/admin/verification": [
    "VERIFICATION",
    "Keep property and partner verification moving.",
  ],
  "/admin/bookings": ["BOOKINGS", "Monitor reservations and move-in activity."],
  "/admin/payments": ["PAYMENTS", "Review marketplace payment activity."],
  "/admin/disputes": [
    "DISPUTES",
    "Resolve issues with care and a clear record.",
  ],
  "/admin/reports": ["REPORTS", "Understand platform activity and outcomes."],
  "/admin/settings": ["SETTINGS", "Manage platform preferences and controls."],
};

function readProperty(): PropertyRecord | null {
  try {
    const saved = window.localStorage.getItem("arc-owner-property");
    return saved ? (JSON.parse(saved) as PropertyRecord) : null;
  } catch {
    return null;
  }
}
function readApplication(): ApplicationRecord | null {
  try {
    const saved = window.localStorage.getItem("arc.student.application");
    return saved ? (JSON.parse(saved) as ApplicationRecord) : null;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: ReactNode }) {
  const path = useLocation().pathname;
  const session = getStoredSession();
  const profilePhoto = session ? getProfilePhoto(session.user) : "";
  return (
    <div className="admin-dashboard dashboard-page min-h-screen bg-[#FAFAFA] text-[#253F49] font-[490]">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-[60px] bg-white lg:flex lg:flex-col">
        <div className="flex h-[64px] items-center justify-center">
          <Link to="/" aria-label="Return to Hostle home">
            <img src="/hostle.jpeg" alt="Hostle home" className="h-8 w-8 object-contain" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3" aria-label="Admin dashboard navigation">
          {nav.map(({ href, label, icon }) => {
            const active = path === href;
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    to={href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#253F49] ${active ? "border-[0.5px] border-[#626262] text-[#202124]" : "text-[#5f6368] hover:bg-[#f7f8f8]"}`}
                  >
                    <img src={icon} alt="" aria-hidden="true" className="h-[22px] w-[22px] object-contain" style={{ filter: "brightness(0) saturate(100%) invert(38%)" }} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="z-[100] whitespace-nowrap rounded border border-[#d9dddf] bg-white px-3 py-2 text-xs font-medium text-[#253F49] shadow-md">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="flex justify-center p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <LogoutButton aria-label="Log out" className="admin-logout flex h-12 w-12 items-center justify-center rounded-xl text-[#5f6368] transition-colors hover:bg-[#f7f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#253F49]">
                <LogOut className="h-6 w-6" />
              </LogoutButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="z-[100] whitespace-nowrap rounded-md border border-[#d9dddf] bg-white px-3 py-2 text-xs font-medium text-[#253F49] shadow-md">
              Log out
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between bg-[#FAFAFA] px-5 lg:ml-[80px] lg:px-7">
        <div className="flex min-w-0 items-center gap-3 text-[13px] text-[#5f6368]">
          
        </div>
      </header>
      <aside className="admin-utility-rail fixed right-0 top-0 z-40 hidden h-screen w-[58px] flex-col items-center gap-5 bg-white py-5 lg:flex" aria-label="Admin utilities">
        <button type="button" className="admin-utility" aria-label="Help"><CircleHelp /></button>
        <button type="button" className="admin-utility" aria-label="More options"><MoreHorizontal /></button>
        <button type="button" className="admin-utility" aria-label="App launcher"><Grid3X3 /></button>
        <Link to="/admin/settings" className="admin-utility" aria-label="Open admin settings"><span className="admin-avatar flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-[495]">{profilePhoto ? <img src={profilePhoto} alt={`${session?.user.name} profile`} className="h-full w-full object-cover" /> : session?.user.name.charAt(0).toUpperCase()}</span></Link>
      </aside>
      <MobileDashboardMenu path={path} items={nav.map(({ href, label, icon }) => ({ href, label, icon }))} />
      <div className="min-h-[calc(100vh-64px)] lg:ml-[84px] lg:mr-[58px]">
        <main className="mx-auto mt-6 w-full max-w-[1180px] rounded-xl bg-[#FAFAFA] p-6 font-[490] text-[#626262] sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
function Heading({ path }: { path: string }) {
  const [title, subtitle] = titles[path] ?? [
    "Admin dashboard",
    "Manage the marketplace.",
  ];
  return (
    <div className="pb-6">
      <h1 className="mt-3 font-display text-[17px] font-[495] tracking-[-.02em] text-[#253F49]">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-[13px] font-[495] text-[#253F49]">{subtitle}</p>
    </div>
  );
}
function Empty({
  icon: Icon,
  title,
  copy,
  action = "Return to overview",
  href = "/admin",
}: {
  icon: typeof Building2;
  title: string;
  copy: string;
  action?: string;
  href?: string;
}) {
  return (
    <section className="admin-empty-card mt-8 rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center sm:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
        <Icon />
      </div>
      <h2 className="mt-5 text-[16px] font-[495] leading-tight text-[#626262]">{title}</h2>
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
  const label =
    status === "verified"
      ? "Verified"
      : status === "changes_requested"
        ? "Changes requested"
        : "Under review";
  const style =
    status === "verified"
      ? "bg-[#dff3e6] text-[#16733b]"
      : status === "changes_requested"
        ? "bg-[#ffe3e3] text-[#a52a2a]"
        : "bg-[#fff4d6] text-[#8a5d00]";
  return (
    <span className={`rounded-full px-3 py-2 text-[11px] font-bold ${style}`}>
      {label}
    </span>
  );
}
function PropertyCard({
  property,
  action,
}: {
  property: PropertyRecord;
  action?: ReactNode;
}) {
  const details = property.property ?? {};
  return (
    <section className="mt-8 rounded border border-black/10 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[14px] font-bold text-black/45">Property record</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">
            {details.name || "Unnamed property"}
          </h2>
          <p className="mt-1 text-sm text-black/50">
            {details.city || "City not set"}
            {details.area ? ` · ${details.area}` : ""}{" "}
            {details.university ? `· Near ${details.university}` : ""}
          </p>
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
          <p className="text-[14px] text-black/45">Media</p>
          <p className="mt-1 text-lg font-bold">
            {(property.photos?.length ?? 0) + (property.videos?.length ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[14px] text-black/45">Amenities</p>
          <p className="mt-1 text-lg font-bold">
            {property.amenities?.length ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[14px] text-black/45">Room types</p>
          <p className="mt-1 text-lg font-bold">
            {property.rooms?.length ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[14px] text-black/45">Beds</p>
          <p className="mt-1 text-lg font-bold">
            {property.rooms?.reduce((sum, room) => sum + room.beds * (room.units ?? 1), 0) ?? 0}
          </p>
        </div>
      </div>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
function Overview({
  property,
  metrics,
}: {
  property: PropertyRecord | null;
  metrics: AdminMetrics | null;
}) {
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded border border-black/10 bg-white p-5">
          <Users className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {metrics?.users ?? "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">User records</p>
        </div>
        <div className="rounded border border-black/10 bg-white p-5">
          <Building2 className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {metrics?.properties ?? "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Properties</p>
        </div>
        <div className="rounded border border-black/10 bg-white p-5">
          <ClipboardCheck className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {metrics?.pendingVerification ?? "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Review queue</p>
        </div>
        <div className="rounded border border-black/10 bg-white p-5">
          <ShieldAlert className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">—</p>
          <p className="mt-1 text-xs text-black/50">Open disputes</p>
        </div>
      </div>
      {property ? (
        <PropertyCard
          property={property}
          action={
            <Link
              to="/admin/verification"
              className="inline-flex rounded bg-black px-5 py-3 text-[14px] font-[500] text-white"
            >
              Open verification
            </Link>
          }
        />
      ) : (
        <Empty
          icon={LayoutDashboard}
          title="Admin dashboard is ready"
          copy="Marketplace records, verification queues, and reports will appear here when live platform data is connected."
          action="Review verification"
          href="/admin/verification"
        />
      )}
    </>
  );
}
function Verification({
  properties,
  onReview,
}: {
  properties: PropertyRecord[];
  onReview: (id: string, status: "verified" | "changes_requested") => Promise<void>;
}) {
  const [confirming, setConfirming] = useState<{ id: string; status: "verified" | "changes_requested" } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  if (!properties.length)
    return (
      <Empty
        icon={ClipboardCheck}
        title="Verification queue is empty"
        copy="No property records are waiting for platform review."
        action="View properties"
        href="/admin/properties"
      />
    );
  const update = async () => {
    if (!confirming) return;
    setError("");
    try {
      await onReview(confirming.id, confirming.status);
      setConfirming(null);
      setError("");
      setNotice(confirming.status === "verified" ? "Property approved for the marketplace." : "Changes requested from the owner.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The moderation action could not be completed.");
    }
  };
  return (
    <>
      {notice && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#dff3e6] px-4 py-3 text-xs font-bold text-[#16733b]"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}
      {error && <p className="mt-4 rounded-xl bg-[#ffe3e3] px-4 py-3 text-xs font-semibold text-[#a52a2a]">{error}</p>}
      <div className="mt-2 space-y-4">
        {properties.map((property) => (
          <div key={property.id}>
            <PropertyCard property={property} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => setConfirming({ id: property.id ?? "", status: "changes_requested" })} className="rounded-full border border-[#a52a2a]/20 px-4 py-3 text-xs font-bold text-[#a52a2a]">Request changes</button>
              <button type="button" onClick={() => setConfirming({ id: property.id ?? "", status: "verified" })} className="rounded-full bg-black px-4 py-3 text-xs font-bold text-white">Approve property <Check className="ml-2 inline h-4 w-4" /></button>
            </div>
          </div>
        ))}
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
            <p className="eyebrow">Confirm admin action</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {confirming.status === "verified"
                ? "Approve property?"
                : "Request changes?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              This updates the property status for the owner and marketplace.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-full border border-black/15 py-3 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => void update()}
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
function Properties({ properties }: { properties: PropertyRecord[] }) {
  return properties.length ? (
    <>
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4">
        <Search className="h-4 w-4 text-black/35" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Search properties when live data is connected"
        />
      </div>
      {properties.map((property) => <PropertyCard key={property.id} property={property} action={<Link to={`/admin/properties/${property.id}`} className="inline-flex rounded-full border border-black/15 px-4 py-3 text-xs font-bold">Review record <ArrowRight className="ml-2 h-4 w-4" /></Link>} />)}
    </>
  ) : (
    <Empty
      icon={Building2}
      title="No properties yet"
      copy="Property records submitted to the marketplace will appear here for moderation."
      action="Open verification"
      href="/admin/verification"
    />
  );
}
function PropertyDetail({ property }: { property: PropertyRecord }) {
  return (
    <>
      <Link to="/admin/properties" className="mt-8 inline-flex items-center text-xs font-bold text-black/50 hover:text-black">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to properties
      </Link>
      <PropertyCard
        property={property}
        action={property.status === "under_review" || property.status === "changes_requested" ? <Link to="/admin/verification" className="inline-flex rounded-full bg-black px-4 py-3 text-xs font-bold text-white">Open verification <ArrowRight className="ml-2 h-4 w-4" /></Link> : undefined}
      />
    </>
  );
}
function UserStatus({ status }: { status: AdminUser["status"] }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] font-bold capitalize ${status === "suspended" ? "bg-[#ffe3e3] text-[#a52a2a]" : "bg-[#dff3e6] text-[#16733b]"}`}>{status}</span>;
}

function UserDetail({ user, onUserChange, onDelete }: { user: AdminUser; onUserChange: (user: AdminUser) => void; onDelete: (id: string) => Promise<void> }) {
  const navigate = useNavigate();
  const currentUser = getStoredSession()?.user;
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const canManageStatus = user.id !== currentUser?.id && user.role !== "superadmin" && (currentUser?.role === "superadmin" || user.role !== "admin");
  const canDelete = currentUser?.role === "superadmin" && user.role === "admin";
  const updateStatus = async () => {
    const token = getStoredSessionToken();
    if (!token) return;
    setBusy(true); setNotice("");
    try {
      const updated = await updateAdminUserStatus(user.id, user.status === "suspended" ? "active" : "suspended", token);
      onUserChange(updated);
      setNotice(`User ${updated.status === "suspended" ? "suspended" : "unsuspended"} successfully.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "User status could not be updated.");
    } finally { setBusy(false); }
  };
  const removeUser = async () => {
    if (!window.confirm(`Delete ${user.name}'s admin account? This cannot be undone.`)) return;
    setBusy(true); setNotice("");
    try { await onDelete(user.id); navigate("/admin/users"); } catch (error) { setNotice(error instanceof Error ? error.message : "User could not be deleted."); setBusy(false); }
  };
  return <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
    <button type="button" onClick={() => navigate("/admin/users")} className="inline-flex items-center text-xs font-bold text-black/50 hover:text-black"><ArrowLeft className="mr-2 h-4 w-4" /> Back to users</button>
    <div className="mt-8 flex flex-col justify-between gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-start"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#f5b544] text-xl font-extrabold">{user.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt={`${user.name} profile`} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}</div><div><p className="eyebrow">User record</p><h2 className="mt-2 font-display text-3xl font-extrabold">{user.name}</h2><p className="mt-1 text-sm text-black/50">{user.email}</p></div></div><div className="flex items-center gap-2"><UserStatus status={user.status} /><span className="rounded-full bg-[#f7f6f3] px-3 py-2 text-[11px] font-bold capitalize">{user.role}</span></div></div>
    {notice && <p className="mt-5 rounded-xl bg-[#f7f6f3] px-4 py-3 text-xs font-semibold" role="status">{notice}</p>}
    <div className="mt-7 grid gap-6 sm:grid-cols-2"><div><p className="text-xs text-black/45">Full name</p><p className="mt-1 font-bold">{user.name}</p></div><div><p className="text-xs text-black/45">Email address</p><p className="mt-1 font-bold break-all">{user.email}</p></div><div><p className="text-xs text-black/45">Phone number</p><p className="mt-1 font-bold">{user.phoneNumber || "Not provided"}</p></div><div><p className="text-xs text-black/45">Role</p><p className="mt-1 font-bold capitalize">{user.role}</p></div><div><p className="text-xs text-black/45">School / university</p><p className="mt-1 font-bold">{user.schoolName || "Not provided"}</p></div><div><p className="text-xs text-black/45">Account created</p><p className="mt-1 font-bold">{new Date(user.createdAt).toLocaleString()}</p></div>{user.ownerType && <div><p className="text-xs text-black/45">Owner type</p><p className="mt-1 font-bold capitalize">{user.ownerType}</p></div>}{user.companyAddress && <div><p className="text-xs text-black/45">Company address</p><p className="mt-1 font-bold">{user.companyAddress}</p></div>}</div>
    {(canManageStatus || canDelete) && <div className="mt-8 flex flex-wrap gap-3 border-t border-black/10 pt-6">{canManageStatus && <button type="button" disabled={busy} onClick={() => void updateStatus()} className={`rounded-full px-5 py-3 text-xs font-bold ${user.status === "suspended" ? "bg-black text-white" : "border border-[#a52a2a]/25 text-[#a52a2a]"}`}>{user.status === "suspended" ? "Unsuspend user" : "Suspend user"}</button>}{canDelete && <button type="button" disabled={busy} onClick={() => void removeUser()} className="rounded-full border border-[#a52a2a]/25 px-5 py-3 text-xs font-bold text-[#a52a2a]">Delete user account</button>}</div>}
  </section>;
}

function UsersPage({ users }: { users: AdminUser[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const filteredUsers = users.filter((user) => `${user.name} ${user.email} ${user.phoneNumber ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return users.length ? (
    <section className="mt-8 space-y-5">
      <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"><Search className="h-5 w-5 text-black/35" /><span className="sr-only">Search users</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email or phone number" className="w-full bg-transparent text-sm outline-none" /></label>
      {filteredUsers.length ? <div className="grid gap-4 md:grid-cols-2">{filteredUsers.map((user) => <button type="button" key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)} className="rounded-2xl border border-black/10 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_12px_35px_rgba(0,0,0,.08)]"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f5b544] text-lg font-extrabold">{user.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt={`${user.name} profile`} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}</div><div><h2 className="font-display text-lg font-extrabold">{user.name}</h2><p className="mt-1 break-all text-xs text-black/50">{user.email}</p></div></div><UserStatus status={user.status} /></div><div className="mt-6 grid gap-3 border-t border-black/10 pt-4 text-xs sm:grid-cols-2"><div><p className="text-black/45">Role</p><p className="mt-1 font-bold capitalize">{user.role}</p></div><div><p className="text-black/45">Phone</p><p className="mt-1 font-bold">{user.phoneNumber || "Not provided"}</p></div></div><p className="mt-5 text-xs font-bold text-[#a36500]">View full user record <ArrowRight className="ml-1 inline h-3 w-3" /></p></button>)}</div> : <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center"><p className="font-display text-lg font-extrabold">No matching users</p><p className="mt-2 text-sm text-black/50">Try another name, email, or phone number.</p></div>}
    </section>
  ) : (
    <Empty
      icon={Users}
      title="No user records yet"
      copy="Students, owners, and university partners will appear here when accounts are connected."
      action="Return to overview"
    />
  );
}
function Generic({
  title,
  icon: Icon,
}: {
  title: string;
  icon: typeof Building2;
}) {
  return (
    <Empty
      icon={Icon}
      title={`${title} ready`}
      copy="This frontend surface is ready for live platform data, filters, actions, and API integration."
    />
  );
}

function AdminBookings({ bookings }: { bookings: AdminBooking[] }) {
  if (!bookings.length) return <Empty icon={CalendarDays} title="No bookings yet" copy="Student booking activity will appear here when reservations are created." />;
  return <section className="mt-8 space-y-4">{bookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-black/10 bg-white p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-display text-lg font-extrabold">{booking.studentName}</p><p className="mt-1 text-xs text-black/50">{booking.studentEmail}</p></div><span className={`w-fit rounded-full px-3 py-2 text-[11px] font-bold capitalize ${booking.status === "confirmed" ? "bg-[#dff3e6] text-[#16733b]" : booking.status === "cancelled" ? "bg-[#ffe3e3] text-[#a52a2a]" : "bg-[#fff4d6] text-[#8a5d00]"}`}>{booking.status}</span></div><div className="mt-5 grid gap-4 border-t border-black/10 pt-4 text-xs sm:grid-cols-4"><div><p className="text-black/45">Property</p><p className="mt-1 font-bold">{booking.propertyName}</p></div><div><p className="text-black/45">Room</p><p className="mt-1 font-bold">{booking.roomName}</p></div><div><p className="text-black/45">Move-in</p><p className="mt-1 font-bold">{booking.moveInDate}</p></div><div><p className="text-black/45">Amount</p><p className="mt-1 font-bold">₦{booking.amount.toLocaleString()}</p></div></div></article>)}</section>;
}

function AdminPayments() {
  return <Empty icon={CreditCard} title="Payments are not connected" copy="Payment records will appear here when a payment provider is enabled. No payment activity is being fabricated." />;
}

function AdminDisputes({ disputes }: { disputes: AdminDispute[] }) {
  const [query, setQuery] = useState("");
  const filteredDisputes = disputes.filter((dispute) => `${dispute.topic} ${dispute.name} ${dispute.email} ${dispute.message}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (!disputes.length) return <Empty icon={FileWarning} title="No disputes or support cases" copy="Reported issues and support tickets will appear here for administrator review." />;
  return <section className="mt-8 space-y-4"><label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"><Search className="h-5 w-5 text-black/35" /><span className="sr-only">Search disputes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic, name, email or message" className="w-full bg-transparent text-sm outline-none" /></label>{filteredDisputes.length ? filteredDisputes.map((dispute) => <article key={dispute.id} className="rounded-2xl border border-black/10 bg-white p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-display text-lg font-extrabold">{dispute.topic}</p><p className="mt-1 break-all text-xs text-black/50">{dispute.name} · {dispute.email}</p></div><span className={`w-fit rounded-full px-3 py-2 text-[11px] font-bold capitalize ${dispute.status === "closed" ? "bg-[#dff3e6] text-[#16733b]" : "bg-[#fff4d6] text-[#8a5d00]"}`}>{dispute.status || "open"}</span></div><p className="mt-5 border-t border-black/10 pt-4 text-sm leading-6 text-black/70">{dispute.message}</p><p className="mt-3 text-xs text-black/45">Submitted {new Date(dispute.createdAt).toLocaleString()}</p></article>) : <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center"><p className="font-display text-lg font-extrabold">No matching disputes</p><p className="mt-2 text-sm text-black/50">Try another topic, name, email, or message.</p></div>}</section>;
}

function AdminReports({ reports }: { reports: AdminReports | null }) {
  if (!reports) return <Empty icon={BarChart3} title="Reports are unavailable" copy="Reports could not be loaded for this session." />;
  const cards: Array<[string, string | number]> = [["Total booking value", `₦${reports.totalBookingValue.toLocaleString()}`], ["Total users", Object.values(reports.usersByRole).reduce((sum, value) => sum + value, 0)], ["Properties", Object.values(reports.propertiesByStatus).reduce((sum, value) => sum + value, 0)], ["Bookings", Object.values(reports.bookingsByStatus).reduce((sum, value) => sum + value, 0)]];
  const breakdowns: Array<[string, Record<string, number>]> = [["Users by role", reports.usersByRole], ["Properties by status", reports.propertiesByStatus], ["Bookings by status", reports.bookingsByStatus]];
  return <section className="mt-8 space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs text-black/45">{label}</p><p className="mt-3 font-display text-2xl font-extrabold">{value}</p></div>)}</div><div className="grid gap-5 md:grid-cols-3">{breakdowns.map(([title, values]) => <section key={title} className="rounded-2xl border border-black/10 bg-white p-6"><h2 className="font-display text-lg font-extrabold">{title}</h2><div className="mt-5 space-y-3">{Object.entries(values).map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><span className="capitalize text-black/55">{label.replace(/_/g, " ")}</span><strong>{value}</strong></div>)}</div></section>)}</div></section>;
}

function AdminSettings() {
  const session = getStoredSession();
  const [photoUrl, setPhotoUrl] = useState(() => session ? getProfilePhoto(session.user) : "");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const token = getStoredSessionToken();
    if (!file || !token || !session) return;
    if (!file.type.startsWith("image/")) return setNotice("Choose a valid image file.");
    const previousPhotoUrl = photoUrl;
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);
    setUploading(true); setNotice("");
    try {
      const nextPhoto = await uploadImageToCloudinary(file, token, "profile");
      const updatedUser = await updateProfilePhoto(nextPhoto, token);
      storeProfilePhoto(session.user.id, nextPhoto);
      storeSession({ ...session, user: updatedUser });
      setPhotoUrl(nextPhoto);
      setNotice("Profile picture updated successfully.");
    } catch (error) {
      setPhotoUrl(previousPhotoUrl);
      setNotice(error instanceof Error ? error.message : "The profile picture could not be uploaded.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
    }
  };
  return <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 sm:p-8"><p className="eyebrow">Platform controls</p><h2 className="mt-2 font-display text-2xl font-extrabold">Admin settings</h2><p className="mt-2 text-sm leading-6 text-black/50">Your platform configuration is managed by the backend environment. Account-level controls are available from the Users page.</p><div className="mt-7 flex flex-col gap-4 border-y border-black/10 py-6 sm:flex-row sm:items-center"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5b544] text-2xl font-extrabold">{photoUrl ? <img src={photoUrl} alt={`${session?.user.name} profile`} className="h-full w-full object-cover" /> : session?.user.name.charAt(0).toUpperCase()}</div><div><p className="font-bold">Profile picture</p><p className="mt-1 text-xs text-black/50">This image appears on admin user cards.</p></div><label className="cursor-pointer rounded-full bg-black px-4 py-3 text-center text-xs font-bold text-white sm:ml-auto">{uploading ? "Uploading..." : "Upload picture"}<input type="file" accept="image/*" disabled={uploading} onChange={uploadPhoto} className="hidden" /></label></div>{notice && <p className="mt-4 rounded-xl bg-[#f7f6f3] px-4 py-3 text-xs font-semibold" role="status">{notice}</p>}<div className="mt-7 grid gap-5 sm:grid-cols-2"><div><p className="text-xs text-black/45">Signed-in account</p><p className="mt-1 font-bold">{session?.user.name}</p></div><div><p className="text-xs text-black/45">Access level</p><p className="mt-1 font-bold capitalize">{session?.user.role}</p></div><div><p className="text-xs text-black/45">Session email</p><p className="mt-1 break-all font-bold">{session?.user.email}</p></div><div><p className="text-xs text-black/45">Account status</p><p className="mt-1 font-bold capitalize">{session?.user.status}</p></div></div></section>;
}

function SuperadminTools({ onCreated }: { onCreated: (user: AdminUser) => void }) {
  const session = getStoredSessionToken();
  const currentSession = session ? getStoredSession() : null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  if (currentSession?.user.role !== "superadmin") return null;
  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    try {
      const createdUser = await createAdminAccount({ name, email, password }, session);
      onCreated(createdUser);
      setNotice("Admin account created successfully.");
      setName(""); setEmail(""); setPassword("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The admin account could not be created.");
    }
  };
  return <section className="mt-8 rounded border border-black/10 bg-white p-6 sm:p-8"><p className="eyebrow">Superadmin controls</p><h2 className="mt-2 text-[16px] font-[460]">Create an admin account</h2><p className="mt-2 text-sm text-black/50">Only the default superadmin can create standard admin users.</p><form onSubmit={create} className="mt-6 grid gap-4 sm:grid-cols-3"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="h-10 rounded border border-black/15 bg-[#FAFBFA] px-3 text-[14px] font-[500] outline-none transition focus:border-black" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="h-10 rounded border border-black/15 bg-[#FAFBFA] px-3 text-[14px] font-[500] outline-none transition focus:border-black" /><div className="relative"><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Temporary password" className="h-10 w-full rounded border border-black/15 bg-[#FAFBFA] px-3 pr-11 text-[14px] font-[500] outline-none transition focus:border-black" /><button type="button" aria-label={showPassword ? "Hide temporary password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/45 hover:text-black cursor-pointer">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><button type="submit" className="w-fit rounded bg-[#ECEDED] px-5 py-3 text-[14px] font-[500] text-[#1c1c1c] sm:col-span-3 sm:justify-self-start">Create admin user</button></form>{notice && <p className="mt-4 rounded-xl bg-[#f7f6f3] px-4 py-3 text-xs font-semibold">{notice}</p>}</section>;
}

export default function AdminPortal() {
  const pathname = useLocation().pathname;
  const path = pathname;
  const propertyId = pathname.startsWith("/admin/properties/")
    ? pathname.slice("/admin/properties/".length).split("/")[0]
    : undefined;
  const userId = pathname.startsWith("/admin/users/")
    ? pathname.slice("/admin/users/".length).split("/")[0]
    : undefined;
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [verification, setVerification] = useState<PropertyRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = getStoredSessionToken();
    if (!token) return setLoading(false);
    Promise.all([getAdminOverview(token), getAdminProperties(token), getAdminUsers(token), getAdminVerification(token), getAdminBookings(token), getAdminDisputes(token), getAdminReports(token)])
      .then(([nextMetrics, nextProperties, nextUsers, nextVerification, nextBookings, nextDisputes, nextReports]) => {
        setMetrics(nextMetrics);
        setProperties(nextProperties.map(toPropertyRecord));
        setUsers(nextUsers);
        setVerification(nextVerification.map(toPropertyRecord));
        setBookings(nextBookings);
        setDisputes(nextDisputes);
        setReports(nextReports);
        setProperty(nextProperties[0] ? toPropertyRecord(nextProperties[0]) : null);
      })
      .finally(() => setLoading(false));
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
      {path === "/admin" ? (
        <><Overview property={property} metrics={metrics} /><SuperadminTools onCreated={(createdUser) => setUsers((current) => current.some((user) => user.id === createdUser.id) ? current : [...current, createdUser])} /></>
      ) : path.startsWith("/admin/properties/") ? (
        propertyId && properties.find((item) => item.id === propertyId) ? <PropertyDetail property={properties.find((item) => item.id === propertyId)!} /> : <Empty icon={Building2} title="Property not found" copy="This property record is no longer available." action="Back to properties" href="/admin/properties" />
      ) : path === "/admin/properties" ? (
        <Properties properties={properties} />
      ) : path === "/admin/verification" ? (
        <Verification properties={verification} onReview={async (id, status) => { const token = getStoredSessionToken(); if (!token) throw new Error("A valid admin session is required."); await reviewProperty(id, status, token); setVerification((current) => current.filter((item) => item.id !== id)); setProperties((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }} />
      ) : path === "/admin/users" ? (
        <UsersPage users={users} />
      ) : path.startsWith("/admin/users/") ? (
        userId && users.find((user) => user.id === userId) ? <UserDetail user={users.find((user) => user.id === userId)!} onUserChange={(updated) => setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))} onDelete={async (id) => { const token = getStoredSessionToken(); if (!token) throw new Error("A valid admin session is required."); await deleteAdminUser(id, token); setUsers((current) => current.filter((user) => user.id !== id)); }} /> : <Empty icon={Users} title="User not found" copy="This user record is no longer available." action="Back to users" href="/admin/users" />
      ) : path === "/admin/disputes" ? (
        <AdminDisputes disputes={disputes} />
      ) : path === "/admin/bookings" ? (
        <AdminBookings bookings={bookings} />
      ) : path === "/admin/payments" ? (
        <AdminPayments />
      ) : path === "/admin/reports" ? (
        <AdminReports reports={reports} />
      ) : path === "/admin/settings" ? (
        <>
          <AdminSettings />
          <SettingsLogoutAction />
        </>
      ) : (
        <Generic title={titles[path]?.[0] ?? "Admin"} icon={Settings} />
      )}
    </Shell>
  );
}
