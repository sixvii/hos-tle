import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Home,
  Wallet,
} from "lucide-react";
import {
  getMyApplications,
  getProfileInitial,
  getStoredProfilePhoto,
  getStoredSession,
  type StudentApplication,
} from "@/lib/api";
import {
  StudentDashboardMenu,
  type MenuItem,
} from "@/components/StudentDashboardMenu";

type Application = {
  id: string;
  hostelName: string;
  roomName: string;
  status?: string;
  moveInDate?: string;
};
function toApplication(application: StudentApplication): Application {
  return {
    id: application.id,
    hostelName: application.propertyId,
    roomName: application.roomName,
    status: application.status,
    moveInDate: application.moveInDate,
  };
}
const nav: MenuItem[] = [
  { href: "/dashboard", label: "Overview", icon: "/icons/overview.png" },
  { href: "/find-a-hostel", label: "Discover", icon: "/icons/discover.png" },
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
  { href: "/student/profile", label: "Settings", icon: "/icons/user.png" },
];
export default function Dashboard() {
  const [application, setApplication] = useState<Application | null>(null);
  const session = getStoredSession();
  const photoUrl = session ? getStoredProfilePhoto(session.user.id) : "";
  const initial = session ? getProfileInitial(session.user.name) : "U";

  useEffect(() => {
    if (!session) return;
    getMyApplications(session.token)
      .then((applications) => setApplication(applications[0] ? toApplication(applications[0]) : null))
      .catch(() => setApplication(null));
  }, [session?.token]);

  return (
    <div className="dashboard-page student-dashboard min-h-screen text-[#171717]">
      <header className="bg-white text-black">
        <div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em] text-black"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9.5 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 pr-12 lg:pr-0">
            <Bell className="h-5 w-5 text-black" />
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${session?.user.name} profile`}
                className="h-9.5 w-9.5 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                {initial}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-28 px-5 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <StudentDashboardMenu path="/dashboard" items={nav} />

        <main className="w-full max-w-[1000px] lg:pt-1">
          <div className="mt-2">
            <h1 className="font-poppins text-4xl font-[550] tracking-[-.06em] sm:text-5xl">
              Overview
            </h1>
            <p className="mt-3 text-sm text-black/50">
              Your accommodation journey, all in one place.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#1c1c1c] bg-[#1c1c1c] p-5 text-white">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p className="mt-6 font-display text-3xl font-extrabold text-white">
                {application ? "1" : "—"}
              </p>
              <p className="mt-1 text-xs text-white">Applications</p>
            </div>
            <div className="rounded-2xl border border-[#1c1c1c] bg-[#1c1c1c] p-5 text-white">
              <CalendarDays className="h-5 w-5 text-white" />
              <p className="mt-6 font-display text-3xl font-extrabold text-white">
                {application ? "1" : "—"}
              </p>
              <p className="mt-1 text-xs text-white">Bookings</p>
            </div>
            <div className="rounded-2xl border border-[#1c1c1c] bg-[#1c1c1c] p-5 text-white">
              <Wallet className="h-5 w-5 text-white" />
              <p className="mt-6 font-display text-3xl font-extrabold text-white">
                {application ? "1" : "—"}
              </p>
              <p className="mt-1 text-xs text-white">Payments</p>
            </div>
          </div>

          {application ? (
            <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a36500]">
                    Active application
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold">
                    {application.hostelName}
                  </h2>
                  <p className="mt-2 text-sm text-black/50">
                    {application.roomName} · Status: {application.status || "Submitted"}
                  </p>
                </div>
                <Link
                  to={`/student/applications/${application.id}`}
                  className="inline-flex w-fit rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
                >
                  View application <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-8 rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center sm:p-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
                <Home className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-extrabold">
                Your accommodation journey starts here
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
                Search verified accommodation and submit an application to see
                your progress on this dashboard.
              </p>
              <Link
                to="/find-a-hostel"
                className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
              >
                Find a hostel <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
