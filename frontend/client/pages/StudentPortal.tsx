import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  StudentDashboardMenu,
  type MenuItem,
} from "@/components/StudentDashboardMenu";
import {
  getMyApplications,
  getMyBookings,
  createReview,
  getProfileInitial,
  getStoredProfilePhoto,
  getStoredSession,
} from "@/lib/api";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Heart,
  Home,
  Mail,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";

type Application = {
  id: string;
  hostelName: string;
  roomName: string;
  status?: string;
  moveInDate?: string;
};
type Booking = {
  id: string;
  propertyName: string;
  propertyLocation: string;
  roomName: string;
  price: string;
  status: string;
};
const nav: MenuItem[] = [
  { href: "/student", label: "Overview", icon: "/icons/overview.png" },
  { href: "/student/search", label: "Discover", icon: "/icons/discover.png" },
  {
    href: "/student/saved",
    label: "Saved hostels",
    icon: "/icons/application.png",
  },
  {
    href: "/student/applications",
    label: "Applications",
    icon: "/icons/application.png",
  },
  {
    href: "/student/bookings",
    label: "My bookings",
    icon: "/icons/bookings.png",
  },
  { href: "/student/payments", label: "Payments", icon: "/icons/payments.png" },
  { href: "/student/messages", label: "Messages", icon: "/icons/message.png" },
  { href: "/student/profile", label: "Profile", icon: "/icons/user.png" },
];
const titleMap: Record<string, [string, string]> = {
  "/student/search": [
    "Discover",
    "Find verified accommodation around your university.",
  ],
  "/student/saved": [
    "Saved hostels",
    "Keep your shortlist close while you decide.",
  ],
  "/student/applications": [
    "Applications",
    "Track every request from submitted to approved.",
  ],
  "/student/bookings": [
    "My bookings",
    "Your current and upcoming accommodation.",
  ],
  "/student/payments": [
    "Payments",
    "Review accommodation charges and payment history.",
  ],
  "/student/messages": ["Messages", "Stay connected with hostel management."],
  "/student/profile": [
    "Profile & preferences",
    "Keep your details and search preferences up to date.",
  ],
};
function read<T>(key: string): T | null {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}
function Shell({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div className="dashboard-page student-dashboard min-h-screen text-[#171717]">
      <header className="bg-[#FAFBFA] text-black">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-3 pr-12 lg:pr-0">
            <Bell className="h-5 w-5 text-black" aria-label="Notifications" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-28 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <h2 className="mt-2 font-display text-xl font-extrabold">Dashboard</h2>
          <nav className="mt-8 space-y-1">
            {nav.map(({ href, label, icon }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-black text-white" : "text-black/55 hover:bg-[#FAFBFA]"}`}
                >
                  <img src={icon} alt="" aria-hidden="true" className={`h-4 w-4 object-contain ${active ? "invert" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full max-w-[1000px]">{children}</main>
      </div>
    </div>
  );
}
function Heading({ path }: { path: string }) {
  const [title, subtitle] = titleMap[path] ?? [
    "Overview",
    "Your accommodation journey, all in one place.",
  ];
  return (
    <div>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <h1 className="font-poppins text-[25px] font-[550] tracking-[-.06em] sm:text-[30px]">
          Dashboard
        </h1>
        <h2 className="font-display text-[25px] font-extrabold tracking-[-.06em] sm:text-[30px]">
          {title}
        </h2>
      </div>
      <p className="mt-3 text-sm text-black/50">{subtitle}</p>
    </div>
  );
}
function Empty({
  icon: Icon,
  title,
  copy,
  action = "Find a hostel",
  href = "/find-a-hostel",
}: {
  icon: typeof Home;
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
      <h2 className="mt-10 text-xl font-[600]">{title}</h2>
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
function Overview({
  application,
  booking,
}: {
  application: Application | null;
  booking: Booking | null;
}) {
  return (
    <>
      {application ? (
        <section className="mt-8 rounded-2xl bg-black p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#f5b544]">
            Active application
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold">
            {application.hostelName}
          </h2>
          <p className="mt-2 text-sm text-white/55">
            {application.roomName} · {application.status || "Submitted"}
          </p>
          <Link
            to={`/student/applications/${application.id}`}
            className="mt-6 inline-flex rounded-full bg-[#f5b544] px-5 py-3 text-xs font-bold text-black"
          >
            View application <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>
      ) : (
        <Empty
          icon={Heart}
          title="Your accommodation journey starts here"
          copy="Search verified accommodation and submit an application to start tracking your progress."
        />
      )}
      {booking ? (
        <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6">
          <p className="eyebrow">Current booking</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">
            {booking.propertyName}
          </h2>
          <p className="mt-1 text-sm text-black/50">
            {booking.propertyLocation} · {booking.roomName}
          </p>
          <Link
            to={`/student/bookings/${booking.id}`}
            className="mt-5 inline-flex rounded-full border border-black/15 px-4 py-3 text-xs font-bold"
          >
            View booking <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>
      ) : null}
    </>
  );
}
function Bookings({ booking }: { booking: Booking | null }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const submitReview = async () => {
    const session = getStoredSession();
    if (!session || !booking || !body.trim()) return;
    setSaving(true);
    try {
      await createReview({ bookingId: booking.id, rating, body: body.trim() }, session.token);
      setNotice("Thanks. Your review was submitted.");
      setBody("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The review could not be submitted.");
    } finally {
      setSaving(false);
    }
  };
  return booking ? (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl bg-black p-6 text-white">
      <p className="eyebrow text-[#f5b544]">Confirmed booking</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold">
        {booking.propertyName}
      </h2>
      <p className="mt-2 text-sm text-white/55">
        {booking.propertyLocation} · {booking.roomName}
      </p>
      <Link
        to={`/student/bookings/${booking.id}`}
        className="mt-6 inline-flex rounded-full bg-[#f5b544] px-5 py-3 text-xs font-bold text-black"
      >
        View booking <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
      </div>
      {booking.status === "confirmed" && <div className="rounded-2xl border border-black/10 bg-white p-6"><p className="eyebrow">Share your experience</p><h2 className="mt-2 font-display text-2xl font-extrabold">Review this stay</h2><div className="mt-5 flex gap-1" aria-label="Choose a rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`text-2xl ${value <= rating ? "text-[#f5b544]" : "text-black/20"}`} aria-label={`${value} stars`}>★</button>)}</div><textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-4 h-28 w-full resize-none rounded-xl bg-[#f7f6f3] p-4 text-sm outline-none" placeholder="Tell future students about this property..." /><button type="button" disabled={saving || body.trim().length < 10} onClick={() => void submitReview()} className="mt-3 rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-40">{saving ? "Submitting..." : "Submit review"}</button>{notice && <p className="mt-3 text-xs font-semibold text-black/60">{notice}</p>}</div>}
    </section>
  ) : (
    <Empty
      icon={CalendarDays}
      title="No bookings yet"
      copy="Completed booking requests will appear here once a verified room is available."
    />
  );
}
function Profile() {
  const session = getStoredSession();
  const nameParts = session?.user.name.trim().split(/\s+/) ?? [];
  const firstName = session?.user.firstName ?? nameParts[0] ?? "";
  const lastName = session?.user.lastName ?? nameParts.slice(1).join(" ");
  const photoUrl = session ? getStoredProfilePhoto(session.user.id) : "";
  const initial = session ? getProfileInitial(session.user.name) : "U";
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mt-8 rounded-2xl border border-black/10 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-4 border-b border-black/10 pb-6">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#f5b544] text-lg font-bold">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${session?.user.name} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold">
            Personal details
          </h2>
          <p className="mt-1 text-[14px] text-black/45">
            Your profile will be ready to complete when account data is
            connected.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-[14px] font-bold">
          First name
          <input
            readOnly
            value={firstName}
            className="auth-input text-[14px]"
            placeholder="First name"
          />
        </label>
        <label className="text-[15px] font-bold">
          Last name
          <input
            readOnly
            value={lastName}
            className="auth-input text-[14px]"
            placeholder="Last name"
          />
        </label>
        <label className="text-[15px] font-bold sm:col-span-2">
          Email address
          <input
            type="email"
            className="auth-input text-[14px]"
            value={session?.user.email ?? ""}
            readOnly
            placeholder="you@example.com"
          />
        </label>
        <label className="text-[15px] font-bold">
          University
          <input
            readOnly
            value={session?.user.schoolName ?? ""}
            className="auth-input text-[14px]"
            placeholder="Your university"
          />
        </label>
        <label className="text-[15px] font-bold">
          Phone number
          <input
            readOnly
            value={session?.user.phoneNumber ?? ""}
            className="auth-input text-[14px]"
            placeholder="0800 000 0000"
          />
        </label>
        <label className="text-[15px] font-bold">
          Gender
          <input
            readOnly
            value={session?.user.gender?.replace(/_/g, " ") ?? ""}
            className="auth-input capitalize text-[14px]"
            placeholder="Not provided"
          />
        </label>
      </div>
      <button className="mt-6 rounded bg-black px-5 py-3 text-[15px] font-[500] text-white">
        Save profile
      </button>
    </form>
  );
}
function Generic({ path }: { path: string }) {
  const item =
    path === "/student/search"
      ? {
          icon: Search,
          title: "Search is ready",
          copy: "Use the marketplace search to find verified accommodation around your university.",
        }
      : path === "/student/saved"
        ? {
            icon: Heart,
            title: "No saved hostels yet",
            copy: "Save a property from search to keep it here.",
          }
        : path === "/student/payments"
          ? {
              icon: CreditCard,
              title: "No payments yet",
              copy: "Payment records and receipts will appear here after a real checkout.",
            }
          : {
              icon: Mail,
              title: "No messages yet",
              copy: "Conversations with hostel teams will appear here when you contact a property.",
            };
  return (
    <Empty
      icon={item.icon}
      title={item.title}
      copy={item.copy}
      action={
        path === "/student/search" || path === "/student/saved"
          ? "Find a hostel"
          : "Return to overview"
      }
      href={
        path === "/student/search" || path === "/student/saved"
          ? "/find-a-hostel"
          : "/student"
      }
    />
  );
}
export default function StudentPortal() {
  const path = useLocation().pathname;
  const [application, setApplication] = useState<Application | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  useEffect(() => {
    const session = getStoredSession();
    if (!session) return;
    getMyApplications(session.token)
      .then((applications) => {
        const item = applications[0];
        setApplication(item ? {
          id: item.id,
          hostelName: item.propertyId,
          roomName: item.roomName,
          status: item.status,
          moveInDate: item.moveInDate,
        } : null);
      })
      .catch(() => setApplication(null));
    getMyBookings(session.token)
      .then((bookings) => {
        const item = bookings[0];
        setBooking(item ? {
          id: item.id,
          propertyName: item.propertyId,
          propertyLocation: "",
          roomName: item.roomName,
          price: String(item.amount),
          status: item.status,
        } : null);
      })
      .catch(() => setBooking(null));
  }, []);
  return (
    <Shell path={path}>
      <Heading path={path} />
      {path === "/student" ? (
        <Overview application={application} booking={booking} />
      ) : path === "/student/bookings" ? (
        <Bookings booking={booking} />
      ) : path === "/student/profile" ? (
        <Profile />
      ) : (
        <Generic path={path} />
      )}
    </Shell>
  );
}
