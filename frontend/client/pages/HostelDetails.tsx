import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Login from "@/pages/Login";
import {
  getHostel,
  getProfileInitial,
  getProfilePhoto,
  getSessionEventName,
  getStoredSession,
  type BackendProperty,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Heart,
  MapPin,
  ShieldCheck,
} from "lucide-react";

type Room = { name: string; beds: number; units?: number; availableUnits?: number; price: number };
type PropertyRecord = {
  property?: {
    ownerName?: string;
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
  rooms?: Room[];
  status?: string;
};

function toPropertyRecord(property: BackendProperty): PropertyRecord {
  return { property, photos: property.photos, videos: property.videos ?? [], amenities: property.amenities, rooms: property.rooms, status: property.status };
}

function EmptyDetails() {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171717]">
      <header className=" bg-[#faf9f7]">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <Link
            to="/find-a-hostel"
            className="rounded-full border border-black px-4 py-2 text-xs font-bold"
          >
            Find a hostel
          </Link>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[760px] items-center justify-center px-5 py-16 text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4d6] text-[#a36500]">
            <Building2 />
          </div>
          <p className="eyebrow mt-6">Property unavailable</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em] sm:text-5xl">
            This hostel is not available yet.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/55">
            The property may still be under review, may have been removed, or is
            not connected to live marketplace data.
          </p>
          <Link
            to="/find-a-hostel"
            className="mt-7 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
          >
            Back to search <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function HostelDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [session, setSession] = useState(() => getStoredSession());
  const [authMode, setAuthMode] = useState<"login" | null>(null);
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getHostel(id).then((result) => setProperty(toPropertyRecord(result))).catch(() => setProperty(null)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    const refreshSession = () => setSession(getStoredSession());
    window.addEventListener("storage", refreshSession);
    window.addEventListener(getSessionEventName(), refreshSession);
    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener(getSessionEventName(), refreshSession);
    };
  }, []);
  if (loading)
    return <div className="min-h-screen animate-pulse bg-[#faf9f7]" />;
  if (!property) return <EmptyDetails />;
  const details = property.property ?? {};
  const photos = property.photos ?? [];
  const videos = property.videos ?? [];
  const profilePhoto = session ? getProfilePhoto(session.user) : "";
  const dashboardPath = session?.user.role === "owner"
    ? "/owner/dashboard"
    : session?.user.role === "university"
      ? "/university"
      : session?.user.role === "admin" || session?.user.role === "superadmin"
        ? "/admin"
        : "/dashboard";
  const media = [
    ...photos.map((src) => ({ src, type: "image" as const })),
    ...videos.map((src) => ({ src, type: "video" as const })),
  ];
  const rooms = property.rooms ?? [];
  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171717]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#faf9f7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                to={dashboardPath}
                aria-label="Open your dashboard"
                title={session.user.name}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f5b544] text-sm font-bold text-black"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${session.user.name} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getProfileInitial(session.user.name)
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="text-xs font-semibold"
              >
                Log in
              </button>
            )}
            {session?.user.role !== "owner" && (
              <Link
                to="/find-a-hostel"
                className="rounded-full border border-black px-4 py-2 text-xs font-bold"
              >
                Find a hostel
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8">
        <Link
          to="/find-a-hostel"
          className="mb-7 inline-flex items-center text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to hostels
        </Link>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-[10px] border bg-transparent px-3 py-1 text-[11px] font-bold ${property.status === "verified" ? "border-[#16733b]/30 text-[#16733b]" : "border-[#8a5d00]/30 text-[#8a5d00]"}`}>
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                {property.status === "verified"
                  ? "Verified property"
                  : property.status === "changes_requested"
                    ? "Changes requested"
                    : property.status === "draft"
                      ? "Draft listing"
                      : "Under review"}
              </span>
            </div>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.7rem)] font-extrabold leading-none tracking-[-.07em]">
              {details.name || "Verified property"}
            </h1>
            <p className="mt-4 text-sm text-black/55">
              <MapPin className="mr-1 inline h-4 w-4" />
              {details.city || "Location pending"}
              {details.area ? ` · ${details.area}` : ""}
              {details.university ? ` · Near ${details.university}` : ""}
            </p>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className={`rounded-full border px-4 py-2.5 text-xs font-bold ${saved ? "border-[#f5b544] bg-[#f5b544]" : "border-black/15 bg-white"}`}
          >
            <Heart
              className={`mr-2 inline h-4 w-4 ${saved ? "fill-black" : ""}`}
            />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {media.length > 0 ? (
          <div className="mt-10 grid gap-2 overflow-hidden rounded-2xl md:grid-cols-2">
            {media.map((item, index) => (
              <div
                key={`${item.type}-${item.src}`}
                className={index === 0 ? "md:row-span-2" : ""}
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    aria-label={`${details.name || "Property"} video ${index + 1}`}
                    controls
                    playsInline
                    preload="metadata"
                    className={`w-full object-cover ${index === 0 ? "h-[360px] md:h-[480px]" : "h-[238px]"}`}
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={`${details.name || "Property"} photo ${index + 1}`}
                    className={`w-full object-cover ${index === 0 ? "h-[360px] md:h-[480px]" : "h-[238px]"}`}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex h-64 items-center justify-center rounded-2xl border border-dashed border-black/20 bg-white">
            <p className="text-sm text-black/45">
              Property photos and videos are not available yet.
            </p>
          </div>
        )}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
          <div>
            <section className="border-b border-black/10 pb-10">
              <p className="eyebrow">About this hostel</p>
              <h2 className="section-title mt-2 text-3xl">
                A place students can
                <br />
                feel at home.
              </h2>
              <p className="mt-5 max-w-[670px] text-sm leading-7 text-black/60">
                {details.description ||
                  "The property owner has not added a description yet."}
              </p>
            </section>
            <section className="border-b border-black/10 py-10">
              <p className="eyebrow">What’s included</p>
              {property.amenities?.length ? (
                <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <div
                      className="flex items-center gap-3 text-sm font-semibold"
                      key={amenity}
                    >
                      <span className="rounded-lg bg-[#f5b544]/25 p-2">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      {amenity}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-black/50">
                  Amenities have not been added yet.
                </p>
              )}
            </section>
            <section id="rooms" className="py-10">
              <p className="eyebrow">Available rooms</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                Choose your space.
              </h2>
              {rooms.length ? (
                <div className="mt-6 space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.name}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-black/10 bg-white p-5 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-[#f5b544]/25 p-2">
                          <BedDouble className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">{room.name}</p>
                          <p className="mt-1 text-xs text-black/50">
                            {room.availableUnits ?? room.units ?? 1} rooms available · {room.beds} beds per room
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-display text-xl font-extrabold">
                          {typeof room.price === "number" ? `₦${room.price.toLocaleString()}` : room.price || "Price pending"}
                        </p>
                        <p className="mt-1 text-[10px] text-black/45">
                          per session
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-black/20 p-8 text-center text-sm text-black/50">
                  Rooms have not been added yet.
                </div>
              )}
            </section>
          </div>
          <aside>
            <div className="sticky top-[100px] rounded-2xl border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,.07)]">
              <p className="text-xs font-semibold text-black/45">
                {property.status === "verified" ? "Verified accommodation" : "Property listing under review"}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {details.name || "Property"}
              </p>
              <p className="mt-1 text-xs text-black/45">
                {details.distance
                  ? `${details.distance} from campus`
                  : "Distance pending"}
              </p>
              <p className="mt-3 text-xs text-black/55">
                Listed by <span className="font-bold text-black/75">{details.ownerName || "Property owner"}</span>
              </p>
              <div className="my-6 border-t border-black/10 pt-5">
                <p className="text-xs leading-5 text-black/55">
                  Availability and booking pricing will update when live room
                  inventory is connected.
                </p>
              </div>
              {property.status === "verified" ? (
                <Link
                  to={session?.user.role === "student" ? `/student/applications/new?property=${id}` : "/login"}
                  className="block w-full rounded-full bg-black py-3.5 text-center text-sm font-bold text-white"
                >
                  {session?.user.role === "student" ? "Apply for accommodation" : "Log in as a student"}{" "}
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </Link>
              ) : (
                <p className="rounded-xl bg-[#fff4d6] px-4 py-3 text-center text-xs font-semibold text-[#8a5d00]">
                  Applications open after this property is verified.
                </p>
              )}
              <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-xs text-black/60">
                <p>
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#1f9d55]" />
                  University verification complete
                </p>
                <p>
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#1f9d55]" />
                  Secure application flow
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {authMode && (
        <Login
          embedded
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
        />
      )}
    </div>
  );
}
