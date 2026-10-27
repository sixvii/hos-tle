import { Link } from "react-router-dom";
import Login from "./Login";
import PropertyMediaCover from "@/components/PropertyMediaCover";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getSessionEventName,
  getStoredSession,
  searchHostels,
  type AuthResponse,
  type BackendProperty,
} from "@/lib/api";

const hostel = "/hostel1.jpg";
const hostel1 = "/hostel2.jpg";

type ReverseGeocodeResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
};

const features = [
  {
    icon: ShieldCheck,
    title: "Verified places",
    text: "Every property is reviewed so you can book with confidence.",
  },
  {
    icon: SlidersHorizontal,
    title: "Find your fit",
    text: "Compare rooms, amenities, price and distance in one view.",
  },
  {
    icon: BedDouble,
    title: "Simple renting",
    text: "Apply, reserve and manage your accommodation from one place.",
  },
  {
    icon: Sparkles,
    title: "Clear from day one",
    text: "Know exactly what you are paying for before you move in.",
  },
];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [university, setUniversity] = useState("");
  const [location, setLocation] = useState("");
  const [locationStatus, setLocationStatus] = useState<"detecting" | "detected" | "manual" | "unavailable">("detecting");
  const locationEdited = useRef(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const [session, setSession] = useState<AuthResponse | null>(() => getStoredSession());
  const [hostels, setHostels] = useState<BackendProperty[]>([]);

  useEffect(() => {
    const refreshSession = () => setSession(getStoredSession());
    window.addEventListener("storage", refreshSession);
    window.addEventListener(getSessionEventName(), refreshSession);
    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener(getSessionEventName(), refreshSession);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          if (!response.ok) throw new Error("Location lookup failed");
          const data = (await response.json()) as ReverseGeocodeResponse;
          const detectedLocation = data.locality || data.city || data.principalSubdivision;
          if (detectedLocation && !locationEdited.current) {
            setLocation(detectedLocation);
            setLocationStatus("detected");
          }
        } catch {
          setLocationStatus("unavailable");
        }
      },
      () => setLocationStatus("unavailable"),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const loadHostels = () => {
      searchHostels({})
        .then((properties) => setHostels(Array.isArray(properties) ? properties : []))
        .catch(() => setHostels([]));
    };
    loadHostels();
    window.addEventListener("properties-updated", loadHostels);
    window.addEventListener("focus", loadHostels);
    window.addEventListener("storage", loadHostels);
    const refresh = window.setInterval(loadHostels, 10000);
    return () => {
      window.removeEventListener("properties-updated", loadHostels);
      window.removeEventListener("focus", loadHostels);
      window.removeEventListener("storage", loadHostels);
      window.clearInterval(refresh);
    };
  }, []);

  const isAdmin = session?.user.role === "admin" || session?.user.role === "superadmin";
  const dashboardPath = isAdmin ? "/admin" : session?.user.role === "owner" ? "/owner/dashboard" : "/dashboard";
  const isOwner = session?.user.role === "owner";
  const visibleHostels = hostels.filter((hostel) => {
    const locationQuery = location.trim().toLowerCase();
    const universityQuery = university.trim().toLowerCase();
    return (
      (!locationQuery || `${hostel.area} ${hostel.city}`.toLowerCase().includes(locationQuery)) &&
      (!universityQuery || hostel.university.toLowerCase().includes(universityQuery))
    );
  });
  const newestHostels = [...visibleHostels]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, 6);
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFFFF] text-[#171717] selection:bg-[#f5b544] selection:text-black">
      <header className="fixed inset-x-0 top-0 z-40 bg-black text-white">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-0.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <nav className="hidden items-center gap-7 text-[14.5px] font-medium text-white/95 lg:flex ">
            <a href="#students" className='hover:text-[#F6B544]'>For students</a>
            <a href="#owners" className='hover:text-[#F6B544]'>For hostel owners</a>
            <a href="#how" className='hover:text-[#F6B544]'>How it works</a>
            {!isOwner && !isAdmin && <Link to="/find-a-hostel" className='hover:text-[#F6B544]'>Find hostels</Link>}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {session ? (
              <Link
                to={dashboardPath}
                className=" bg-white px-4 h-[75px] text-[14.5px] font-[500] text-black items-center flex gap-2 justify-center hover:bg-white/90"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setAuthMode("login")}
                className="px-3 text-[14.5px] font-[500]"
              >
                Log in
              </button>
            )}
            {!isOwner && !isAdmin && <Link to="/find-a-hostel" className="px-4 py-2 text-[14.5px] font-[500]">Find a hostel</Link>}
            {isOwner && (
              <Link
                to="/owner/dashboard"
                className=" px-4 py-2 text-[14.5px] font-[500] text-white"
              >
                List your hostel
              </Link>
            )}
          </div>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              src={menuOpen ? "/close.png" : "/menu.png"}
              alt=""
              aria-hidden="true"
              className="h-7 w-7 object-contain invert"
            />
          </button>
        </div>
        {menuOpen && (
          <div className="fixed left-1/2 top-1/2 z-[60] flex h-[82vh] w-[95vw] max-w-[390px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[5px] bg-[#1c1c1c] text-[#FFFFFF] shadow-xl lg:hidden">
            <div className="flex h-[74px] items-center justify-between px-5">
              <Link to="/" aria-label="Hostle home" onClick={() => setMenuOpen(false)}>
                
              </Link>
             
            </div>
            <div className="flex flex-col gap-7 px-5 pt-5 text-[17px] font-bold text-[#FFFFFF]">
              <a href="#students" onClick={() => setMenuOpen(false)}>
                For students
              </a>
              <a href="#owners" onClick={() => setMenuOpen(false)}>
                For hostel owners
              </a>
              <a href="#how" onClick={() => setMenuOpen(false)}>
                How it works
              </a>
              {!isOwner && !isAdmin && <Link to="/find-a-hostel" onClick={() => setMenuOpen(false)}>Find hostels</Link>}
              <Link to={session ? dashboardPath : "/login"} onClick={() => setMenuOpen(false)}>
                {session ? "Dashboard" : "Log in"}
              </Link>
              {isOwner && <Link to="/owner/dashboard" onClick={() => setMenuOpen(false)}>List your hostel</Link>}
            </div>
          </div>
        )}
      </header>
      <main className="pt-[74px]">
        <section className="scroll-mt-[74px] overflow-hidden border-b border-white/10 bg-black text-white">
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
            <div className="max-w-[560px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 md:px-10 py-1.5 text-[15px] font-[400]">
                <span className="h-2 w-2 rounded-full bg-[#25a65a]" /> Built for
                student life
              </div>
              <h1 className="font-display text-[clamp(3.3rem,7vw,4.6rem)] font-[530] leading-[.98] tracking-[-0.075em]">
                Find a place
                <br />
                that feels <span className="text-[#e5a32d]">like home.</span>
              </h1>
              <p className="mt-7 max-w-[445px] text-[16px] leading-7 text-white/85">
                Discover trusted student hostels near your university. Compare
                rooms, prices, amenities and availability — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {!isOwner && !isAdmin && <Link to="/find-a-hostel" className="group rounded-full bg-[#f5b544] px-6 py-3.5 text-[14.5px] font-[480] text-black">Find a hostel <ArrowRight className="ml-2 inline h-5 w-5" /></Link>}
                {isOwner && (
                  <Link
                    to="/owner/dashboard"
                    className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold"
                  >
                    List your hostel
                  </Link>
                )}
              </div>
              <p className="mt-4 text-[15.5px] font-[400] text-white/95">
                Trusted accommodation for university students
              </p>
            </div>
            <div className="relative min-h-[410px] lg:min-h-[500px]">
              <div className="absolute right-0 top-3 h-[78%] w-[74%] overflow-hidden rounded-[5px]  shadow-3xl">
                <img
                  src={hostel1}
                  className="h-full w-full object-cover"
                  alt="Bright student bedroom"
                />
              </div>
              <div className="absolute bottom-2 left-0 z-10 w-[47%] overflow-hidden rounded-[5px]  shadow-xl">
                <img
                  src={hostel}
                  className="h-44 w-full object-cover"
                  alt="Students studying together"
                />
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-display text-sm font-bold">
                    
                    </p>
                    <p className="text-[11px] text-black/50">
                    
                    </p>
                  </div>
                 
                </div>
              </div>
              <div className="absolute right-[2%] top-[22%] z-10 flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white shadow-lg">
                <MapPin className="h-4 w-4 text-[#f5b544]" /> 
              </div>
            </div>
          </div>
        </section>
        <section className="relative z-10 mx-auto -mt-8 max-w-[1060px] scroll-mt-[74px] px-5">
          <div className="rounded-2xl border border-black/10 bg-[#FFFFFF] p-4 shadow-[0_18px_60px_rgba(0,0,0,.1)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="font-display md:text-[22px] text-[18px] font-[600]">
                  Start your search
                </p>
                <p className="text-[15px] text-black/75">
                  A better way to find your next room
                </p>
              </div>
              {!isOwner && <Link to="/find-a-hostel" className="hidden text-[14px] font-[500] text-[#a36500] sm:block">Advanced search <ArrowRight className="ml-1 inline h-5 w-5" /></Link>}
            </div>
            <div className="grid gap-2 md:grid-cols-[1.25fr_1fr_1fr_1fr_auto]">
              <label className="search-field">
                <MapPin />
                <span>
                  <small>University</small>
                  <input
                    placeholder="Where do you study?"
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                  />
                </span>
              </label>
              <label className="search-field">
                <MapPin />
                <span>
                  <small>Location</small>
                  <input
                    placeholder={locationStatus === "detecting" ? "Detecting location..." : "City or area"}
                    value={location}
                    onChange={(event) => {
                      locationEdited.current = true;
                      setLocationStatus("manual");
                      setLocation(event.target.value);
                    }}
                  />
                </span>
              </label>
              <label className="search-field">
                <CalendarDays />
                <span>
                  <small>Move-in date</small>
                  <input placeholder="Any date" />
                </span>
              </label>
              <label className="search-field">
                <BedDouble />
                <span>
                  <small>Room type</small>
                  <input placeholder="Any room" />
                </span>
              </label>
              {!isOwner && <Link to="/find-a-hostel" className="flex items-center justify-center rounded-xl bg-[#f5b544] px-6 py-3 text-sm font-[500]"><Search className="mr-2 h-4 w-4" /> Search</Link>}
            </div>
          </div>
        </section>
        <section className="bg-[#FFFFFF] py-20 font-poppins" id="hostels">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-[13px] text-[#a36500]">Owner listings</p>
                <h2 className="section-title mt-3 text-[34px]">Explore hostels.</h2>
                <p className="mt-3 max-w-[460px] text-sm text-black/60">
                  Browse accommodation created by hostel owners. Open a listing to see details and availability.
                </p>
              </div>
              {!isOwner && <Link to="/find-a-hostel" className="w-fit rounded-full bg-black px-5 py-3 text-xs font-bold text-white">View all hostels <ArrowRight className="ml-2 inline h-4 w-4" /></Link>}
            </div>
            {visibleHostels.length ? (
              <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-3">
                {visibleHostels.map((hostel) => (
                  <Link key={hostel.id} to={`/hostels/${hostel.id}`} className="overflow-hidden rounded-2xl bg-white transition hover:-translate-y-1">
                    <div className="h-44">
                      <PropertyMediaCover
                        name={hostel.name}
                        photos={hostel.photos}
                        videos={hostel.videos}
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-bold text-black/45">{hostel.status === "verified" ? "Verified hostel" : "Hostel listing"}</p>
                      <h3 className="mt-2 font-display text-lg font-extrabold">{hostel.name}</h3>
                      <p className="mt-1 text-sm text-black/55">{hostel.area}, {hostel.city}</p>
                      <span className="mt-4 inline-flex text-xs font-bold text-[#a36500]">View hostel <ArrowRight className="ml-2 h-4 w-4" /></span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-8  p-8 text-center text-sm text-black/50">
                {location.trim()
                  ? `No hostel listings found in ${location.trim()}.`
                  : "Owner hostel listings will appear here when they are created."}
              </p>
            )}
          </div>
        </section>
        <section
          className="mx-auto max-w-[1240px] scroll-mt-[74px] px-5 py-24 font-poppins lg:px-8"
          id="students"
        >
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div>
              <p className="eyebrow text-[13px] font-[550] text-black/75">The arc() difference</p>
              <h2 className="section-title mt-3 text-[45px]">
                Everything you need
                <br />
                to settle in.
              </h2>
            </div>
            <p className="max-w-[430px] text-sm leading-6 text-black/75">
              From your first search to the day you move in, arc() gives you a
              clearer, safer way to find student accommodation.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="feature-card">
                <div
                  className={`mb-12 flex h-11 w-11 items-center justify-center rounded-xl ${index % 2 ? "bg-[#f7f0e4]" : "bg-[#f5b544]"}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-[18px] font-[550] tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-black/55">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-[#151515] py-24 text-white font-poppins">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="eyebrow text-[#f5b544] text-[13px]">Explore places to live</p>
                <h2 className="section-title mt-3 md:text-[47px] text-[25px]">
                  Find your next
                  <br />
                  <span className="text-[#f5b544]">chapter.</span>
                </h2>
              </div>
              {!isOwner && <Link to="/find-a-hostel" className="w-fit rounded-full border border-white/30 px-5 py-3 text-[14px] font-bold">Explore all hostels <ArrowRight className="ml-2 inline h-4 w-4" /></Link>}
            </div>
            {newestHostels.length ? (
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
                {newestHostels.map((hostel) => {
                  const lowestPrice = hostel.rooms.length
                    ? Math.min(...hostel.rooms.map((room) => room.price))
                    : null;
                  return (
                    <Link
                      key={hostel.id}
                      to={`/hostels/${hostel.id}`}
                      className="overflow-hidden rounded-2xl bg-{#1c1c1c} text-[#FFFFFF] transition hover:-translate-y-1"
                    >
                      <div className="h-44">
                        <PropertyMediaCover
                          name={hostel.name}
                          photos={hostel.photos}
                          videos={hostel.videos}
                        />
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-bold text-white/85">
                          {hostel.status === "verified" ? "Verified hostel" : "Hostel listing"}
                        </p>
                        <h3 className="mt-2 font-display text-lg font-extrabold">{hostel.name}</h3>
                        <p className="mt-1 text-sm text-white/85">{hostel.area}, {hostel.city}</p>
                        <p className="mt-4 text-sm font-bold">
                          {lowestPrice ? `From ₦${lowestPrice.toLocaleString()}` : "Price pending"}
                        </p>
                        <span className="mt-4 inline-flex text-xs font-bold text-[#a36500]">
                          View hostel <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-12 rounded-2xl border border-dashed border-white/20 bg-white/[.04] p-12 text-center">
                <Search className="mx-auto h-8 w-8 text-[#f5b544]" />
                <h3 className="mt-5 font-display text-2xl font-extrabold">
                  Verified inventory is coming soon.
                </h3>
                <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-6 text-white/75 font-poppins">
                  Once property partners are connected and verified, available rooms will appear here for everyone to explore.
                </p>
                <Link
                  to="/find-a-hostel"
                  className="mt-6 inline-flex rounded-full bg-[#f5b544] px-5 py-3 text-[14px] font-bold text-black"
                >
                  Open search <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </section>
        <section
          className="mx-auto grid max-w-[1240px] scroll-mt-[74px] gap-14 px-5 py-24 lg:grid-cols-[.75fr_1.25fr] lg:px-8"
          id="how"
        >
          <div>
            <p className="eyebrow text-[13px] font-[490]">Simple by design</p>
            <h2 className="section-title mt-3 md:text-[45px] text-[25px]">
              From search
              <br />
              to move-in.
            </h2>
            <p className="mt-5 max-w-[350px] text-[15px] leading-6 text-black/75">
              No endless tabs, confusing listings or surprise costs. Just a
              clear path to a place you’re happy to call home.
            </p>
          </div>
          <div>
            {[
              [
                "01",
                "Tell us what you need",
                "Choose your university, budget, preferred location and room type.",
              ],
              [
                "02",
                "Explore your options",
                "Compare verified hostels, rooms, amenities, prices and availability.",
              ],
              [
                "03",
                "Reserve your space",
                "Submit your application or reserve an available room.",
              ],
              [
                "04",
                "Move in with confidence",
                "Complete payment and manage your stay through arc().",
              ],
            ].map(([number, title, text], index) => (
              <div className="process-row" key={number}>
                <span className="process-number">{number}</span>
                <div>
                  <h3 className="font-display text-[16px] font-[500]">
                    {title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-6 text-black/55">{text}</p>
                </div>
                <ChevronDown
                  className={`ml-auto h-5 w-5 text-black/25 ${index === 3 ? "hidden" : ""}`}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="scroll-mt-[74px] overflow-hidden bg-[#f5b544]" id="owners">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="eyebrow text-[12px]">For hostel owners</p>
              <h2 className="section-title mt-3 md:text-[45px] text-[25px]">
                Fill your hostel
                <br />
                with the{" "}
                <span className="underline decoration-2 underline-offset-8">
                  right
                </span>{" "}
                students.
              </h2>
              <p className="mt-5 max-w-[450px] text-[14.5px] leading-6 text-black/85">
                List your property, manage available spaces and reach students
                looking for accommodation near their university.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold">
                {[
                  "Create property listings",
                  "Manage rooms and beds",
                  "Track occupancy",
                  "Receive applications",
                ].map((item) => (
                  <span key={item}>
                    <Check className="mr-1 inline h-4 w-4" />
                    {item}
                  </span>
                ))}
              </div>
              {isOwner && (
                <Link
                  to="/owner/properties/new"
                  className="mt-9 inline-flex rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white"
                >
                  List your hostel <ArrowRight className="ml-2 inline h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="relative h-[300px] rounded-[28px] bg-[#151515] p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <span className="font-display font-bold">
                  Property overview
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                  Data ready
                </span>
              </div>
              <div className="mt-7 rounded-xl bg-white/5 p-5 text-[14.5px] text-white/55">
                Your rooms, beds, applications and occupancy metrics will appear
                here after a property is created.
              </div>
              {isOwner && (
                <Link
                  to="/owner/dashboard"
                  className="mt-6 inline-flex rounded-full bg-[#f5b544] px-4 py-3 text-xs font-bold text-black"
                >
                  Open owner workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
        <section className="bg-[#151515] px-5 py-24 text-center text-white">
          <div className="mx-auto max-w-[740px]">
            
            <h2 className="mt-7 font-display text-[clamp(2.5rem,6vw,3.5rem)] font-extrabold leading-[.92] tracking-[-.07em]">
              Your next room is
              <br />
              <span className="text-[#f5b544]">closer than you think.</span>
            </h2>
            <p className="mx-auto mt-5 text-[14.5px] text-white/95">
              Search. Compare. Reserve. Move in.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              {!isOwner && <Link to="/find-a-hostel" className="rounded-full bg-[#f5b544] px-8 py-3.5 text-[14px] font-bold text-black">Find a hostel</Link>}
              {isOwner && (
                <Link
                  to="/owner/properties/new"
                  className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold"
                >
                  List your hostel
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#151515] px-5 pb-8 text-white lg:px-8">
        <div className="mx-auto max-w-[1240px] border-t border-white/15 pt-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="font-display text-2xl font-extrabold tracking-[-.08em]">
                <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
              </div>
              <p className="mt-4 max-w-[220px] text-sm leading-6 text-white/45">
                Helping students find better places to live.
              </p>
            </div>
            {[
              [
                "FOR STUDENTS",
                ["Find hostels", "Saved hostels", "My bookings", "Help center"],
              ],
              [
                "FOR HOSTEL OWNERS",
                [
                  "List your hostel",
                  "Manage properties",
                  "Manage bookings",
                  "Pricing",
                ],
              ],
              ["COMPANY", ["About", "How it works", "Contact", "Safety"]],
            ].filter(([title]) => isOwner || title !== "FOR HOSTEL OWNERS").map(([title, links]) => (
              <div key={title as string}>
                <p className="text-[11px] font-bold tracking-widest text-white/35">
                  {title as string}
                </p>
                <div className="mt-4 space-y-3 text-sm text-white/65">
                  {(links as string[]).map((link) => (
                    <p key={link}>{link}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/35 sm:flex-row">
            <span>© 2026 arc()</span>
            <span>Privacy · Terms · Safety</span>
          </div>
        </div>
      </footer>
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
