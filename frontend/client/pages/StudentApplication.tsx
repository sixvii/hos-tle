import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  createApplication,
  getHostel,
  getMyApplications,
  getStoredSession,
  getStoredProfilePhoto,
  getStoredSessionToken,
  uploadDocumentToCloudinary,
  type BackendProperty,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Home,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

type RoomOption = {
  id: string;
  name: string;
  price: string;
  units: number;
  description: string;
};

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
};

const defaultRooms: RoomOption[] = [
  {
    id: "single",
    name: "Single room",
    price: "₦450,000",
    units: 1,
    description: "A private furnished room for focused university life.",
  },
  {
    id: "shared",
    name: "4-bed shared room",
    price: "₦220,000",
    units: 1,
    description:
      "An affordable shared room with one space currently available.",
  },
];

const storageKey = "arc.student.application";
const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  more_information: "More information",
};
const statusClasses: Record<ApplicationStatus, string> = {
  submitted: "bg-[#fff4d6] text-[#8a5d00]",
  under_review: "bg-[#fff4d6] text-[#8a5d00]",
  approved: "bg-[#dff3e6] text-[#16733b]",
  rejected: "bg-[#ffe3e3] text-[#a52a2a]",
  more_information: "bg-[#eee8ff] text-[#6345a3]",
};

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
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function Header() {
  return (
    <header className=" bg-black text-white">
      <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          className="font-display text-[25px] font-extrabold tracking-[-.08em]"
        >
          <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          
          <Link
            to="/student/applications"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
          >
            My applications
          </Link>
        </div>
      </div>
    </header>
  );
}

function Progress({ step }: { step: number }) {
  const steps = ["Room & date", "Your details", "Documents", "Review"];
  return (
    <div className="mb-8 grid grid-cols-4 gap-2">
      {steps.map((label, index) => {
        const current = index + 1;
        return (
          <div key={label} className="min-w-0">
            <div
              className={`h-1 rounded-full ${current <= step ? "bg-[#f5b544]" : "bg-black/10"}`}
            />
            <p
              className={`mt-2 truncate text-[10px] font-bold uppercase tracking-[.08em] ${current <= step ? "text-black" : "text-black/35"}`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ApplicationDetail({
  application,
}: {
  application: ApplicationRecord;
}) {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#171717]">
      <Header />
      <main className="mx-auto max-w-[1000px] px-5 py-10 lg:px-8">
        <Link
          to="/student/applications"
          className="inline-flex items-center text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to applications
        </Link>
        <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Application {application.id}</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em] sm:text-6xl">
              Your application.
            </h1>
            <p className="mt-3 text-sm text-black/55">
              Submitted {formatDate(application.submittedAt.slice(0, 10))}.
              We’ll update you here as the hostel reviews it.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${statusClasses[application.status]}`}
          >
            <CheckCircle2 className="h-4 w-4" />{" "}
            {statusLabels[application.status]}
          </span>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4 border-b border-black/10 pb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5b544]/25">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-black/45">Property</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold">
                  {application.hostelName}
                </h2>
                <p className="mt-1 text-sm text-black/50">
                  {application.hostelLocation}
                </p>
              </div>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-black/45">Room selected</p>
                <p className="mt-1 text-sm font-bold">{application.roomName}</p>
                <p className="mt-1 text-xs text-black/50">
                  {application.roomPrice} per session
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black/45">
                  Preferred move-in
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatDate(application.moveInDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black/45">Applicant</p>
                <p className="mt-1 text-sm font-bold">
                  {application.firstName} {application.lastName}
                </p>
                <p className="mt-1 text-xs text-black/50">
                  {application.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black/45">University</p>
                <p className="mt-1 text-sm font-bold">
                  {application.university}
                </p>
              </div>
            </div>
            <div className="mt-8 rounded-xl bg-[#f7f6f3] p-4">
              <p className="flex items-center gap-2 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-[#1f9d55]" /> What happens
                next
              </p>
              <p className="mt-2 text-xs leading-6 text-black/55">
                The hostel team will review your details and contact you using
                the information provided. No payment is due for an application.
              </p>
            </div>
          </section>
          <aside className="h-fit rounded-2xl border border-black/10 bg-black p-6 text-white">
            <p className="eyebrow text-white/45">Submitted documents</p>
            <div className="mt-5 space-y-3">
              {application.documents.map((document) => (
                <div
                  key={document}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
                >
                  <FileText className="h-4 w-4 text-[#f5b544]" />
                  <span className="truncate">{document}</span>
                  <Check className="ml-auto h-4 w-4 text-[#74d69a]" />
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-5 text-white/45">
              Documents are ready for secure upload when your account is
              connected to the platform.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function StudentApplication() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property");
  const session = getStoredSession();
  const nameParts = session?.user.name.trim().split(/\s+/) ?? [];
  const registeredFirstName = session?.user.firstName ?? nameParts[0] ?? "";
  const registeredLastName = session?.user.lastName ?? nameParts.slice(1).join(" ");
  const existingApplication = useMemo(() => readApplication(), []);
  const [application, setApplication] = useState<ApplicationRecord | null>(existingApplication);
  const [loadingApplication, setLoadingApplication] = useState(Boolean(id && (!existingApplication || existingApplication.id !== id)));
  const [step, setStep] = useState(1);
  const [roomId, setRoomId] = useState<string>(
    searchParams.get("room") || "shared",
  );
  const [availableRooms, setAvailableRooms] =
    useState<RoomOption[]>(defaultRooms);
  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [moveInDate, setMoveInDate] = useState("");
  const [firstName] = useState(registeredFirstName);
  const [lastName] = useState(registeredLastName);
  const [email] = useState(session?.user.email ?? "");
  const [phone, setPhone] = useState(session?.user.phoneNumber ?? "");
  const [university, setUniversity] = useState(session?.user.schoolName ?? "");
  const [documents, setDocuments] = useState<string[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || (existingApplication && existingApplication.id === id)) return;
    const token = getStoredSessionToken();
    if (!token) {
      setLoadingApplication(false);
      return;
    }
    getMyApplications(token)
      .then(async (applications) => {
        const record = applications.find((item) => item.id === id);
        if (!record) return;
        const property = await getHostel(record.propertyId);
        const room = property.rooms.find((item) => item.name === record.roomName);
        setApplication({
          id: record.id,
          hostelName: property.name,
          hostelLocation: `${property.area}, ${property.city}`,
          roomName: record.roomName,
          roomPrice: room ? `₦${room.price.toLocaleString()}` : "Price unavailable",
          moveInDate: record.moveInDate,
          submittedAt: record.createdAt,
          status: record.status as ApplicationStatus,
          firstName: registeredFirstName,
          lastName: registeredLastName,
          email: session?.user.email ?? "",
          phone: session?.user.phoneNumber ?? "",
          university: session?.user.schoolName ?? "",
          profilePhotoUrl: session?.user.profilePhotoUrl,
          documents: record.documents,
        });
      })
      .catch(() => setError("This application could not be loaded."))
      .finally(() => setLoadingApplication(false));
  }, [existingApplication, id, lastName, registeredFirstName, registeredLastName, session?.user.email, session?.user.phoneNumber, session?.user.profilePhotoUrl, session?.user.schoolName]);

  useEffect(() => {
    if (!propertyId) return;
    getHostel(propertyId)
      .then((result) => {
        setProperty(result);
        const nextRooms = result.rooms.map((room, index) => ({
          id: room.name,
          name: room.name,
          price: `₦${room.price.toLocaleString()}`,
          units: room.availableUnits ?? room.units ?? 1,
          description: `${room.beds} beds per room.`,
        }));
        setAvailableRooms(nextRooms);
        setRoomId((current) =>
          nextRooms.some((room) => room.id === current)
            ? current
            : (nextRooms.find((room) => room.units > 0)?.id ?? nextRooms[0]?.id ?? ""),
        );
      })
      .catch(() => setError("This property is no longer available."));
  }, [propertyId]);

  if (id) {
    if (loadingApplication) {
      return <div className="min-h-screen bg-[#F7F6F2] px-5 py-20 text-center"><p className="text-sm text-black/50">Loading application...</p></div>;
    }
    if (!application || application.id !== id) {
      return (
        <div className="min-h-screen bg-[#F7F6F2] px-5 py-20 text-center">
          <FileText className="mx-auto h-10 w-10 text-black/25" />
          <h1 className="mt-5 font-display text-3xl font-extrabold">
            Application not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/50">
            This application is not available on this device yet.
          </p>
          <Link
            to="/student/applications"
            className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
          >
            Back to applications
          </Link>
        </div>
      );
    }
    return <ApplicationDetail application={application} />;
  }

  if (propertyId && !property) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] px-5 py-20 text-center">
        <p className="text-sm text-black/50">Loading property...</p>
      </div>
    );
  }

  const selectedRoom =
    availableRooms.find((room) => room.id === roomId) ?? availableRooms[0];

  const chooseFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const token = getStoredSessionToken();
    event.target.value = "";
    if (!files.length || !token) return setError("Log in before uploading documents.");
    setError("");
    setUploadingDocuments(true);
    try {
      const uploadedDocuments = await Promise.all(
        files.map((file) => uploadDocumentToCloudinary(file, token)),
      );
      setDocuments((current) => [...current, ...uploadedDocuments]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The documents could not be uploaded.",
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  const next = () => {
    setError("");
    if (uploadingDocuments)
      return setError("Wait for your documents to finish uploading.");
    if (step === 1 && (!moveInDate || !roomId || !selectedRoom || selectedRoom.units < 1))
      return setError("Choose a room with available units and a preferred move-in date to continue.");
    if (
      step === 2 &&
      (!firstName || !lastName || !email || !phone || !university)
    )
      return setError("Complete all required details to continue.");
    if (step === 3 && documents.length === 0)
      return setError(
        "Add at least one document so the hostel can review your application.",
      );
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const session = getStoredSession();
      if (!propertyId || !selectedRoom || !session)
        throw new Error(
          "A signed-in student and available property are required.",
        );
      const created = await createApplication(
        {
          propertyId,
          roomName: selectedRoom.name,
          moveInDate,
          details: {
            email,
            phone,
            university,
            profilePhotoUrl: getStoredProfilePhoto(session.user.id),
          },
          documents,
        },
        session.token,
      );
      const application: ApplicationRecord = {
        id: created.id,
        hostelName: property?.name || "Verified property",
        hostelLocation: property ? `${property.area}, ${property.city}` : "",
        roomName: selectedRoom.name,
        roomPrice: selectedRoom.price,
        moveInDate,
        submittedAt: created.createdAt,
        status: created.status as ApplicationStatus,
        firstName,
        lastName,
        email,
        phone,
        university,
        profilePhotoUrl: getStoredProfilePhoto(session.user.id),
        documents,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(application));
      navigate(`/student/applications/${application.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The application could not be submitted.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#171717]">
      <Header />
      <main className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8">
        <Link
          to={property ? `/hostels/${property.id}` : "/find-a-hostel"}
          className="inline-flex items-center text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to property
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <section>
            <p className="eyebrow">{property?.name ?? "Selected property"} · Apply</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-[.98] tracking-[-.06em] sm:text-6xl">
              Make this place
              <br />
              your next home.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">
              Send the hostel team your details and preferred room. An
              application does not charge you or guarantee a booking.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (step === 4) submit(event);
                else next();
              }}
              className="mt-9 rounded-2xl border border-black/10 bg-white p-5 sm:p-8"
            >
              <Progress step={step} />
              {error && (
                <div
                  className="mb-6 rounded-xl border border-[#dcae4d] bg-[#fff7e3] px-4 py-3 text-xs font-semibold text-[#7a5200]"
                  role="alert"
                >
                  {error}
                </div>
              )}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-[#a36500]" />
                    <div>
                      <h2 className="font-display text-2xl font-extrabold">
                        Choose your space
                      </h2>
                      <p className="mt-1 text-xs text-black/50">
                        Select the room type you want the hostel to review.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {availableRooms.map((room) => (
                      <button
                        type="button"
                        key={room.id}
                        disabled={room.units < 1}
                        onClick={() => setRoomId(room.id)}
                        className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${room.id === roomId ? "border-black bg-[#fff7e3]" : "border-black/10 hover:border-black/30"}`}
                      >
                        <span className="flex gap-3">
                          <span
                            className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${room.id === roomId ? "border-black bg-black" : "border-black/25"}`}
                          >
                            {room.id === roomId && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f5b544]" />
                            )}
                          </span>
                          <span>
                            <strong className="block text-sm">
                              {room.name}
                            </strong>
                            <span className="mt-1 block text-xs leading-5 text-black/50">
                              {room.units} rooms available · {room.description}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-sm font-bold">
                          {room.price}
                          <span className="block text-[10px] font-medium text-black/40">
                            per session
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-6 block text-xs font-bold">
                    Preferred move-in date
                    <input
                      required
                      type="date"
                      value={moveInDate}
                      onChange={(event) => setMoveInDate(event.target.value)}
                      className="auth-input"
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-3">
                    <UserRound className="h-5 w-5 text-[#a36500]" />
                    <div>
                      <h2 className="font-display text-2xl font-extrabold">
                        Tell us about you
                      </h2>
                      <p className="mt-1 text-xs text-black/50">
                        The hostel uses these details to contact you about your
                        application.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 rounded-xl bg-[#f7f6f3] p-4 text-sm">
                      <p className="text-xs font-bold text-black/45">Registered name</p>
                      <p className="mt-1 font-bold">{firstName} {lastName}</p>
                    </div>
                    <label className="text-xs font-bold sm:col-span-2">
                      Email address
                      <input
                        required
                        type="email"
                        value={email}
                        className="auth-input"
                        readOnly
                      />
                    </label>
                    <label className="text-xs font-bold">
                      Phone number
                      <input
                        required
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="auth-input"
                        placeholder="0800 000 0000"
                      />
                    </label>
                    <label className="text-xs font-bold">
                      University
                      <input
                        required
                        value={university}
                        onChange={(event) => setUniversity(event.target.value)}
                        className="auth-input"
                        placeholder="Your university"
                      />
                    </label>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-[#a36500]" />
                    <div>
                      <h2 className="font-display text-2xl font-extrabold">
                        Add your documents
                      </h2>
                      <p className="mt-1 text-xs text-black/50">
                        Choose the documents the hostel may need to review your
                        application.
                      </p>
                    </div>
                  </div>
                  <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-[#f7f6f3] px-5 py-10 text-center hover:border-black/50">
                    <Upload className="h-7 w-7 text-black/35" />
                    <strong className="mt-3 text-sm">
                      {uploadingDocuments ? "Uploading documents..." : "Choose documents"}
                    </strong>
                    <span className="mt-1 text-xs text-black/45">
                      PDF, JPG or PNG · files stay on this device for now
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={chooseFiles}
                      className="sr-only"
                    />
                  </label>
                  {documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documents.map((document) => (
                        <div
                          key={document}
                          className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-xs"
                        >
                          <FileText className="h-4 w-4 text-[#a36500]" />
                          <span className="truncate">
                            {document.split("/").pop() ?? document}
                          </span>
                          <Check className="ml-auto h-4 w-4 text-[#1f9d55]" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="h-5 w-5 text-[#a36500]" />
                    <div>
                      <h2 className="font-display text-2xl font-extrabold">
                        Review your application
                      </h2>
                      <p className="mt-1 text-xs text-black/50">
                        Check your details before sending them to the hostel.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10">
                    <div className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="text-black/50">Room</span>
                      <strong className="text-right">
                        {selectedRoom.name}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="text-black/50">Move-in</span>
                      <strong className="text-right">
                        {formatDate(moveInDate)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="text-black/50">Applicant</span>
                      <strong className="text-right">
                        {firstName} {lastName}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="text-black/50">Contact</span>
                      <strong className="max-w-[60%] text-right">
                        {email}
                        <br />
                        {phone}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 text-sm">
                      <span className="text-black/50">Documents</span>
                      <strong className="text-right">
                        {documents.length} selected
                      </strong>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3 rounded-xl bg-[#f7f6f3] p-4 text-xs leading-5 text-black/55">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1f9d55]" />{" "}
                    No payment is required to submit this application. You can
                    withdraw it before the hostel accepts it.
                  </div>
                </div>
              )}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-black/10 pt-5">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  className={`rounded-full border border-black/15 px-5 py-3 text-xs font-bold ${step === 1 ? "invisible" : ""}`}
                >
                  Back
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
                  >
                    Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit application"}{" "}
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </section>
          <aside className="h-fit rounded-2xl bg-black p-6 text-white lg:sticky lg:top-8">
            <p className="eyebrow text-white/45">Your selection</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">
              {property?.name ?? "Selected property"}
            </h2>
            <p className="mt-1 text-xs text-white/45">
              {property ? `${property.area}, ${property.city} · Verified property` : "Verified property"}
            </p>
            <div className="mt-7 border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-[#f5b544]" />
                <div>
                  <p className="text-[10px] uppercase tracking-[.1em] text-white/40">
                    Room
                  </p>
                  <p className="mt-1 text-sm font-bold">{selectedRoom.name}</p>
                </div>
              </div>
              {moveInDate && (
                <div className="mt-5 flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[#f5b544]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[.1em] text-white/40">
                      Move-in
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {formatDate(moveInDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-7 rounded-xl bg-white/5 p-4 text-xs leading-5 text-white/55">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-[#74d69a]" />{" "}
              Your application is free. The hostel will respond after reviewing
              your details.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
