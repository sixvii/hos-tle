import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  ChevronDown,
  Heart,
  List,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import PropertyMediaCover from "@/components/PropertyMediaCover";
import {
  getProfileInitial,
  getStoredProfilePhoto,
  getStoredSession,
  searchHostels,
  type BackendProperty,
} from "@/lib/api";

export type HostelSearchResult = {
  id: string;
  name: string;
  location: string;
  university: string;
  distanceKm: number;
  roomTypes: string[];
  startingPrice: number;
  amenities: string[];
  availableSpaces: number;
  verified: boolean;
  images: string[];
  videos: string[];
};

type Filters = {
  room: string;
  distance: string;
  availability: string;
  verified: boolean;
};
type SearchState = "idle" | "loading" | "empty" | "error";
const defaultFilters: Filters = {
  room: "Any room type",
  distance: "Within 5 km",
  availability: "Available now",
  verified: false,
};

function toSearchResult(property: BackendProperty): HostelSearchResult {
  const roomTypes = property.rooms.map((room) => room.name);
  return {
    id: property.id,
    name: property.name,
    location: `${property.area}, ${property.city}`,
    university: property.university,
    distanceKm: Number.parseFloat(property.distance) || 0,
    roomTypes,
    startingPrice: Math.min(...property.rooms.map((room) => room.price)),
    amenities: property.amenities,
    availableSpaces: property.rooms.reduce(
      (total, room) => total + room.beds * (room.availableUnits ?? room.units ?? 1),
      0,
    ),
    verified: property.status === "verified",
    images: property.photos,
    videos: property.videos ?? [],
  };
}

export default function FindHostel() {
  const [params, setParams] = useSearchParams();
  const [mapView, setMapView] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState(params.get("sort") || "Recommended");
  const [university, setUniversity] = useState(params.get("university") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [moveIn, setMoveIn] = useState(params.get("moveIn") || "");
  const [budget, setBudget] = useState(params.get("budget") || "");
  const [filters, setFilters] = useState<Filters>({
    room: params.get("room") || defaultFilters.room,
    distance: params.get("distance") || defaultFilters.distance,
    availability: params.get("availability") || defaultFilters.availability,
    verified: params.get("verified") === "true",
  });
  const [savedSearch, setSavedSearch] = useState(false);
  const [results, setResults] = useState<HostelSearchResult[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const visibleResults = useMemo(() => {
    const budgetLimit = Number(budget);
    return results
      .filter((result) => !budgetLimit || result.startingPrice <= budgetLimit)
      .filter((result) => !filters.verified || result.verified)
      .sort((a, b) =>
        sort === "Price: low to high"
          ? a.startingPrice - b.startingPrice
          : sort === "Distance"
            ? a.distanceKm - b.distanceKm
            : a.name.localeCompare(b.name),
      );
  }, [budget, filters.verified, results, sort]);

  const clear = () => {
    setUniversity("");
    setLocation("");
    setMoveIn("");
    setBudget("");
    setFilters(defaultFilters);
    setSavedSearch(false);
    setResults([]);
    setState("idle");
    setParams({});
  };
  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    const next = new URLSearchParams();
    if (university) next.set("university", university);
    if (location) next.set("location", location);
    if (moveIn) next.set("moveIn", moveIn);
    if (budget) next.set("budget", budget);
    if (filters.room !== defaultFilters.room) next.set("room", filters.room);
    if (filters.distance !== defaultFilters.distance)
      next.set("distance", filters.distance);
    if (filters.availability !== defaultFilters.availability)
      next.set("availability", filters.availability);
    if (filters.verified) next.set("verified", "true");
    if (sort !== "Recommended") next.set("sort", sort);
    setParams(next);
    setState("loading");
    try {
      const properties = await searchHostels({
        university,
        location,
        room: filters.room,
        verified: filters.verified,
      });
      const nextResults = properties.map(toSearchResult);
      setResults(nextResults);
      setState(nextResults.length ? "idle" : "empty");
    } catch {
      setResults([]);
      setState("error");
    }
  };

  useEffect(() => {
    void search();
    // Search state is initialized from the URL once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171717]">
      <Header />
      <main className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
       
        <h1 className="font-display text-[clamp(2.6rem,5vw,2.8rem)] font-extrabold leading-none tracking-[-.07em]">
          Find your next <span className="text-[#e5a32d]">home.</span>
        </h1>
        <p className="mt-4 max-w-[480px] text-[15px] leading-6 text-black/65">
          Search trusted accommodation around your university and compare the
          details that matter most.
        </p>
        <form
          onSubmit={search}
          className="mt-8 rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
        >
          <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
            <Field label="University">
              <input
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                placeholder="Where do you study?"
              />
            </Field>
            <Field label="Location" icon={<MapPin />}>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City or area"
              />
            </Field>
            <Field label="Move-in">
              <input
                type="date"
                value={moveIn}
                onChange={(event) => setMoveIn(event.target.value)}
              />
            </Field>
            <Field label="Room type" icon={<BedDouble />}>
              <select
                value={filters.room}
                onChange={(event) =>
                  setFilters({ ...filters, room: event.target.value })
                }
              >
                <option className='text-black/45 text-[12px]'>Any room type</option>
                <option>Single</option>
                <option>Shared</option>
                <option>Studio</option>
              </select>
            </Field>
            <Field label="Max budget">
              <input
                value={budget}
                onChange={(event) =>
                  setBudget(event.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder=""
                inputMode="numeric"
              />
            </Field>
            <button
              type="submit"
              disabled={state === "loading"}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#f5b544] px-5 py-3 text-[14px] font-[500]"
            >
              {state === "loading" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {state === "loading" ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
        <div className="mt-10 flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-extrabold">
              Verified inventory
            </h2>
            <p className="mt-1 text-xs text-black/45">
              {visibleResults.length
                ? `${visibleResults.length} verified ${visibleResults.length === 1 ? "property" : "properties"}`
                : "Search results will appear here · Live availability"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedSearch(!savedSearch)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${savedSearch ? "border-[#f5b544] bg-[#fff4d6]" : "border-black/15"}`}
            >
              <Heart
                className={`h-4 w-4 ${savedSearch ? "fill-[#f5b544]" : ""}`}
              />{" "}
              {savedSearch ? "Search saved" : "Save search"}
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs font-bold lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs font-bold"
              >
                Sort: {sort}
                <ChevronDown className="h-4 w-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-black/10 bg-white p-1 shadow-xl">
                  {["Recommended", "Price: low to high", "Distance"].map(
                    (option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => {
                          setSort(option);
                          setSortOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-[#f7f6f3]"
                      >
                        {option}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            <div className="flex rounded-full border border-black/15 p-1">
              <button
                type="button"
                aria-label="List view"
                onClick={() => setMapView(false)}
                className={`rounded-full p-2 ${!mapView ? "bg-black text-white" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Map view"
                onClick={() => setMapView(true)}
                className={`rounded-full p-2 ${mapView ? "bg-black text-white" : ""}`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-[220px_1fr]">
          <FilterPanel
            open={filtersOpen}
            filters={filters}
            setFilters={setFilters}
            close={() => setFiltersOpen(false)}
          />
          <section>
            {state === "loading" ? (
              <Loading />
            ) : state === "error" ? (
              <ErrorState retry={() => search()} />
            ) : state === "empty" || !visibleResults.length ? (
              <Empty clear={clear} />
            ) : mapView ? (
              <MapResults results={visibleResults} />
            ) : (
              <div className="results-reveal grid gap-4 md:grid-cols-2">
                {visibleResults.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Header() {
  const session = getStoredSession();
  const isOwner = session?.user.role === "owner";
  const profilePhoto = session ? getStoredProfilePhoto(session.user.id) : "";
  const profilePath = isOwner ? "/owner/dashboard" : "/dashboard";
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#faf9f7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          className="font-display text-[25px] font-extrabold tracking-[-.08em]"
        >
          <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium lg:flex">
          <Link to="/" className="hover:text-[#a36500]">
            Home
          </Link>
          <span className="font-bold text-[#a36500]">Find hostels</span>
          <Link to="/universities" className="hover:text-[#a36500]">
            Universities
          </Link>
          <Link to="/how-it-works" className="hover:text-[#a36500]">
            How it works
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              to={profilePath}
              aria-label="Open your profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black text-xs font-bold text-white"
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
            <Link
              to="/login"
              className="hidden px-3 text-[13px] font-semibold sm:block"
            >
              Log in
            </Link>
          )}
          {isOwner && (
            <Link
              to="/owner/dashboard"
              className="rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white"
            >
              List your hostel
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="search-field">
      {icon ?? <span className="w-4" />}
      <span>
        <small>{label}</small>
        {children}
      </span>
    </label>
  );
}
function FilterPanel({
  open,
  filters,
  setFilters,
  close,
}: {
  open: boolean;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  close: () => void;
}) {
  return (
    <aside
      className={`${open ? "block" : "hidden lg:block"} rounded-2xl border border-black/10 bg-white p-5 lg:h-fit`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display font-extrabold">Filters</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilters(defaultFilters)}
            className="text-xs font-semibold text-[#a36500]"
          >
            Clear all
          </button>
          {open && (
            <button type="button" onClick={close} className="lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <FilterSelect
        label="Room type"
        value={filters.room}
        options={["Any room type", "Single", "Shared", "Studio"]}
        onChange={(value) => setFilters({ ...filters, room: value })}
      />
      <FilterSelect
        label="Distance"
        value={filters.distance}
        options={["Within 5 km", "Within 2 km"]}
        onChange={(value) => setFilters({ ...filters, distance: value })}
      />
      <FilterSelect
        label="Availability"
        value={filters.availability}
        options={["Available now", "Any availability"]}
        onChange={(value) => setFilters({ ...filters, availability: value })}
      />
      <label className="flex items-center gap-3 border-t border-black/10 py-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={filters.verified}
          onChange={(event) =>
            setFilters({ ...filters, verified: event.target.checked })
          }
          className="h-4 w-4 accent-[#f5b544]"
        />{" "}
        Verified only
      </label>
    </aside>
  );
}
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t border-black/10 py-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 text-black/40 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <p className="mt-2 text-xs text-black/45">{value}</p>
      {expanded && (
        <div className="mt-2 space-y-1">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => {
                onChange(option);
                setExpanded(false);
              }}
              className={`block w-full rounded-lg px-2 py-2 text-left text-xs ${value === option ? "bg-[#fff4d6] font-bold" : "hover:bg-[#f7f6f3]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ResultCard({ result }: { result: HostelSearchResult }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-52 bg-[#e8e2d7]">
        <PropertyMediaCover
          name={result.name}
          photos={result.images}
          videos={result.videos}
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-[#8a5d00]">
          {result.verified ? "Verified" : "Under review"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-extrabold tracking-[-.04em]">
              {result.name}
            </h3>
            <p className="mt-1 text-xs text-black/50">
              <MapPin className="mr-1 inline h-3 w-3" />
              {result.location}
            </p>
          </div>
          <p className="whitespace-nowrap text-sm font-extrabold">
            ₦{result.startingPrice.toLocaleString()}
            <span className="text-[10px] font-medium text-black/45">
              {" "}
              / session
            </span>
          </p>
        </div>
        <p className="mt-4 text-xs text-black/50">
          Near {result.university}
          {result.distanceKm ? ` · ${result.distanceKm} km away` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.roomTypes.slice(0, 3).map((room) => (
            <span
              key={room}
              className="rounded-full bg-[#f7f6f3] px-2.5 py-1 text-[10px] font-semibold"
            >
              {room}
            </span>
          ))}
        </div>
        <Link
          to={`/hostels/${result.id}`}
          className="mt-5 block rounded-full bg-black py-3 text-center text-xs font-bold text-white"
        >
          View property
        </Link>
      </div>
    </article>
  );
}
function MapResults({ results }: { results: HostelSearchResult[] }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-black/10 bg-[#e8e2d7] p-4 md:grid-cols-[1fr_280px]">
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-dashed border-black/20 bg-[#ded6c9] p-8 text-center">
        <div>
          <MapPin className="mx-auto h-8 w-8 text-[#a36500]" />
          <h2 className="mt-3 font-display text-xl font-extrabold">
            Map coordinates pending
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-black/50">
            Verified properties are available. Map pins will appear when
            location coordinates are connected.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {results.map((result) => (
          <Link
            key={result.id}
            to={`/hostels/${result.id}`}
            className="block rounded-xl bg-white p-4"
          >
            <p className="font-display font-extrabold">{result.name}</p>
            <p className="mt-1 text-xs text-black/50">{result.location}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
function Empty({ clear }: { clear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/20 bg-white p-12 text-center text-black sm:p-14">
      <Search className="mx-auto h-8 w-8 text-black/35" />
      <h2 className="mt-4 font-display text-xl font-extrabold text-black">
        No hostels match this search yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">
        Try changing the university, location, room type, or budget. Owner
        listings appear here as soon as they are available from the marketplace.
      </p>
      <button
        type="button"
        onClick={clear}
        className="mt-5 rounded-full bg-white px-5 py-3 text-xs font-bold text-black"
      >
        Clear search
      </button>
    </div>
  );
}
function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-black/10 bg-white"
        >
          <div className="h-52 bg-black/10" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 rounded bg-black/10" />
            <div className="h-3 w-1/2 rounded bg-black/10" />
            <div className="h-10 rounded bg-black/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#e5b4b4] bg-white p-12 text-center">
      <RefreshCw className="mx-auto h-8 w-8 text-[#a52a2a]" />
      <h2 className="mt-4 font-display text-xl font-extrabold">
        Search could not load
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">
        We could not load verified accommodation. Try again when the marketplace
        connection is available.
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-5 rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
