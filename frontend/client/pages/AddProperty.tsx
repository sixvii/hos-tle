import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createProperty, getOwnerProperties, getStoredSession, getStoredSessionToken, updateProperty, uploadImageToCloudinary, uploadVideoToCloudinary } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  CheckCircle2,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Wifi,
  X,
  Zap,
} from "lucide-react";

type Room = { name: string; beds: number; units: number; price: string };
type PropertyDetails = {
  name: string;
  description: string;
  city: string;
  area: string;
  university: string;
  distance: string;
};
type PropertyDraft = {
  step: number;
  property: PropertyDetails;
  photos: string[];
  videos: string[];
  amenities: string[];
  rooms: Room[];
};

const steps = ["Property", "Photos", "Amenities", "Rooms", "Publish"];
const amenityOptions = [
  [Wifi, "Wi-Fi"],
  [Zap, "Power backup"],
  [ShieldCheck, "Security"],
  [Bath, "Laundry"],
  [Building2, "Study area"],
  [BedDouble, "Furnished"],
] as const;
const draftKey = (ownerId: string) => `arc-property-draft:${ownerId}`;
const emptyProperty: PropertyDetails = {
  name: "",
  description: "",
  city: "",
  area: "",
  university: "",
  distance: "",
};

function readDraft(ownerId?: string): PropertyDraft | null {
  if (!ownerId) return null;
  try {
    const saved = window.localStorage.getItem(draftKey(ownerId));
    if (!saved) return null;
    const value = JSON.parse(saved) as Partial<PropertyDraft> & {
      amenities?: string[];
      status?: string;
    };
    return {
      step: value.status ? 5 : (value.step ?? 1),
      property: { ...emptyProperty, ...value.property },
      photos: value.photos ?? [],
      videos: value.videos ?? [],
      amenities: value.amenities ?? [],
      rooms: (value.rooms ?? []).map((room) => ({ ...room, units: room.units ?? 1 })),
    };
  } catch {
    return null;
  }
}

function PropertyHeader() {
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex h-[74px] max-w-[1100px] items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          className="font-display text-[25px] font-extrabold tracking-[-.08em]"
        >
          <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-3">
         
          <Link
            to="/owner/dashboard"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
          >
            Save & exit
          </Link>
        </div>
      </div>
    </header>
  );
}

function PropertyStep({
  value,
  onChange,
}: {
  value: PropertyDetails;
  onChange: (value: PropertyDetails) => void;
}) {
  const update = (key: keyof PropertyDetails, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <div>
      <p className="eyebrow">Step 1 of 5</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Tell us about your property.
      </h1>
      <p className="mt-2 text-sm text-black/50">
        Students use these details to decide if your place is right for them.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-bold sm:col-span-2">
          Property name
          <input
            required
            value={value.name}
            onChange={(event) => update("name", event.target.value)}
            className="auth-input"
            placeholder="e.g. Greenfield Residence"
          />
        </label>
        <label className="text-xs font-bold sm:col-span-2">
          Description
          <textarea
            required
            value={value.description}
            onChange={(event) => update("description", event.target.value)}
            className="mt-1 h-28 w-full rounded-xl border border-black/15 p-3 text-sm outline-none"
            placeholder="What makes your hostel special?"
          />
        </label>
        <label className="text-xs font-bold">
          City
          <input
            required
            value={value.city}
            onChange={(event) => update("city", event.target.value)}
            className="auth-input"
            placeholder="Lagos"
          />
        </label>
        <label className="text-xs font-bold">
          Area
          <input
            required
            value={value.area}
            onChange={(event) => update("area", event.target.value)}
            className="auth-input"
            placeholder="Yaba"
          />
        </label>
        <label className="text-xs font-bold sm:col-span-2">
          Universities nearby
          <textarea
            required
            value={value.university}
            onChange={(event) => update("university", event.target.value)}
            className="mt-1 h-24 w-full rounded-xl border border-black/15 p-3 text-sm outline-none"
            placeholder="University of Lagos, Yaba College of Technology"
          />
          <span className="mt-1 block text-[11px] font-normal text-black/45">Enter the names of nearby universities, separated by commas.</span>
        </label>
        <label className="text-xs font-bold">
          Distance from campus
          <input
            value={value.distance}
            onChange={(event) => update("distance", event.target.value)}
            className="auth-input"
            placeholder="2.4 km"
          />
        </label>
      </div>
    </div>
  );
}

function PhotosStep({
  photos,
  setPhotos,
  videos,
  setVideos,
}: {
  photos: string[];
  setPhotos: (next: string[] | ((current: string[]) => string[])) => void;
  videos: string[];
  setVideos: (next: string[] | ((current: string[]) => string[])) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const addMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const token = getStoredSessionToken();
    if (!token)
      return setUploadError(
        "Log in as an owner before uploading property media.",
      );
    setUploadError("");
    setUploading(true);
    try {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const url = await uploadImageToCloudinary(file, token);
          setPhotos((current) => [...current, url]);
        } else if (file.type.startsWith("video/")) {
          const url = await uploadVideoToCloudinary(file, token);
          setVideos((current) => [...current, url]);
        } else {
          throw new Error("Choose image or video files only.");
        }
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Cloudinary could not upload this file.",
      );
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <p className="eyebrow">Step 2 of 5</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Show students around.
      </h1>
      <p className="mt-2 text-sm text-black/50">
        Add photos or videos of the rooms and shared spaces. Media is stored
        securely in Cloudinary.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label
          className={`flex h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#f5b544] bg-[#fff9e9] text-xs font-bold ${uploading ? "cursor-wait opacity-60" : ""}`}
        >
          <ImagePlus className="mb-2 h-6 w-6 text-[#a36500]" />
          {uploading
            ? "Uploading..."
            : photos.length || videos.length
              ? "Add more media"
              : "Add photos or videos"}
          <input
            disabled={uploading}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={addMedia}
            className="hidden"
          />
        </label>
        {photos.map((photo, index) => (
          <div className="relative h-36 overflow-hidden rounded-xl" key={photo}>
            <img
              src={photo}
              alt={`Property photo ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                setPhotos((current) =>
                  current.filter((_, photoIndex) => photoIndex !== index),
                )
              }
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {videos.map((video, index) => (
          <div className="relative h-36 overflow-hidden rounded-xl" key={video}>
            <video
              src={video}
              aria-label={`Property video ${index + 1}`}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                setVideos((current) =>
                  current.filter((_, videoIndex) => videoIndex !== index),
                )
              }
              aria-label={`Remove property video ${index + 1}`}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {uploadError && (
        <p
          className="mt-4 rounded-xl bg-[#fff0f0] px-3 py-2 text-xs font-semibold text-[#a52a2a]"
          role="alert"
        >
          {uploadError}
        </p>
      )}
      {photos.length + videos.length === 0 && (
        <p className="mt-4 text-xs text-[#a36500]">
          Add at least one photo or video to continue.
        </p>
      )}
    </div>
  );
}

function AmenitiesStep({
  selected,
  toggle,
}: {
  selected: string[];
  toggle: (name: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow">Step 3 of 5</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        What does your hostel include?
      </h1>
      <p className="mt-2 text-sm text-black/50">
        Select everything students can expect at the property.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {amenityOptions.map(([Icon, name]) => (
          <button
            type="button"
            onClick={() => toggle(name)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-bold ${selected.includes(name) ? "border-[#f5b544] bg-[#fff9e9]" : "border-black/10"}`}
            key={name}
          >
            <span className="rounded-lg bg-[#f5b544]/25 p-2">
              <Icon className="h-4 w-4" />
            </span>
            {name}
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-black/15">
              {selected.includes(name) && <Check className="h-3 w-3" />}
            </span>
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="mt-4 text-xs text-[#a36500]">
          Select at least one amenity to continue.
        </p>
      )}
    </div>
  );
}

function RoomsStep({
  rooms,
  setRooms,
}: {
  rooms: Room[];
  setRooms: (next: Room[]) => void;
}) {
  const update = (index: number, field: keyof Room, value: string | number) =>
    setRooms(
      rooms.map((room, roomIndex) =>
        roomIndex === index ? { ...room, [field]: value } : room,
      ),
    );
  return (
    <div>
      <p className="eyebrow">Step 4 of 5</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Add room types and available units.
      </h1>
      <p className="mt-2 text-sm text-black/50">
        Set how many rooms of each type are available to rent and how many beds each unit contains.
      </p>
      <div className="mt-8 space-y-3">
        {rooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/20 bg-[#faf9f7] p-8 text-center">
            <BedDouble className="mx-auto h-7 w-7 text-black/30" />
            <p className="mt-3 text-sm font-bold">No rooms added yet</p>
            <p className="mt-1 text-xs text-black/45">
              Add at least one room type before publishing.
            </p>
          </div>
        )}
        {rooms.map((room, index) => (
          <div
            className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-[1fr_90px_110px_140px_auto] sm:items-end"
            key={index}
          >
            <label className="text-xs font-bold">
              Room type
              <input
                required
                value={room.name}
                onChange={(event) => update(index, "name", event.target.value)}
                className="auth-input"
                placeholder="e.g. Single room"
              />
            </label>
            <label className="text-xs font-bold">
              Beds
              <input
                required
                type="number"
                min="1"
                value={room.beds || ""}
                onChange={(event) =>
                  update(index, "beds", Number(event.target.value))
                }
                className="auth-input"
              />
            </label>
            <label className="text-xs font-bold">
              Units available
              <input
                required
                type="number"
                min="0"
                value={room.units ?? 1}
                onChange={(event) =>
                  update(index, "units", Number(event.target.value))
                }
                className="auth-input"
              />
            </label>
            <label className="text-xs font-bold">
              Price / session
              <input
                required
                value={room.price}
                onChange={(event) => update(index, "price", event.target.value)}
                className="auth-input"
                placeholder="₦450,000"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setRooms(rooms.filter((_, roomIndex) => roomIndex !== index))
              }
              className="rounded-full border border-black/15 p-3 text-black/45"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRooms([...rooms, { name: "", beds: 1, units: 1, price: "" }])}
          className="rounded-full border border-black/15 px-4 py-3 text-xs font-bold"
        >
          + Add room type
        </button>
      </div>
    </div>
  );
}

function PreviewStep({
  property,
  photos,
  videos,
  selected,
  rooms,
}: {
  property: PropertyDetails;
  photos: string[];
  videos: string[];
  selected: string[];
  rooms: Room[];
}) {
  return (
    <div>
      <p className="eyebrow">Step 5 of 5</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Preview your listing.
      </h1>
      <p className="mt-2 text-sm text-black/50">
        Review your property before sending it for verification.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-black/10">
        {photos[0] ? (
          <img
            src={photos[0]}
            alt="Property preview"
            className="h-48 w-full object-cover"
          />
        ) : videos[0] ? (
          <video
            src={videos[0]}
            controls
            playsInline
            preload="metadata"
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 bg-[#e8e2d7]" />
        )}
        <div className="p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h2 className="font-display text-2xl font-extrabold">
                {property.name || "Your new property"}
              </h2>
              <p className="mt-1 text-xs text-black/50">
                <MapPin className="mr-1 inline h-3 w-3" />
                {property.city || "City"} · {property.area || "Area"}
              </p>
            </div>
            <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-xs font-bold text-[#996b00]">
              Draft
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-black/55">
            {property.description || "Add a description for students."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {selected.map((item) => (
              <span
                className="rounded-full bg-[#f7f6f3] px-3 py-1.5 text-xs font-semibold"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs text-black/50">
            {rooms.length} room types · {rooms.reduce((sum, room) => sum + (room.units ?? 1), 0)} total units ·{" "}
            {rooms.reduce((sum, room) => sum + room.beds * (room.units ?? 1), 0)} total beds ·{" "}
            {photos.length + videos.length} media items
          </p>
        </div>
      </div>
    </div>
  );
}

function Success() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#171717]">
      <main className="mx-auto flex min-h-screen max-w-[620px] items-center justify-center px-5">
        <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dff3e6] text-[#16733b]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="eyebrow mt-6">Property submitted</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">
            You’re ready to welcome students.
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/55">
            Your property is now in review. We’ll notify you when verification
            is complete.
          </p>
          <Link
            to="/owner/dashboard"
            className="mt-7 block rounded-full bg-black py-3.5 text-sm font-bold text-white"
          >
            Back to owner dashboard{" "}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function AddProperty() {
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const continueDraft = params.get("draft") === "1";
  const session = getStoredSession();
  const ownerId = session?.user.id;
  const saved = continueDraft ? readDraft(ownerId) : null;
  const [step, setStep] = useState(saved?.step ?? 1);
  const [property, setProperty] = useState<PropertyDetails>(
    saved?.property ?? emptyProperty,
  );
  const [photos, setPhotos] = useState<string[]>(saved?.photos ?? []);
  const [videos, setVideos] = useState<string[]>(saved?.videos ?? []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    saved?.amenities ?? [],
  );
  const [rooms, setRooms] = useState<Room[]>(saved?.rooms ?? []);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!editId || saved) return;
    const token = getStoredSessionToken();
    if (!token) return;
    getOwnerProperties(token).then((properties) => {
      const existing = properties.find((item) => item.id === editId);
      if (!existing) return;
      setProperty({
        name: existing.name,
        description: existing.description,
        city: existing.city,
        area: existing.area,
        university: existing.university,
        distance: existing.distance,
      });
      setPhotos(existing.photos);
      setVideos(existing.videos ?? []);
      setSelectedAmenities(existing.amenities);
      setRooms(existing.rooms.map((room) => ({ ...room, units: room.units ?? 1, price: String(room.price) })));
      setStep(5);
    }).catch(() => setError("The property could not be loaded for editing."));
  }, [editId, saved]);

  useEffect(() => {
    window.localStorage.setItem(
      draftKey(ownerId ?? "unknown"),
      JSON.stringify({
        step,
        property,
        photos,
        videos,
        amenities: selectedAmenities,
        rooms,
      } satisfies PropertyDraft),
    );
  }, [property, photos, videos, rooms, selectedAmenities, step]);

  const toggleAmenity = (name: string) =>
    setSelectedAmenities((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  const validate = () => {
    if (
      step === 1 &&
      (!property.name.trim() ||
        !property.description.trim() ||
        !property.city.trim() ||
        !property.area.trim() ||
        !property.university.trim())
    )
      return "Complete the required property details before continuing.";
    if (step === 2 && photos.length + videos.length === 0)
      return "Add at least one property photo or video before continuing.";
    if (step === 3 && selectedAmenities.length === 0)
      return "Select at least one amenity before continuing.";
    if (
      step === 4 &&
      (rooms.length === 0 ||
        rooms.some(
          (room) => !room.name.trim() || room.beds < 1 || room.units < 0 || !room.price.trim(),
        ))
    )
      return "Add a complete room type with a name, bed count, and price.";
    return "";
  };
  const next = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validate();
    if (validation) return setError(validation);
    setError("");
    if (step < 5) return setStep((current) => current + 1);
    const token = getStoredSessionToken();
    if (!token) return setError("Log in as an owner before publishing a property.");
    setPublishing(true);
    try {
      const input = {
        ...property,
        photos,
        videos,
        amenities: selectedAmenities,
        rooms: rooms.map((room) => ({ ...room, price: Number(room.price.replace(/[^0-9.]/g, "")) })),
      };
      const created = editId
        ? await updateProperty(editId, input, token)
        : await createProperty(input, token);
      window.dispatchEvent(new Event("properties-updated"));
      window.localStorage.removeItem(draftKey(ownerId ?? "unknown"));
      setPublished(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "The property could not be published.");
    } finally {
      setPublishing(false);
    }
  };
  if (published) return <Success />;
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#171717]">
      <PropertyHeader />
      <main className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8">
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to owner dashboard
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <section>
            <p className="eyebrow">List your property</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-[.98] tracking-[-.06em] sm:text-6xl">
              Give students
              <br />
              somewhere to belong.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">
              Complete the essentials now. You can refine your listing after it
              has been submitted for verification.
            </p>
            <form
              onSubmit={next}
              className="mt-9 rounded-2xl border border-black/10 bg-white p-5 sm:p-8"
            >
              <div className="mb-8 grid grid-cols-5 gap-2">
                {steps.map((label, index) => (
                  <div key={label}>
                    <div
                      className={`h-1 rounded-full ${index + 1 <= step ? "bg-[#f5b544]" : "bg-black/10"}`}
                    />
                    <p
                      className={`mt-2 truncate text-[10px] font-bold uppercase tracking-[.08em] ${index + 1 <= step ? "text-black" : "text-black/35"}`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              {error && (
                <div
                  className="mb-6 rounded-xl border border-[#dcae4d] bg-[#fff7e3] px-4 py-3 text-xs font-semibold text-[#7a5200]"
                  role="alert"
                >
                  {error}
                </div>
              )}
              {step === 1 && (
                <PropertyStep value={property} onChange={setProperty} />
              )}
              {step === 2 && (
                <PhotosStep
                  photos={photos}
                  setPhotos={setPhotos}
                  videos={videos}
                  setVideos={setVideos}
                />
              )}
              {step === 3 && (
                <AmenitiesStep
                  selected={selectedAmenities}
                  toggle={toggleAmenity}
                />
              )}
              {step === 4 && <RoomsStep rooms={rooms} setRooms={setRooms} />}
              {step === 5 && (
                <PreviewStep
                  property={property}
                  photos={photos}
                  videos={videos}
                  selected={selectedAmenities}
                  rooms={rooms}
                />
              )}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-black/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep((current) => Math.max(1, current - 1));
                  }}
                  className={`rounded-full border border-black/15 px-5 py-3 text-xs font-bold ${step === 1 ? "invisible" : ""}`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {publishing
                    ? "Submitting…"
                    : step === 5
                      ? "Submit for review"
                      : "Continue"}{" "}
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              </div>
            </form>
          </section>
          <aside className="h-fit rounded-2xl bg-black p-6 text-white lg:sticky lg:top-8">
            <p className="eyebrow text-white/45">Listing checklist</p>
            <div className="mt-5 space-y-4 text-xs">
              {[
                [
                  "Property details",
                  property.name &&
                    property.description &&
                    property.city &&
                    property.area &&
                    property.university,
                ],
                ["Property media", photos.length + videos.length > 0],
                ["Amenities", selectedAmenities.length > 0],
                [
                  "Rooms & beds",
                  rooms.length > 0 &&
                    rooms.every(
                      (room) => room.name && room.beds > 0 && room.price,
                    ),
                ],
              ].map(([label, complete]) => (
                <div className="flex items-center gap-3" key={String(label)}>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${complete ? "bg-[#74d69a] text-black" : "border border-white/20 text-white/35"}`}
                  >
                    {complete && <Check className="h-3 w-3" />}
                  </span>
                  <span className={complete ? "text-white" : "text-white/45"}>
                    {String(label)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-xl bg-white/5 p-4 text-xs leading-5 text-white/55">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-[#74d69a]" />{" "}
              Your listing stays in draft until you submit it for verification.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
