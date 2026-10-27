import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LogoutButton } from "@/components/LogoutButton";
import { getReceivedApplications, getStoredSessionToken } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";

type ApplicationStatus =
  "submitted" | "under_review" | "approved" | "rejected" | "more_information";

type ApplicationRecord = {
  id: string;
  hostelName: string;
  hostelLocation: string;
  roomName: string;
  roomPrice: string;
  moveInDate: string;
  submittedAt: string;
  status: ApplicationStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university: string;
  profilePhotoUrl?: string;
  documents: string[];
  reviewNote?: string;
  reviewedAt?: string;
};

const nav = [
  ["/owner/dashboard", "/owner/overview.png", "Overview"],
  ["/owner/properties", "/owner/properties.png", "Properties"],
  ["/owner/rooms", "/owner/bedsandrooms.png", "Rooms & beds"],
  ["/owner/applications", "/owner/application.png", "Applications"],
  ["/owner/bookings", "/owner/bookings.png", "Bookings"],
  ["/owner/payments", "/owner/payments.png", "Payments"],
  ["/owner/messages", "/owner/message.png", "Messages"],
  ["/owner/reviews", "/owner/reviews.png", "Reviews"],
  ["/owner/analytics", "/owner/reviews.png", "Analytics"],
  ["/owner/settings", "/icons/user.png", "Settings"],
] as const;

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  more_information: "More information",
};

const storageKey = "arc.student.application";

function readApplication(): ApplicationRecord | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as ApplicationRecord) : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  if (!value) return "Not selected";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

function statusClass(status: ApplicationStatus) {
  if (status === "approved") return "bg-[#dff3e6] text-[#16733b]";
  if (status === "rejected") return "bg-[#ffe3e3] text-[#a52a2a]";
  if (status === "more_information") return "bg-[#eee8ff] text-[#6345a3]";
  return "bg-[#fff4d6] text-[#8a5d00]";
}

function OwnerShell({ children }: { children: React.ReactNode }) {
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
          
          <LogoutButton className="mr-12 text-xs font-bold text-white/60 lg:mr-0">
            <LogOut className="mr-2 inline h-4 w-4" /> Logout
          </LogoutButton>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] gap-28 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <h2 className="mt-2 font-display text-xl font-extrabold">
            Dashboard
          </h2>
          <nav className="mt-8 space-y-1">
            {nav.map(([href, icon, label]) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path === href ? "bg-black text-white" : "text-black/55 hover:bg-white"}`}
              >
                <img src={icon} alt="" aria-hidden="true" className={`h-4 w-4 object-contain ${path === href ? "invert" : ""}`} />
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

function PageHeader({ detail = false }: { detail?: boolean }) {
  return (
    <div>
      <Link
        to="/owner/dashboard"
        className="mb-6 inline-flex items-center text-xs font-bold text-black/45 hover:text-black"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Owner overview
      </Link>
     
      <h1 className="mt-2 font-poppins text-4xl font-[550] tracking-[-.06em] sm:text-5xl">
        {detail ? "Review application" : "Applications"}
      </h1>
      <p className="mt-3 text-sm text-black/50">
        {detail
          ? "Review the student’s details before deciding what happens next."
          : "Review students looking for a place to live."}
      </p>
    </div>
  );
}

function EmptyApplications() {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center sm:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
        <ClipboardList />
      </div>
      <h2 className="mt-5 font-display text-2xl font-extrabold">
        No applications yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
        When students apply to one of your published properties, their
        applications will appear here for review.
      </p>
      <Link
        to="/owner/properties"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
      >
        Manage properties <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
      <p className="mt-6 text-[11px] text-black/35">
        This frontend preview only displays applications submitted on this
        device.
      </p>
    </section>
  );
}

function ApplicationsList({
  application,
}: {
  application: ApplicationRecord | null;
}) {
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [query, setQuery] = useState("");
  if (!application) return <EmptyApplications />;
  const matchesFilter = filter === "all" || application.status === filter;
  const matchesQuery =
    `${application.firstName} ${application.lastName} ${application.university}`
      .toLowerCase()
      .includes(query.toLowerCase());
  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-xl bg-[#f7f6f3] px-3">
          <Search className="h-4 w-4 text-black/35" />
          <span className="sr-only">Search applications</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent py-3 text-sm outline-none"
            placeholder="Search students or universities"
          />
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
          className="rounded-xl border border-black/10 bg-white px-3 py-3 text-xs font-bold outline-none"
        >
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {matchesFilter && matchesQuery ? (
        <Link
          to={`/owner/applications/${application.id}`}
          className="mt-4 block rounded-2xl border border-black/10 bg-white p-5 transition hover:border-black/30 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5b544] text-xs font-bold">
                {application.profilePhotoUrl ? (
                  <img
                    src={application.profilePhotoUrl}
                    alt={`${application.firstName} ${application.lastName}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <>{application.firstName[0]}{application.lastName[0]}</>
                )}
              </span>
              <div>
                <p className="font-display text-lg font-extrabold">
                  {application.firstName} {application.lastName}
                </p>
                <p className="mt-1 text-xs text-black/50">
                  {application.university} · {application.email}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-3 py-2 text-[11px] font-bold ${statusClass(application.status)}`}
            >
              {statusLabels[application.status]}
            </span>
          </div>
          <div className="mt-6 grid gap-4 border-t border-black/10 pt-5 text-xs sm:grid-cols-4">
            <div>
              <p className="text-black/45">Property</p>
              <p className="mt-1 font-bold">{application.hostelName}</p>
            </div>
            <div>
              <p className="text-black/45">Room</p>
              <p className="mt-1 font-bold">{application.roomName}</p>
            </div>
            <div>
              <p className="text-black/45">Move-in</p>
              <p className="mt-1 font-bold">
                {formatDate(application.moveInDate)}
              </p>
            </div>
            <div className="flex items-end justify-between sm:justify-end">
              <p className="font-bold text-[#a36500]">
                Review <ChevronRight className="ml-1 inline h-3 w-3" />
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-black/25" />
          <h2 className="mt-4 font-display text-xl font-extrabold">
            No matching applications
          </h2>
          <p className="mt-2 text-sm text-black/50">
            Try another search or status filter.
          </p>
        </div>
      )}
    </section>
  );
}

function Detail({
  application,
  onUpdate,
}: {
  application: ApplicationRecord;
  onUpdate: (next: ApplicationRecord) => void;
}) {
  const [note, setNote] = useState(application.reviewNote ?? "");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState<ApplicationStatus | null>(null);
  const update = (status: ApplicationStatus) => {
    const next = {
      ...application,
      status,
      reviewNote: note,
      reviewedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    onUpdate(next);
    setConfirming(null);
    setNotice(`Application marked ${statusLabels[status].toLowerCase()}.`);
  };
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-start">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5b544] text-sm font-bold">
              {application.profilePhotoUrl ? (
                <img
                  src={application.profilePhotoUrl}
                  alt={`${application.firstName} ${application.lastName}`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <>{application.firstName[0]}{application.lastName[0]}</>
              )}
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold">
                {application.firstName} {application.lastName}
              </h2>
              <p className="mt-1 text-sm text-black/50">
                {application.university} · Applied{" "}
                {formatDate(application.submittedAt)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-2 text-[11px] font-bold ${statusClass(application.status)}`}
          >
            {statusLabels[application.status]}
          </span>
        </div>
        {notice && (
          <div
            className="mt-5 flex items-center gap-2 rounded-xl bg-[#dff3e6] px-4 py-3 text-xs font-bold text-[#16733b]"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </div>
        )}
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-black/45">Contact details</p>
            <p className="mt-2 text-sm font-bold">{application.email}</p>
            <p className="mt-1 text-sm text-black/60">{application.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-black/45">Preferred move-in</p>
            <p className="mt-2 text-sm font-bold">
              {formatDate(application.moveInDate)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-black/45">Property</p>
            <p className="mt-2 text-sm font-bold">{application.hostelName}</p>
            <p className="mt-1 text-sm text-black/60">
              {application.hostelLocation}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-black/45">Room requested</p>
            <p className="mt-2 text-sm font-bold">{application.roomName}</p>
            <p className="mt-1 text-sm text-black/60">
              {application.roomPrice} per session
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-black/10 pt-6">
          <label className="block text-xs font-bold">
            Review note{" "}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 h-28 w-full resize-none rounded-xl border border-black/15 p-3 text-sm outline-none focus:border-black"
              placeholder="Add an internal note or context for this decision..."
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setConfirming("under_review")}
            className="rounded-full border border-black/15 px-4 py-3 text-xs font-bold"
          >
            Mark under review
          </button>
          <button
            onClick={() => setConfirming("more_information")}
            className="rounded-full border border-[#6345a3]/25 px-4 py-3 text-xs font-bold text-[#6345a3]"
          >
            Request information
          </button>
          <button
            onClick={() => setConfirming("rejected")}
            className="rounded-full border border-[#a52a2a]/20 px-4 py-3 text-xs font-bold text-[#a52a2a]"
          >
            Reject
          </button>
          <button
            onClick={() => setConfirming("approved")}
            className="rounded-full bg-black px-4 py-3 text-xs font-bold text-white"
          >
            Approve application <Check className="ml-2 inline h-4 w-4" />
          </button>
        </div>
      </section>
      <aside className="h-fit rounded-2xl bg-black p-6 text-white lg:sticky lg:top-8">
        <p className="eyebrow text-white/45">Submitted documents</p>
        <div className="mt-5 space-y-3">
          {application.documents.map((document) => (
            <div
              key={document}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
            >
              <FileText className="h-4 w-4 text-[#f5b544]" />
              {document.startsWith("http") ? (
                <a
                  href={document}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-semibold underline decoration-white/30 underline-offset-2 hover:decoration-white"
                >
                  {document.split("/").pop() ?? "View document"}
                </a>
              ) : (
                <span className="truncate">{document}</span>
              )}
              <Check className="ml-auto h-4 w-4 text-[#74d69a]" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-white/5 p-4 text-xs leading-5 text-white/55">
          <ShieldCheck className="mr-2 inline h-4 w-4 text-[#74d69a]" />
          Review the documents before making a decision.
        </div>
      </aside>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-7">
            <button
              onClick={() => setConfirming(null)}
              className="float-right rounded-full p-1 text-black/45"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="eyebrow">Confirm decision</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {statusLabels[confirming]}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              This will update the application status for{" "}
              {application.firstName} {application.lastName}.
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
    </div>
  );
}

export default function OwnerApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationRecord | null>(
    null,
  );
  useEffect(() => {
    const token = getStoredSessionToken();
    if (!token) {
      setApplication(readApplication());
      return;
    }
    getReceivedApplications(token)
      .then((applications) => {
        const received = applications[0];
        if (!received) {
          setApplication(readApplication());
          return;
        }
        setApplication({
          id: received.id,
          hostelName: `Property ${received.propertyId}`,
          hostelLocation: "",
          roomName: received.roomName,
          roomPrice: "Price pending",
          moveInDate: received.moveInDate,
          submittedAt: received.createdAt,
          status: received.status as ApplicationStatus,
          firstName: received.details.firstName || "Student",
          lastName: received.details.lastName || "Applicant",
          email: received.details.email || "Email not provided",
          phone: received.details.phone || "Phone not provided",
          university: received.details.university || "University not provided",
          profilePhotoUrl: received.details.profilePhotoUrl,
          documents: received.documents,
          reviewNote: received.reviewNote,
        });
      })
      .catch(() => setApplication(readApplication()));
  }, []);
  return (
    <OwnerShell>
      <PageHeader detail={Boolean(id)} />
      {id ? (
        application && application.id === id ? (
          <Detail application={application} onUpdate={setApplication} />
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-black/20 bg-white p-12 text-center">
            <ClipboardList className="mx-auto h-9 w-9 text-black/25" />
            <h2 className="mt-4 font-display text-2xl font-extrabold">
              Application not found
            </h2>
            <p className="mt-2 text-sm text-black/50">
              This application is not available in the current owner workspace.
            </p>
            <button
              onClick={() => navigate("/owner/applications")}
              className="mt-6 rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
            >
              Back to applications
            </button>
          </section>
        )
      ) : (
        <ApplicationsList application={application} />
      )}
    </OwnerShell>
  );
}
