import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createBooking, getHostel, getStoredSession } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type Room = { name: string; beds: number; units?: number; availableUnits?: number; price: string };
type PropertyRecord = {
  property?: { name?: string; city?: string; area?: string };
  rooms?: Room[];
  status?: string;
};
function toPropertyRecord(
  property: Awaited<ReturnType<typeof getHostel>>,
): PropertyRecord {
  return {
    property: { name: property.name, city: property.city, area: property.area },
    rooms: property.rooms.map((room) => ({
      ...room,
      price: `₦${room.price.toLocaleString()}`,
    })),
    status: property.status,
  };
}
function Unavailable() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#171717]">
      <header className="bg-white">
        <div className="mx-auto flex h-[74px] max-w-[1100px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
            <LockKeyhole className="h-4 w-4" /> Secure checkout
          </span>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[620px] items-center justify-center px-5 py-16 text-center">
        <div>
          <ShieldCheck className="mx-auto h-10 w-10 text-black/25" />
          <h1 className="mt-5 font-display text-3xl font-extrabold">
            Booking is not available yet
          </h1>
          <p className="mt-3 text-sm leading-6 text-black/50">
            A verified property and live room availability are required before
            checkout can begin.
          </p>
          <Link
            to="/find-a-hostel"
            className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white"
          >
            Back to search <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
export default function BookingCheckout() {
  const [params] = useSearchParams();
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const room = property?.rooms?.find((item) => item.name === params.get("room")) ??
    property?.rooms?.find((item) => (item.availableUnits ?? item.units ?? 1) > 0);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  useEffect(() => {
    const propertyId = params.get("property");
    if (!propertyId) {
      setLoadingProperty(false);
      return;
    }
    getHostel(propertyId)
      .then((result) => setProperty(toPropertyRecord(result)))
      .catch(() => setProperty(null))
      .finally(() => setLoadingProperty(false));
  }, [params]);
  if (loadingProperty || !property || !room || (room.availableUnits ?? room.units ?? 1) < 1) return <Unavailable />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) return setStep((current) => current + 1);
    setProcessing(true);
    try {
      const session = getStoredSession();
      const propertyId = params.get("property");
      if (!session || !propertyId)
        throw new Error("A signed-in student and valid property are required.");
      const created = await createBooking(
        {
          propertyId,
          roomName: room.name,
          moveInDate: new Date().toISOString().slice(0, 10),
        },
        session.token,
      );
      const booking = {
        id: created.id,
        propertyName: property.property?.name || "Verified property",
        propertyLocation: `${property.property?.city || ""}${property.property?.area ? ` · ${property.property.area}` : ""}`,
        roomName: room.name,
        price: room.price,
        status: created.status,
        createdAt: created.createdAt,
      };
      window.localStorage.setItem(
        "arc.student.booking",
        JSON.stringify(booking),
      );
      setProcessing(false);
      setComplete(true);
    } catch {
      setProcessing(false);
    }
  };
  if (complete)
    return (
      <div className="min-h-screen bg-[#f7f6f3] text-[#171717]">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex h-[74px] max-w-[1100px] items-center justify-between px-5 lg:px-8">
            <Link
              to="/"
              className="font-display text-[25px] font-extrabold tracking-[-.08em]"
            >
              <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
            </Link>
            <span className="text-xs font-semibold text-black/50">
              Booking request received
            </span>
          </div>
        </header>
        <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[620px] items-center justify-center px-5 py-16">
          <div className="w-full rounded-2xl border border-black/10 bg-white p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dff3e6] text-[#16733b]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="eyebrow mt-6">Booking request received</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">
              You’re all set.
            </h1>
            <p className="mx-auto mt-4 max-w-[420px] text-sm leading-6 text-black/55">
              Your booking request for {room.name} at{" "}
              {property.property?.name || "this property"} has been saved.
            </p>
            <Link
              to="/student/bookings/current"
              className="mt-7 block rounded-full bg-black py-3.5 text-sm font-bold text-white"
            >
              View my booking <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#171717]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-[74px] max-w-[1100px] items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <span className="flex items-center gap-2 text-xs font-semibold text-black/50">
            <LockKeyhole className="h-4 w-4" /> Secure checkout
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1000px] px-5 py-10 lg:px-8 lg:py-16">
        <Link
          to={`/hostels/${params.get("property")}`}
          className="mb-8 inline-flex items-center text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to hostel
        </Link>
        <div className="mb-10 flex items-center justify-between gap-2 sm:gap-5">
          {["Choose room", "Your details", "Payment"].map((label, index) => (
            <div className="flex flex-1 items-center gap-2" key={label}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step > index ? "bg-black text-white" : "border border-black/20 bg-white text-black/45"}`}
              >
                {step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`hidden text-xs font-bold sm:block ${step === index + 1 ? "text-black" : "text-black/35"}`}
              >
                {label}
              </span>
              {index < 2 && <span className="h-px flex-1 bg-black/15" />}
            </div>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8"
          >
            {step === 1 && (
              <div>
                <p className="eyebrow">Step 1 of 3</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold">
                  Confirm your room
                </h1>
                <p className="mt-2 text-sm text-black/50">
                  {property.property?.name || "Verified property"} ·{" "}
                  {property.property?.city || "Location pending"}
                </p>
                <div className="mt-8 rounded-2xl border border-[#f5b544] bg-[#fff9e9] p-5">
                  <h2 className="font-display text-xl font-extrabold">
                    {room.name}
                  </h2>
                  <p className="mt-1 text-xs text-black/50">
                    {room.availableUnits ?? room.units ?? 1} rooms available · {room.beds} beds per room
                  </p>
                  <strong className="mt-5 block font-display text-2xl">
                    {room.price}
                  </strong>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <p className="eyebrow">Step 2 of 3</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold">
                  Confirm your details
                </h1>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold">
                    First name
                    <input
                      required
                      className="auth-input"
                      placeholder="First name"
                    />
                  </label>
                  <label className="text-xs font-bold">
                    Last name
                    <input
                      required
                      className="auth-input"
                      placeholder="Last name"
                    />
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    Email address
                    <input
                      required
                      type="email"
                      className="auth-input"
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="text-xs font-bold">
                    Phone number
                    <input
                      required
                      className="auth-input"
                      placeholder="0800 000 0000"
                    />
                  </label>
                  <label className="text-xs font-bold">
                    Move-in date
                    <input required type="date" className="auth-input" />
                  </label>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <p className="eyebrow">Step 3 of 3</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold">
                  Choose payment method
                </h1>
                <p className="mt-2 text-sm text-black/50">
                  Payment processing will be completed when a payment provider
                  is connected.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2 rounded-full bg-[#f3f3f1] p-1">
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`rounded-full py-2.5 text-xs font-bold ${method === "card" ? "bg-black text-white" : "text-black/50"}`}
                  >
                    <CreditCard className="mr-2 inline h-4 w-4" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("transfer")}
                    className={`rounded-full py-2.5 text-xs font-bold ${method === "transfer" ? "bg-black text-white" : "text-black/50"}`}
                  >
                    Bank transfer
                  </button>
                </div>
                {method === "card" && (
                  <label className="mt-6 block text-xs font-bold">
                    Card number
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="cc-number"
                      className="auth-input"
                      placeholder="0000 0000 0000 0000"
                    />
                  </label>
                )}
                <div className="mt-6 rounded-xl bg-[#fff7e3] p-4 text-xs leading-5 text-[#7a5200]">
                  This preview records the booking request locally. No payment
                  is captured.
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-between gap-3 border-t border-black/10 pt-5">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className={`rounded-full border border-black/15 px-5 py-3 text-xs font-bold ${step === 1 ? "invisible" : ""}`}
              >
                Back
              </button>
              <button
                disabled={processing}
                className="rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
              >
                {processing
                  ? "Saving…"
                  : step === 3
                    ? "Save booking request"
                    : "Continue"}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>
          </form>
          <aside className="h-fit rounded-2xl bg-black p-6 text-white lg:sticky lg:top-8">
            <p className="eyebrow text-white/45">Booking summary</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">
              {property.property?.name || "Verified property"}
            </h2>
            <p className="mt-1 text-xs text-white/45">{room.name}</p>
            <div className="mt-7 border-t border-white/10 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Accommodation</span>
                <strong>{room.price}</strong>
              </div>
            </div>
            <div className="mt-7 rounded-xl bg-white/5 p-4 text-xs leading-5 text-white/55">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-[#74d69a]" />{" "}
              Secure booking request with no payment captured in this preview.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
