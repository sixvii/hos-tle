import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SettingsLogoutAction } from "@/components/LogoutButton";
import {
  createMaintenance,
  getMyApplications,
  getMyMessages,
  getMessageContacts,
  getProfileInitial,
  getStoredProfilePhoto,
  getStoredSession,
  getStoredSessionToken,
  storeProfilePhoto,
  sendMessage,
  storeSession,
  updateProfilePhoto,
  uploadImageToCloudinary,
  type StudentApplication,
  type DirectMessage,
  type MessageContact,
} from "@/lib/api";
import { createMessageSocket } from "@/lib/realtime";
import {
  StudentDashboardMenu,
  type MenuItem,
} from "@/components/StudentDashboardMenu";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  Mail,
  MessageCircle,
  UserRound,
  Wrench,
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
};

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  more_information: "More information",
};

function statusClass(status: ApplicationStatus) {
  if (status === "approved") return "bg-[#dff3e6] text-[#16733b]";
  if (status === "rejected") return "bg-[#ffe3e3] text-[#a52a2a]";
  if (status === "more_information") return "bg-[#eee8ff] text-[#6345a3]";
  return "bg-[#fff4d6] text-[#8a5d00]";
}

const nav: MenuItem[] = [
  { href: "/student", label: "Overview", icon: "/icons/overview.png" },
  {
    href: "/student/applications",
    label: "Applications",
    icon: "/icons/application.png",
  },
  { href: "/student/bookings", label: "Bookings", icon: "/icons/bookings.png" },
  { href: "/student/payments", label: "Payments", icon: "/icons/payments.png" },
  { href: "/student/messages", label: "Messages", icon: "/icons/message.png" },
  {
    href: "/student/notifications",
    label: "Notifications",
    icon: "/icons/notification.png",
  },
  { href: "/student/profile", label: "Profile", icon: "/icons/user.png" },
  {
    href: "/student/maintenance",
    label: "Maintenance",
    icon: "/icons/maintenance.png",
  },
];

const content: Record<string, [string, string]> = {
  "/student/applications": [
    "Applications",
    "Applications you submit will appear here.",
  ],
  "/student/payments": [
    "Payments",
    "Your completed and pending transactions will appear here.",
  ],
  "/student/messages": [
    "Messages",
    "Conversations with hostel teams will appear here.",
  ],
  "/student/notifications": [
    "Notifications",
    "Updates about applications, bookings, and your account will appear here.",
  ],
  "/student/profile": [
    "Profile & preferences",
    "Keep your contact details and accommodation preferences current.",
  ],
  "/student/maintenance": [
    "Maintenance",
    "Report and track issues with your accommodation.",
  ],
};

function toApplicationRecord(application: StudentApplication): ApplicationRecord {
  return {
    id: application.id,
    hostelName: application.propertyId,
    hostelLocation: "",
    roomName: application.roomName,
    roomPrice: "",
    moveInDate: application.moveInDate,
    submittedAt: application.createdAt,
    status: application.status as ApplicationStatus,
  };
}

function formatDate(value: string) {
  if (!value) return "Not selected";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function Shell({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
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

          <div />
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
                  <img
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    className={`h-4 w-4 object-contain ${active ? "invert" : ""}`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full max-w-[1000px]">
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="font-poppins text-[25px] font-[550] tracking-[-.06em] sm:text-[30px]">
              Dashboard
            </h1>
            <h2 className="font-display text-[25px] font-extrabold tracking-[-.06em] sm:text-[30px]">
              {content[path]?.[0] ?? "Student space"}
            </h2>
          </div>
          <p className="mt-3 text-sm text-black/50">{content[path]?.[1]}</p>
          {children}
        </main>
      </div>
    </div>
  );
}

function Applications({
  application,
}: {
  application: ApplicationRecord | null;
}) {
  if (!application)
    return <Empty title="Applications" path="/student/applications" />;
  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold text-black/45">Active application</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">
            {application.hostelName}
          </h2>
          <p className="mt-1 text-sm text-black/50">
            {application.hostelLocation} · {application.roomName}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold ${statusClass(application.status)}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />{" "}
          {statusLabels[application.status]}
        </span>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold text-black/45">Move-in date</p>
          <p className="mt-1 text-sm font-bold">
            {formatDate(application.moveInDate)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-black/45">Application ID</p>
          <p className="mt-1 text-sm font-bold">{application.id}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-black/45">Submitted</p>
          <p className="mt-1 text-sm font-bold">
            {formatDate(application.submittedAt.slice(0, 10))}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl bg-[#f7f6f3] p-4 sm:flex-row sm:items-center">
        <p className="max-w-xl text-xs leading-5 text-black/55">
          The hostel team will review your details and contact you when there is
          an update.
        </p>
        <Link
          to={`/student/applications/${application.id}`}
          className="inline-flex w-fit items-center rounded-full bg-black px-4 py-3 text-xs font-bold text-white"
        >
          View application <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Empty({ title, path }: { title: string; path: string }) {
  const copy =
    path === "/student/applications"
      ? "Search verified hostels and submit an application to see it tracked here."
      : path === "/student/payments"
        ? "There are no payment records yet. Your receipts will be stored here after checkout."
        : path === "/student/messages"
          ? "When you contact a hostel, your conversation will show up here."
          : "You’re all caught up. New updates will appear here when something needs your attention.";
  return (
    <section className="mt-8 md:mt-40 rounded-2xl border  border-black/20 bg-white p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
        {path === "/student/payments" ? (
          <CreditCard />
        ) : path === "/student/messages" ? (
          <Mail />
        ) : (
          <FileText />
        )}
      </div>
      <h2 className="mt-5 font-display text-2xl font-extrabold">
        No {title.toLowerCase()} yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
        {copy}
      </p>
      {(path === "/student/applications" || path === "/student/messages") && (
        <Link
          to="/find-a-hostel"
          className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
        >
          Find a hostel <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </section>
  );
}

function MessageCenter() {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const session = JSON.parse(
        window.localStorage.getItem("arc.session") ?? "null",
      ) as { token?: string } | null;
      if (!session?.token) return;
      const socket = createMessageSocket(session.token);
      getMyMessages(session.token)
        .then(setMessages)
        .catch(() => undefined);
      getMessageContacts(session.token)
        .then((items) => {
          setContacts(items);
          setSelectedContactId((current) => current || items[0]?.id || "");
        })
        .catch(() => undefined);
      socket.on("message:new", (message) =>
        setMessages((current) => [...current, message]),
      );
      return () => {
        socket.close();
      };
    } catch {
      return undefined;
    }
  }, []);
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const conversation = messages.filter((message) =>
    selectedContactId &&
    ((message.senderId === selectedContactId && message.recipientId !== selectedContactId) ||
      (message.recipientId === selectedContactId && message.senderId !== selectedContactId)),
  );
  const send = async () => {
    const token = getStoredSessionToken();
    if (!token || !selectedContactId || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const message = await sendMessage({ recipientId: selectedContactId, body: draft.trim() }, token);
      setMessages((current) => [...current, message]);
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };
  if (!contacts.length)
    return <Empty title="Messages" path="/student/messages" />;
  return (
    <section className="mt-8 grid overflow-hidden rounded-2xl border border-black/10 bg-white md:grid-cols-[220px_1fr]">
      <aside className="border-b border-black/10 p-3 md:border-b-0 md:border-r">
        <p className="px-3 py-2 text-xs font-bold text-black/45">Your contacts</p>
        {contacts.map((contact) => <button key={contact.id} type="button" onClick={() => setSelectedContactId(contact.id)} className={`w-full rounded-xl px-3 py-3 text-left ${contact.id === selectedContactId ? "bg-black text-white" : "hover:bg-[#f7f6f3]"}`}><p className="text-sm font-bold">{contact.name}</p><p className={`mt-1 truncate text-[11px] ${contact.id === selectedContactId ? "text-white/60" : "text-black/45"}`}>{contact.email}</p></button>)}
      </aside>
      <div className="flex min-h-[420px] flex-col">
        <div className="border-b border-black/10 p-5"><p className="text-xs text-black/45">Conversation</p><h2 className="mt-1 font-display text-xl font-extrabold">{selectedContact?.name}</h2></div>
        <div className="flex-1 space-y-3 p-5">
          {!conversation.length && <p className="py-12 text-center text-sm text-black/45">Start the conversation with this property team.</p>}
          {conversation.map((message) => <div key={message.id} className={`flex ${message.senderId === selectedContactId ? "justify-start" : "justify-end"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.senderId === selectedContactId ? "bg-[#f7f6f3]" : "bg-black text-white"}`}><p>{message.body}</p><p className="mt-2 text-[10px] opacity-50">{new Date(message.createdAt).toLocaleString()}</p></div></div>)}
        </div>
        <div className="border-t border-black/10 p-4">
          {error && <p className="mb-2 text-xs font-semibold text-[#a52a2a]">{error}</p>}
          <div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl bg-[#f7f6f3] px-4 py-3 text-sm outline-none" /><button type="button" disabled={sending || !draft.trim()} onClick={() => void send()} className="rounded-xl bg-black px-4 py-3 text-xs font-bold text-white disabled:opacity-40">{sending ? "Sending..." : "Send"}</button></div>
        </div>
      </div>
    </section>
  );
}

function Profile() {
  const session = getStoredSession();
  const nameParts = session?.user.name.trim().split(/\s+/) ?? [];
  const firstName = session?.user.firstName ?? nameParts[0] ?? "";
  const lastName = session?.user.lastName ?? nameParts.slice(1).join(" ");
  const [photoUrl, setPhotoUrl] = useState(() =>
    session ? getStoredProfilePhoto(session.user.id) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadProfilePicture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const token = getStoredSessionToken();
    if (!token)
      return setUploadError("Log in before uploading a profile picture.");
    setUploadError("");
    setUploading(true);
    try {
      const nextPhotoUrl = await uploadImageToCloudinary(
        file,
        token,
        "profile",
      );
      setPhotoUrl(nextPhotoUrl);
      if (session) {
        storeProfilePhoto(session.user.id, nextPhotoUrl);
        const updatedUser = await updateProfilePhoto(nextPhotoUrl, token);
        storeSession({ ...session, user: updatedUser });
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "The profile picture could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mt-8 max-w-5xl rounded-2xl border border-black/10 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-4 border-b border-black/10 pb-6">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5b544] text-lg font-bold">
              {session ? getProfileInitial(session.user.name) : "U"}
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-black px-2 py-1 text-[9px] font-bold text-white">
            {uploading ? "..." : "Add"}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={uploadProfilePicture}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold">
            Personal details
          </h2>
          <p className="mt-1 text-[14px] text-black/45">
            Complete your profile before applying for accommodation.
          </p>
        </div>
      </div>
      {uploadError && (
        <p
          className="mt-4 rounded-xl bg-[#fff0f0] px-3 py-2 text-xs font-semibold text-[#a52a2a]"
          role="alert"
        >
          {uploadError}
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-[15px] font-bold">
          First name
          <input
            required
            readOnly
            value={firstName}
            className="auth-input text-[14px]"
            placeholder="First name"
          />
        </label>
        <label className="text-[15px] font-bold">
          Last name
          <input
            required
            readOnly
            value={lastName}
            className="auth-input text-[14px]"
            placeholder="Last name"
          />
        </label>
        <label className="text-[15px] font-bold sm:col-span-2">
          Email address
          <input
            required
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
            value={session?.user.schoolName ?? ""}
            readOnly
            className="auth-input text-[14px]"
            placeholder="Your university"
          />
        </label>
        <label className="text-[15px] font-bold">
          Phone number
          <input
            value={session?.user.phoneNumber ?? ""}
            readOnly
            className="auth-input text-[14px]"
            placeholder="0800 000 0000"
          />
        </label>
        <label className="text-[15px] font-bold">
          Gender
          <input
            value={session?.user.gender?.replace(/_/g, " ") ?? ""}
            readOnly
            className="auth-input capitalize text-[14px]"
            placeholder="Not provided"
          />
        </label>
      </div>
      <button className="mt-6 rounded bg-black px-5 py-3 text-[150x] font-[500] text-white">
        Save profile
      </button>
    </form>
  );
}

function Maintenance() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  if (sent)
    return (
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-12 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#1f9d55]" />
        <h2 className="mt-4 font-display text-2xl font-extrabold">
          Request submitted
        </h2>
        <p className="mt-2 text-sm text-black/50">
          Your accommodation team will respond when they’ve reviewed the issue.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 rounded-full border border-black/15 px-5 py-3 text-xs font-bold"
        >
          Report another issue
        </button>
      </section>
    );
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const session = getStoredSession();
        const form = new FormData(event.currentTarget);
        if (!session) return setError("Log in before reporting an issue.");
        try {
          await createMaintenance(
            {
              subject: String(form.get("subject") ?? ""),
              description: String(form.get("description") ?? ""),
            },
            session.token,
          );
          setSent(true);
        } catch (requestError) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The request could not be submitted.",
          );
        }
      }}
      className="mt-8 max-w-5xl rounded-2xl border border-black/10 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <Wrench className="h-5 w-5 text-[#a36500]" />
        <h2 className="font-display text-xl font-extrabold">Report an issue</h2>
      </div>
      <div className="mt-6 space-y-4">
        <label className="block text-[14px] font-bold">
          Issue type
          <select required name="subject" className="auth-input text-[14px] w-[190px]">
            <option value="">Select an issue</option>
            <option>Power</option>
            <option>Water</option>
            <option>Room repair</option>
            <option>Security</option>
            <option>Other</option>
          </select>
        </label>
        <label className="block text-[15px] font-bold">
          Description
          <textarea
            required
            className="mt-1 h-32 w-full rounded-xl border border-black/15 p-3 text-sm outline-none"
            name="description"
            placeholder="Tell us what needs attention..."
          />
        </label>
        <label className="block text-[15px] font-bold">
          Preferred access time
          <input
            type="text"
            className="auth-input text-[14px] w-[250px]"
            placeholder="e.g. Weekdays after 4pm"
          />
        </label>
      </div>
      {error && (
        <p className="mt-4 text-[14px] font-semibold text-[#a52a2a]" role="alert">
          {error}
        </p>
      )}
      <button className="mt-6 rounded bg-black px-5 py-3 text-[14px] font-[500] text-white">
        Submit request
      </button>
    </form>
  );
}

export default function StudentOperations() {
  const path = useLocation().pathname;
  const [application, setApplication] = useState<ApplicationRecord | null>(
    null,
  );
  useEffect(() => {
    const session = getStoredSession();
    if (!session) return;
    getMyApplications(session.token)
      .then((applications) => setApplication(applications[0] ? toApplicationRecord(applications[0]) : null))
      .catch(() => setApplication(null));
  }, []);
  const [title] = content[path] ?? [
    "Student space",
    "Manage your accommodation journey.",
  ];
  return (
    <Shell path={path}>
      {path === "/student/applications" ? (
        <Applications application={application} />
      ) : path === "/student/profile" ? (
        <>
          <Profile />
          <SettingsLogoutAction />
        </>
      ) : path === "/student/maintenance" ? (
        <Maintenance />
      ) : path === "/student/messages" ? (
        <MessageCenter />
      ) : (
        <Empty title={title} path={path} />
      )}
    </Shell>
  );
}
