import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogoutButton, SettingsLogoutAction } from "@/components/LogoutButton";
import PropertyMediaCover from "@/components/PropertyMediaCover";
import { MobileDashboardMenu } from "@/components/MobileDashboardMenu";
import {
  deleteProperty,
  getMyMessages,
  getMessageContacts,
  getOwnerBookings,
  getOwnerReviews,
  getOwnerProperties,
  getReceivedApplications,
  getProfilePhoto,
  getStoredSession,
  getStoredSessionToken,
  storeProfilePhoto,
  storeSession,
  sendMessage,
  replyToReview,
  updateOwnerBookingStatus,
  updateProfilePhoto,
  uploadImageToCloudinary,
  type BackendProperty,
  type DirectMessage,
  type MessageContact,
  type OwnerBooking,
  type OwnerReview,
  type ReceivedApplication,
} from "@/lib/api";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { createMessageSocket } from "@/lib/realtime";

type Room = { name: string; beds: number; units?: number; price: string };
type PropertyDraft = {
  step?: number;
  property?: { name?: string; city?: string; area?: string };
  photos?: string[];
  amenities?: string[];
  rooms?: Room[];
  status?: string;
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
const titles: Record<string, [string, string]> = {
  "/owner/dashboard": ["Overview", "Your owner workspace at a glance."],
  "/owner/properties": ["Properties", "Manage your accommodation portfolio."],
  "/owner/rooms": ["Rooms & beds", "Keep every space and vacancy accurate."],
  "/owner/bookings": [
    "Bookings",
    "Track upcoming move-ins and current residents.",
  ],
  "/owner/payments": ["Payments", "Monitor collections, payouts and balances."],
  "/owner/messages": [
    "Messages",
    "Reply to students and keep communication clear.",
  ],
  "/owner/reviews": [
    "Reviews",
    "See what residents are saying about your spaces.",
  ],
  "/owner/analytics": [
    "Analytics",
    "Understand occupancy and demand over time.",
  ],
  "/owner/settings": [
    "Settings",
    "Manage your workspace and property preferences.",
  ],
};

function readDraft(ownerId?: string): PropertyDraft | null {
  if (!ownerId) return null;
  try {
    const saved =
      window.localStorage.getItem(`arc-property-draft:${ownerId}`) ??
      window.localStorage.getItem(`arc-owner-property:${ownerId}`);
    return saved ? (JSON.parse(saved) as PropertyDraft) : null;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: ReactNode }) {
  const path = useLocation().pathname;
  const mobileItems = nav.map(([href, icon, label]) => ({ href, icon, label }));
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
      <MobileDashboardMenu path={path} items={mobileItems} />
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

function Heading({ path }: { path: string }) {
  const [title, subtitle] = titles[path] ?? [
    "Owner workspace",
    "Manage your accommodation business.",
  ];
  return (
    <div>
     
      <h1 className="mt-2 font-poppins text-black/80 text-xl font-[550] tracking-[-.04em] sm:text-xl">
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
  action = "Add a property",
  href = "/owner/properties/new",
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

function Overview({ properties }: { properties: BackendProperty[] }) {
  const roomCount = properties.reduce((sum, item) => sum + item.rooms.length, 0);
  const bedCount = properties.reduce((sum, item) => sum + item.rooms.reduce((total, room) => total + room.beds * (room.units ?? 1), 0), 0);
  return (
    <>
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,.08)]">
        <div className="mb-3 px-1">
          <p className="font-display text-[18px] font-semibold md:text-[22px]">Start your search</p>
          <p className="text-[15px] text-black/75">A better way to find your next room</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1.25fr_1fr_1fr_1fr_auto]">
          <label className="search-field">
            <MapPin />
            <span><small>University</small><input placeholder="Where do you study?" /></span>
          </label>
          <label className="search-field">
            <MapPin />
            <span><small>Location</small><input placeholder="City or area" /></span>
          </label>
          <label className="search-field">
            <CalendarDays />
            <span><small>Move-in date</small><input placeholder="Any date" /></span>
          </label>
          <label className="search-field">
            <BedDouble />
            <span><small>Room type</small><input placeholder="Any room" /></span>
          </label>
          <Link to="/find-a-hostel" className="flex items-center justify-center rounded-xl bg-[#f5b544] px-6 py-3 text-sm font-[500]">
            Search
          </Link>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <Link
          to="/owner/properties/new"
          className="inline-flex items-center rounded-[5px] bg-black px-5 py-3 text-xs font-[500] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add property
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <Building2 className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {properties.length || "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Properties</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <BedDouble className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {properties.length ? roomCount : "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Room types</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <ClipboardList className="h-5 w-5 text-[#a36500]" />
          <p className="mt-6 font-display text-3xl font-extrabold">
            {properties.length ? bedCount : "—"}
          </p>
          <p className="mt-1 text-xs text-black/50">Configured beds</p>
        </div>
      </div>
      {properties.length ? (
        <div className="mt-8 space-y-4">
          {properties.map((property) => (
          <section key={property.id} className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="mb-5 h-40 overflow-hidden rounded-xl">
            <PropertyMediaCover name={property.name} photos={property.photos} videos={property.videos} />
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow">
                    {property.status === "under_review" ? "Submitted for review" : property.status}
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">
                {property.name}
              </h2>
              <p className="mt-2 text-sm text-black/50">
                {property.status === "verified" ? "Your property is live." : "Your property is awaiting verification."}
              </p>
            </div>
               <Link
                 to={`/owner/properties/new?edit=${property.id}`}
              className="inline-flex w-fit rounded-[5px] bg-black px-5 py-3 text-xs font-[500] text-white"
            >
                 Publish property <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
              </div>
          </section>
          ))}
        </div>
      ) : (
        <Empty
          icon={Building2}
          title="Your owner workspace is ready"
          copy="Create your first property to start adding rooms, beds, applications, and bookings."
        />
      )}
    </>
  );
}

function Properties({ properties, onDelete }: { properties: BackendProperty[]; onDelete: (id: string) => void }) {
  if (!properties.length)
    return (
      <Empty
        icon={Building2}
        title="No properties yet"
        copy="Add your first property to start building its rooms, amenities, and availability."
      />
    );
  return <div className="mt-8 space-y-4">{properties.map((property) => (
    <section key={property.id} className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="mb-5 h-40 overflow-hidden rounded-xl">
        <PropertyMediaCover name={property.name} photos={property.photos} videos={property.videos} />
      </div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-[10px] font-bold text-[#8a5d00]">{property.status}</span>
          <h2 className="mt-4 font-display text-2xl font-extrabold">{property.name}</h2>
          <p className="mt-1 text-sm text-black/50">{property.city} · {property.area}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/owner/properties/new?edit=${property.id}`} className="rounded-full bg-black px-4 py-3 text-xs font-bold text-white">Edit</Link>
          <button type="button" onClick={() => onDelete(property.id)} className="rounded-full border border-black/15 px-4 py-3 text-xs font-bold">Delete</button>
        </div>
      </div>
      <div className="mt-7 grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-3 text-sm">
        <div><p className="text-xs text-black/45">Media</p><p className="mt-1 text-lg font-bold">{property.photos.length + (property.videos?.length ?? 0)}</p></div>
        <div><p className="text-xs text-black/45">Amenities</p><p className="mt-1 text-lg font-bold">{property.amenities.length}</p></div>
        <div><p className="text-xs text-black/45">Room types</p><p className="mt-1 text-lg font-bold">{property.rooms.length}</p></div>
      </div>
    </section>
  ))}</div>;
}

function Rooms({ draft }: { draft: PropertyDraft | null }) {
  const rooms = draft?.rooms ?? [];
  if (!draft || rooms.length === 0)
    return (
      <Empty
        icon={BedDouble}
        title="No rooms configured"
        copy="Add room types and bed counts while creating your property. Availability will appear here once rooms exist."
        action="Configure rooms"
      />
    );
  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Draft inventory</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">
            Room types & beds
          </h2>
        </div>
        <Link
          to="/owner/properties/new?draft=1"
          className="rounded-full border border-black/15 px-4 py-3 text-xs font-bold"
        >
          Edit rooms
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {rooms.map((room, index) => (
          <div
            key={`${room.name}-${index}`}
            className="rounded-xl bg-[#f7f6f3] p-4"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-display font-extrabold">
                  {room.name || "Unnamed room type"}
                </p>
                <p className="mt-1 text-xs text-black/50">
                  {room.price || "Price not set"} per session · {room.units ?? 1} units · {room.beds} beds per unit
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-black/50">
                Availability pending
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: room.beds * (room.units ?? 1) }, (_, bed) => (
                <span
                  key={bed}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 bg-white text-[10px] font-bold text-black/45"
                >
                  {bed + 1}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-black/45">
        Bed occupancy will be connected to bookings and approved applications
        when backend data is available.
      </p>
    </section>
  );
}

function Generic({ title }: { title: string }) {
  return (
    <Empty
      icon={CheckCircle2}
      title={`${title} workspace ready`}
      copy="This frontend surface is ready for live data, filters, actions, and API integration."
      action="Return to overview"
      href="/owner/dashboard"
    />
  );
}

function OwnerBookings({ bookings, onStatusChange }: { bookings: OwnerBooking[]; onStatusChange: (id: string, status: "confirmed" | "cancelled") => Promise<void> }) {
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const search = query.trim().toLowerCase();
    return matchesStatus && (!search || `${booking.studentName} ${booking.studentEmail} ${booking.propertyName} ${booking.roomName}`.toLowerCase().includes(search));
  });
  const requestedCount = bookings.filter((booking) => booking.status === "requested").length;
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const totalValue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  if (!bookings.length)
    return <Empty icon={CalendarDays} title="No bookings yet" copy="Confirmed student reservations will appear here with their move-in dates and room details." action="Return to overview" href="/owner/dashboard" />;
  return (
    <section className="mt-8 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs text-black/45">Pending requests</p><p className="mt-3 font-display text-3xl font-extrabold">{requestedCount}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs text-black/45">Confirmed bookings</p><p className="mt-3 font-display text-3xl font-extrabold">{confirmedCount}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs text-black/45">Booking value</p><p className="mt-3 font-display text-3xl font-extrabold">₦{totalValue.toLocaleString()}</p></div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row"><label className="flex flex-1 items-center rounded-xl bg-[#f7f6f3] px-3"><span className="sr-only">Search bookings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students, properties or rooms" className="w-full bg-transparent py-3 text-sm outline-none" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-3 text-xs font-bold outline-none"><option value="all">All statuses</option><option value="requested">Requested</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
      {filteredBookings.length ? filteredBookings.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="font-display text-lg font-extrabold">{booking.studentName}</p>
              <p className="mt-1 text-xs text-black/50">{booking.studentEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-fit rounded-full px-3 py-2 text-[11px] font-bold capitalize ${booking.status === "cancelled" ? "bg-[#ffe3e3] text-[#a52a2a]" : booking.status === "confirmed" ? "bg-[#dff3e6] text-[#16733b]" : "bg-[#fff4d6] text-[#8a5d00]"}`}>{booking.status}</span>
              {booking.status === "requested" && <><button type="button" disabled={Boolean(updating)} onClick={async () => { setUpdating(booking.id); setError((current) => ({ ...current, [booking.id]: "" })); try { await onStatusChange(booking.id, "confirmed"); } catch (actionError) { setError((current) => ({ ...current, [booking.id]: actionError instanceof Error ? actionError.message : "Booking could not be updated." })); } finally { setUpdating(""); } }} className="rounded-full bg-black px-3 py-2 text-[11px] font-bold text-white">Confirm</button><button type="button" disabled={Boolean(updating)} onClick={async () => { setUpdating(booking.id); setError((current) => ({ ...current, [booking.id]: "" })); try { await onStatusChange(booking.id, "cancelled"); } catch (actionError) { setError((current) => ({ ...current, [booking.id]: actionError instanceof Error ? actionError.message : "Booking could not be updated." })); } finally { setUpdating(""); } }} className="rounded-full border border-black/15 px-3 py-2 text-[11px] font-bold">Decline</button></>}
            </div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-black/10 pt-4 text-xs sm:grid-cols-3">
            <div><p className="text-black/45">Property</p><p className="mt-1 font-bold">{booking.propertyName}</p></div>
            <div><p className="text-black/45">Room</p><p className="mt-1 font-bold">{booking.roomName}</p></div>
            <div><p className="text-black/45">Move-in</p><p className="mt-1 font-bold">{booking.moveInDate}</p></div>
            <div><p className="text-black/45">Room price</p><p className="mt-1 font-bold">₦{booking.amount.toLocaleString()}</p></div>
          </div>
          {error[booking.id] && <p className="mt-3 text-xs font-semibold text-[#a52a2a]">{error[booking.id]}</p>}
        </article>
      )) : <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center"><p className="font-display text-lg font-extrabold">No matching bookings</p><p className="mt-2 text-sm text-black/50">Try a different search or status filter.</p></div>}
    </section>
  );
}

function OwnerPayments() {
  return <Empty icon={DollarSign} title="Payments are coming soon" copy="Payment collection is not connected yet. Once payments are enabled, this page will show collections, outstanding balances, and payouts." />;
}

function OwnerMessages({ messages, contacts, onMessage }: { messages: DirectMessage[]; contacts: MessageContact[]; onMessage: (message: DirectMessage) => void }) {
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setSelectedContactId((current) => current || contacts[0]?.id || ""), [contacts]);
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const conversation = messages.filter((message) => (message.senderId === selectedContactId || message.recipientId === selectedContactId));
  const send = async () => {
    const token = getStoredSessionToken();
    if (!token || !selectedContactId || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const message = await sendMessage({ recipientId: selectedContactId, body: draft.trim() }, token);
      onMessage(message);
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };
  if (!contacts.length)
    return <Empty icon={MessageCircle} title="No messages yet" copy="Student conversations will appear here when a student contacts you." />;
  return (
    <section className="mt-8 grid overflow-hidden rounded-2xl border border-black/10 bg-white md:grid-cols-[220px_1fr]">
      <aside className="border-b border-black/10 p-3 md:border-b-0 md:border-r"><p className="px-3 py-2 text-xs font-bold text-black/45">Students</p>{contacts.map((contact) => <button key={contact.id} type="button" onClick={() => setSelectedContactId(contact.id)} className={`w-full rounded-xl px-3 py-3 text-left ${contact.id === selectedContactId ? "bg-black text-white" : "hover:bg-[#f7f6f3]"}`}><p className="text-sm font-bold">{contact.name}</p><p className={`mt-1 truncate text-[11px] ${contact.id === selectedContactId ? "text-white/60" : "text-black/45"}`}>{contact.email}</p></button>)}</aside>
      <div className="flex min-h-[420px] flex-col"><div className="border-b border-black/10 p-5"><p className="text-xs text-black/45">Conversation</p><h2 className="mt-1 font-display text-xl font-extrabold">{selectedContact?.name}</h2></div><div className="flex-1 space-y-3 p-5">{!conversation.length && <p className="py-12 text-center text-sm text-black/45">No messages in this conversation yet.</p>}{conversation.map((message) => <div key={message.id} className={`flex ${message.senderId === selectedContactId ? "justify-start" : "justify-end"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.senderId === selectedContactId ? "bg-[#f7f6f3]" : "bg-black text-white"}`}><p>{message.body}</p><p className="mt-2 text-[10px] opacity-50">{new Date(message.createdAt).toLocaleString()}</p></div></div>)}</div><div className="border-t border-black/10 p-4">{error && <p className="mb-2 text-xs font-semibold text-[#a52a2a]">{error}</p>}<div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl bg-[#f7f6f3] px-4 py-3 text-sm outline-none" /><button type="button" disabled={sending || !draft.trim()} onClick={() => void send()} className="rounded-xl bg-black px-4 py-3 text-xs font-bold text-white disabled:opacity-40">{sending ? "Sending..." : "Send"}</button></div></div></div>
    </section>
  );
}

function OwnerReviews({ reviews, onReply }: { reviews: OwnerReview[]; onReply: (id: string, reply: string) => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
  const filteredReviews = useMemo(() => reviews.filter((review) => {
    const matchesRating = ratingFilter === "all" || review.rating === Number(ratingFilter);
    const search = query.trim().toLowerCase();
    return matchesRating && (!search || `${review.studentName} ${review.propertyName} ${review.body}`.toLowerCase().includes(search));
  }), [query, ratingFilter, reviews]);
  if (!reviews.length)
    return <Empty icon={Star} title="No reviews yet" copy="Student reviews will appear here after residents have stayed at one of your properties." action="Return to overview" href="/owner/dashboard" />;
  return (
    <section className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="rounded-2xl bg-black p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-white/50">Overall rating</p>
          <p className="mt-3 font-display text-5xl font-extrabold">{averageRating.toFixed(1)}</p>
          <p className="mt-2 text-xl tracking-[.18em] text-[#f5b544]">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</p>
          <p className="mt-3 text-xs text-white/50">Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="eyebrow">Guest sentiment</p><h2 className="mt-2 font-display text-xl font-extrabold">Rating breakdown</h2></div><Star className="h-5 w-5 text-[#a36500]" /></div>
          <div className="mt-5 space-y-2">{distribution.map(({ rating, count }) => <div key={rating} className="flex items-center gap-3 text-xs"><span className="w-8 font-bold">{rating} <span className="text-[#a36500]">★</span></span><div className="h-2 flex-1 rounded-full bg-black/10"><div className="h-full rounded-full bg-[#f5b544]" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} /></div><span className="w-5 text-right text-black/45">{count}</span></div>)}</div>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row"><label className="flex flex-1 items-center rounded-xl bg-[#f7f6f3] px-3"><span className="sr-only">Search reviews</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reviews, students or properties" className="w-full bg-transparent py-3 text-sm outline-none" /></label><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-3 text-xs font-bold outline-none"><option value="all">All ratings</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div>
      {filteredReviews.length ? filteredReviews.map((review) => <article key={review.id} className="rounded-2xl border border-black/10 bg-white p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5b544] text-sm font-bold">{review.studentName.charAt(0).toUpperCase()}</div><div><p className="font-display text-lg font-extrabold">{review.studentName}</p><p className="mt-1 text-xs text-black/45">{review.propertyName} · {review.roomName} · {new Date(review.createdAt).toLocaleDateString()}</p></div></div><div className="text-[#a36500]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div></div><p className="mt-5 text-sm leading-6 text-black/70">{review.body}</p>{review.ownerReply ? <div className="mt-5 border-l-2 border-[#f5b544] bg-[#f7f6f3] p-4"><p className="text-xs font-bold text-black/45">Your reply</p><p className="mt-2 text-sm leading-6">{review.ownerReply}</p></div> : <div className="mt-5"><label className="text-xs font-bold">Reply publicly<textarea value={drafts[review.id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Thank the student or respond to their feedback..." className="mt-2 h-24 w-full resize-none rounded-xl bg-[#f7f6f3] p-3 text-sm outline-none focus:ring-2 focus:ring-[#f5b544]" /></label><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-[#a52a2a]">{replyErrors[review.id]}</p><button type="button" disabled={saving === review.id || !(drafts[review.id] ?? "").trim()} onClick={async () => { setSaving(review.id); setReplyErrors((current) => ({ ...current, [review.id]: "" })); try { await onReply(review.id, drafts[review.id].trim()); } catch (error) { setReplyErrors((current) => ({ ...current, [review.id]: error instanceof Error ? error.message : "Reply could not be saved." })); } finally { setSaving(""); } }} className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-40">{saving === review.id ? "Publishing..." : "Publish reply"}</button></div></div>}</article>) : <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center"><p className="font-display text-lg font-extrabold">No matching reviews</p><p className="mt-2 text-sm text-black/50">Try a different search or rating filter.</p></div>}
    </section>
  );
}

function OwnerAnalytics({ properties, applications, bookings }: { properties: BackendProperty[]; applications: ReceivedApplication[]; bookings: OwnerBooking[] }) {
  const beds = properties.reduce((sum, property) => sum + property.rooms.reduce((roomSum, room) => roomSum + room.beds, 0), 0);
  const occupancy = beds ? Math.round((bookings.length / beds) * 100) : 0;
  const metrics = [["Properties", properties.length], ["Configured beds", beds], ["Applications", applications.length], ["Bookings", bookings.length]];
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs text-black/45">{label}</p><p className="mt-3 font-display text-3xl font-extrabold">{value}</p></div>)}
      </div>
      <section className="mt-5 rounded-2xl bg-black p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-[#f5b544]">Portfolio occupancy</p>
        <p className="mt-2 font-display text-4xl font-extrabold">{occupancy}%</p>
        <div className="mt-5 h-3 rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f5b544]" style={{ width: `${Math.min(100, occupancy)}%` }} /></div>
        <p className="mt-3 text-xs text-white/50">Based on confirmed bookings and configured beds.</p>
      </section>
    </>
  );
}

function OwnerSettings() {
  const session = getStoredSession();
  const [photoUrl, setPhotoUrl] = useState(() => session ? getProfilePhoto(session.user) : "");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const token = getStoredSessionToken();
    if (!file || !token || !session) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Choose a valid image file.");
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      setNotice("Choose an image smaller than 9 MB.");
      return;
    }
    setUploading(true);
    try {
      const nextPhoto = await uploadImageToCloudinary(file, token, "profile");
      const user = await updateProfilePhoto(nextPhoto, token);
      storeProfilePhoto(session.user.id, nextPhoto);
      storeSession({ ...session, user });
      setPhotoUrl(nextPhoto);
      setNotice("Profile photo updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-4 border-b border-black/10 pb-6">
        {photoUrl ? <img src={photoUrl} alt="Owner profile" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5b544] text-xl font-bold">{session?.user.name.charAt(0) ?? "O"}</div>}
        <div><h2 className="font-display text-xl font-extrabold">Account profile</h2><p className="mt-1 text-sm text-black/50">Keep your owner details and profile photo current.</p></div>
        <label className="ml-auto cursor-pointer rounded-full bg-black px-4 py-3 text-xs font-bold text-white">{uploading ? "Uploading..." : "Change photo"}<input type="file" accept="image/*" disabled={uploading} onChange={uploadPhoto} className="hidden" /></label>
      </div>
      {notice && <p className="mt-4 rounded-xl bg-[#f7f6f3] px-4 py-3 text-xs font-semibold">{notice}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div><p className="text-xs text-black/45">Full name</p><p className="mt-1 font-bold">{session?.user.name ?? "Not available"}</p></div>
        <div><p className="text-xs text-black/45">Email address</p><p className="mt-1 font-bold">{session?.user.email ?? "Not available"}</p></div>
        <div><p className="text-xs text-black/45">Phone number</p><p className="mt-1 font-bold">{session?.user.phoneNumber ?? "Not provided"}</p></div>
        <div><p className="text-xs text-black/45">Account type</p><p className="mt-1 font-bold capitalize">{session?.user.ownerType ?? "Personal owner"}</p></div>
      </div>
    </section>
  );
}

export default function OwnerPortal() {
  const path = useLocation().pathname;
  const [draft, setDraft] = useState<PropertyDraft | null>(null);
  const [properties, setProperties] = useState<BackendProperty[]>([]);
  const [applications, setApplications] = useState<ReceivedApplication[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageContacts, setMessageContacts] = useState<MessageContact[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setDraft(readDraft(getStoredSession()?.user.id));
    const token = getStoredSessionToken();
    if (!token) return setLoading(false);
    const socket = createMessageSocket(token);
    socket.on("message:new", (message) => setMessages((current) => [...current, message]));
    Promise.all([
      getOwnerProperties(token),
      getReceivedApplications(token),
      getOwnerBookings(token),
      getOwnerReviews(token),
      getMyMessages(token),
      getMessageContacts(token),
    ]).then(([nextProperties, nextApplications, nextBookings, nextReviews, nextMessages, nextContacts]) => {
      setProperties(nextProperties);
      setApplications(nextApplications);
      setBookings(nextBookings);
      setReviews(nextReviews);
      setMessages(nextMessages);
      setMessageContacts(nextContacts);
    }).finally(() => setLoading(false));
    return () => {
      socket.close();
    };
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
      {path === "/owner/dashboard" ? (
        <Overview properties={properties} />
      ) : path === "/owner/properties" ? (
        <Properties properties={properties} onDelete={async (id) => {
          const token = getStoredSessionToken();
          if (!token) return;
          await deleteProperty(id, token);
          setProperties((current) => current.filter((property) => property.id !== id));
        }} />
      ) : path === "/owner/rooms" ? (
        <Rooms draft={draft} />
      ) : path === "/owner/bookings" ? (
        <OwnerBookings bookings={bookings} onStatusChange={async (id, status) => { const token = getStoredSessionToken(); if (!token) return; await updateOwnerBookingStatus(id, status, token); setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking)); }} />
      ) : path === "/owner/payments" ? (
        <OwnerPayments />
      ) : path === "/owner/messages" ? (
        <OwnerMessages messages={messages} contacts={messageContacts} onMessage={(message) => setMessages((current) => [...current, message])} />
      ) : path === "/owner/reviews" ? (
        <OwnerReviews reviews={reviews} onReply={async (id, reply) => { const token = getStoredSessionToken(); if (!token) return; await replyToReview(id, reply, token); setReviews((current) => current.map((review) => review.id === id ? { ...review, ownerReply: reply } : review)); }} />
      ) : path === "/owner/analytics" ? (
        <OwnerAnalytics properties={properties} applications={applications} bookings={bookings} />
      ) : path === "/owner/settings" ? (
        <>
          <OwnerSettings />
          <SettingsLogoutAction />
        </>
      ) : (
        <Generic title={titles[path]?.[0] ?? "Owner"} />
      )}
    </Shell>
  );
}
