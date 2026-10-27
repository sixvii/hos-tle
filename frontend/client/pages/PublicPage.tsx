import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getProfileInitial,
  getStoredProfilePhoto,
  getStoredSession,
} from "@/lib/api";
import { createSupportTicket } from "@/lib/api";

type PublicPath =
  | "/universities"
  | "/how-it-works"
  | "/about"
  | "/safety"
  | "/help"
  | "/contact"
  | "/faq"
  | "/terms"
  | "/privacy";

type Icon = typeof ShieldCheck;

type PublicCard = {
  icon: Icon;
  title: string;
  text: string;
};

type PublicContent = {
  eyebrow: string;
  title: string;
  text: string;
  cards: PublicCard[];
};

const content: Record<PublicPath, PublicContent> = {
  "/universities": {
    eyebrow: "For university communities",
    title: "Make finding a safe place to live part of the student experience.",
    text: "Give students a clearer path to trusted accommodation while building visibility for approved hostel partners.",
    cards: [
      {
        icon: ShieldCheck,
        title: "Approved accommodation",
        text: "Help students discover verified partners close to campus.",
      },
      {
        icon: Users,
        title: "Better student support",
        text: "Reduce search friction and give every student a reliable starting point.",
      },
      {
        icon: MapPin,
        title: "Local visibility",
        text: "Keep accommodation information easy to compare and simple to access.",
      },
    ],
  },
  "/how-it-works": {
    eyebrow: "How arc() works",
    title: "From search to move-in, without the guesswork.",
    text: "arc() brings discovery, verification, booking and support into one calm experience for students and property teams.",
    cards: [
      {
        icon: BookOpen,
        title: "Tell us what you need",
        text: "Choose your university, budget, preferred location and room type.",
      },
      {
        icon: MapPin,
        title: "Compare your options",
        text: "Explore verified hostels, rooms, amenities, prices and availability.",
      },
      {
        icon: CheckCircle2,
        title: "Reserve your space",
        text: "Apply or reserve securely, then manage your stay in one place.",
      },
    ],
  },
  "/about": {
    eyebrow: "About arc()",
    title: "A calmer way to find student accommodation.",
    text: "arc() is being built around one simple idea: students should not have to rely on scattered listings and uncertain information to find a place near campus.",
    cards: [
      {
        icon: Users,
        title: "Built for student life",
        text: "Search, applications, bookings and support are designed around the student journey.",
      },
      {
        icon: ShieldCheck,
        title: "Trust is part of the product",
        text: "Verification and clear information help students make decisions with confidence.",
      },
      {
        icon: MapPin,
        title: "Closer to campus",
        text: "The experience keeps university communities and local property teams connected.",
      },
    ],
  },
  "/safety": {
    eyebrow: "Safety at arc()",
    title: "More clarity before you commit.",
    text: "Safety starts with useful information, clear processes and a place to report concerns. Verified inventory will be shown as live property data becomes available.",
    cards: [
      {
        icon: ShieldCheck,
        title: "Verification matters",
        text: "Properties can move through a review process before they are presented as verified inventory.",
      },
      {
        icon: CheckCircle2,
        title: "Clear next steps",
        text: "Applications and booking requests keep their status visible so you know what happens next.",
      },
      {
        icon: HelpCircle,
        title: "Support when needed",
        text: "Use the help and contact channels to ask questions or report an issue with your experience.",
      },
    ],
  },
  "/help": {
    eyebrow: "Help centre",
    title: "Find your next step quickly.",
    text: "Whether you are searching for a room, managing a property or reviewing an application, these starting points explain where to go.",
    cards: [
      {
        icon: MapPin,
        title: "Looking for a hostel",
        text: "Start at Find hostels and use the search controls to describe your university, location and room needs.",
      },
      {
        icon: BookOpen,
        title: "Managing an application",
        text: "Student applications and owner reviews live in their respective workspaces, with status updates shown in context.",
      },
      {
        icon: Users,
        title: "Managing a property",
        text: "Property teams can start a listing from the owner workspace and follow its review status.",
      },
    ],
  },
  "/contact": {
    eyebrow: "Contact arc()",
    title: "Have a question? Let’s find the right place for it.",
    text: "Send a message using the form below. This frontend records the submission state locally for now; a connected support service will deliver messages once backend services are enabled.",
    cards: [
      {
        icon: HelpCircle,
        title: "Student support",
        text: "Ask about searching, applications, bookings or managing your student account.",
      },
      {
        icon: Users,
        title: "Property teams",
        text: "Ask about listing a property, verification or managing accommodation information.",
      },
      {
        icon: Mail,
        title: "Partnerships",
        text: "Universities and community partners can use the same form to start a conversation.",
      },
    ],
  },
  "/faq": {
    eyebrow: "Frequently asked questions",
    title: "The essentials, in one place.",
    text: "These answers explain the current frontend journey. Live inventory, account services and payments will be connected as the platform backend is introduced.",
    cards: [
      {
        icon: ShieldCheck,
        title: "What does verified mean?",
        text: "A verified property has completed the configured review process. Unverified or pending properties are not presented as live inventory.",
      },
      {
        icon: BookOpen,
        title: "Can I apply before inventory is live?",
        text: "The application flow is ready for connected inventory. Until then, the marketplace shows an honest empty state instead of fictional listings.",
      },
      {
        icon: Mail,
        title: "How do I get help?",
        text: "Use the contact form to describe your question and the area of the product where you need support.",
      },
    ],
  },
  "/terms": {
    eyebrow: "Terms of use",
    title: "A clear foundation for using arc().",
    text: "These terms are a frontend-ready starting point for the product experience. They should be reviewed and completed with the platform’s legal and operational requirements before launch.",
    cards: [
      {
        icon: CheckCircle2,
        title: "Use accurate information",
        text: "Students and property teams are expected to keep the information they submit current and accurate.",
      },
      {
        icon: ShieldCheck,
        title: "Respect the review process",
        text: "Verification status communicates the current state of a property and is not a substitute for personal due diligence.",
      },
      {
        icon: Users,
        title: "Use the service responsibly",
        text: "Do not misuse accounts, submit harmful content or interfere with another person’s accommodation journey.",
      },
    ],
  },
  "/privacy": {
    eyebrow: "Privacy",
    title: "Your information should have a clear purpose.",
    text: "arc() is designed to collect only the information needed for search, applications, property management and support. The final policy will be connected to the production data services before launch.",
    cards: [
      {
        icon: ShieldCheck,
        title: "Purposeful collection",
        text: "Information should be used to provide the feature or support request for which it was submitted.",
      },
      {
        icon: CheckCircle2,
        title: "Visible status",
        text: "Application and booking journeys should make the state of your request understandable at each step.",
      },
      {
        icon: Mail,
        title: "Questions about data",
        text: "Use the contact page to ask about information submitted through the product.",
      },
    ],
  },
};

const footerGroups = [
  {
    title: "Explore",
    links: [
      ["Find hostels", "/find-a-hostel"],
      ["How it works", "/how-it-works"],
      ["For universities", "/universities"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About arc()", "/about"],
      ["Safety", "/safety"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Help centre", "/help"],
      ["FAQ", "/faq"],
      ["Log in", "/login"],
    ],
  },
] as const;

function PublicHeader() {
  const session = getStoredSession();
  const profilePhoto = session ? getStoredProfilePhoto(session.user.id) : "";
  const profilePath =
    session?.user.role === "owner" ? "/owner/dashboard" : "/dashboard";
  return (
    <header className=" bg-black text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#f5b544] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-black"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          className="font-display text-[25px] font-extrabold tracking-[-.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b544]"
        >
          <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
        </Link>
        <nav
          className="hidden items-center gap-7 text-[13px] font-medium text-white/70 md:flex"
          aria-label="Primary navigation"
        >
          <Link
            to="/find-a-hostel"
            className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
          >
            Find hostels
          </Link>
          <Link
            to="/universities"
            className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
          >
            Universities
          </Link>
          <Link
            to="/how-it-works"
            className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
          >
            How it works
          </Link>
        </nav>
        {session ? (
          <Link
            to={profilePath}
            aria-label="Open your profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b544]"
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
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b544]"
          >
            Log in
          </Link>
        )}
      </div>
      <nav
        className="mx-auto flex max-w-[1240px] gap-5 overflow-x-auto border-t border-white/10 px-5 py-3 text-xs font-semibold text-white/65 md:hidden"
        aria-label="Mobile navigation"
      >
        <Link
          to="/find-a-hostel"
          className="shrink-0 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
        >
          Find hostels
        </Link>
        <Link
          to="/universities"
          className="shrink-0 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
        >
          Universities
        </Link>
        <Link
          to="/how-it-works"
          className="shrink-0 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
        >
          How it works
        </Link>
      </nav>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#171717] text-white">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <Link
            to="/"
            className="font-display text-[25px] font-extrabold tracking-[-.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b544]"
          >
            <img src="/hostle.jpeg" alt="Hostle logo" className="h-9 w-auto object-contain" />
          </Link>
          <p className="mt-4 max-w-[260px] text-sm leading-6 text-white/50">
            A clearer way for students and property teams to connect around
            university accommodation.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-white/40">
              {group.title}
            </p>
            <nav
              className="mt-4 flex flex-col items-start gap-3 text-sm text-white/70"
              aria-label={`${group.title} links`}
            >
              {group.links.map(([label, href]) => (
                <Link
                  key={href}
                  to={href}
                  className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 border-t border-white/10 px-5 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>
          © {new Date().getFullYear()} arc(). Built for better student living.
        </p>
        <div className="flex gap-4">
          <Link
            to="/terms"
            className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b544]"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createSupportTicket({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        topic: String(form.get("topic") ?? ""),
        message: String(form.get("message") ?? ""),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-3xl border border-[#f5b544]/40 bg-[#fff8e8] p-7"
      >
        <CheckCircle2 className="h-8 w-8 text-[#a36500]" />
        <h2 className="mt-5 font-display text-2xl font-extrabold tracking-[-.04em]">
          Your message is ready.
        </h2>
        <p className="mt-3 text-sm leading-6 text-black/60">
          Thanks for getting in touch. This preview has recorded the successful
          submission state. Delivery will be connected when the support service
          is available.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a36500]"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,.06)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-bold text-black/60">
          Name
          <input
            required
            name="name"
            className="auth-input"
            placeholder="Your name"
          />
        </label>
        <label className="text-xs font-bold text-black/60">
          Email
          <input
            required
            type="email"
            name="email"
            className="auth-input"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="mt-5 block text-xs font-bold text-black/60">
        What can we help with?
        <select required name="topic" defaultValue="" className="auth-input">
          <option value="" disabled>
            Select a topic
          </option>
          <option>Finding accommodation</option>
          <option>Managing a property</option>
          <option>University partnership</option>
          <option>Something else</option>
        </select>
      </label>
      <label className="mt-5 block text-xs font-bold text-black/60">
        Message
        <textarea
          required
          name="message"
          rows={5}
          className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-[#fafafa] p-3 text-sm font-normal outline-none focus:border-black/40"
          placeholder="Tell us what you need help with"
        />
      </label>
      <button
        type="submit"
        className="mt-6 inline-flex items-center rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a36500]"
      >
        Send message <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </form>
  );
}

function FaqDetails() {
  const questions = [
    [
      "Are listings verified?",
      "Only connected property records that have completed the configured review process should be shown as verified. The marketplace uses an empty state when live inventory is unavailable.",
    ],
    [
      "Can I save a search?",
      "Yes. Search criteria can be saved from the Find hostels page for the current frontend journey. Connected accounts will determine how saved searches persist in production.",
    ],
    [
      "How do applications work?",
      "Students can complete a guided application when a verified property and room are available. Owners can review submitted applications in their workspace.",
    ],
    [
      "Are payments live?",
      "The checkout interface is ready for payment method selection and confirmation states, but no payment is captured in this frontend-only phase.",
    ],
  ];

  return (
    <div className="mt-10 divide-y divide-black/10 rounded-3xl border border-black/10 bg-white px-6 sm:px-8">
      {questions.map(([question, answer]) => (
        <details key={question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-extrabold tracking-[-.03em]">
            {question}
            <span className="text-[#a36500] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-[700px] pt-3 text-sm leading-6 text-black/55">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export default function PublicPage() {
  const path = useLocation().pathname as PublicPath;
  const page = content[path] ?? content["/how-it-works"];
  const isContact = path === "/contact";
  const isFaq = path === "/faq";
  const isLegal = path === "/terms" || path === "/privacy";

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171717]">
      <PublicHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1100px] px-5 py-16 outline-none lg:px-8 lg:py-24"
      >
        <p className="eyebrow text-[#a36500]">{page.eyebrow}</p>
        <h1 className="section-title mt-4 max-w-[840px]">{page.title}</h1>
        <p className="mt-6 max-w-[650px] text-base leading-7 text-black/55">
          {page.text}
        </p>
        {!isLegal && !isContact && !isFaq && (
          <Link
            to="/find-a-hostel"
            className="mt-8 inline-flex rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white"
          >
            Explore hostels <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
        {isLegal ? (
          <div className="mt-12 max-w-[760px] space-y-8 text-sm leading-7 text-black/60">
            <section>
              <h2 className="font-display text-2xl font-extrabold text-black">
                What this page covers
              </h2>
              <p className="mt-3">
                This page provides the current product-facing summary for{" "}
                {path === "/terms"
                  ? "using arc() and its accommodation workflows"
                  : "how information is intended to be handled across arc()"}
                . Production legal text, retention details and service-specific
                terms must be connected before launch.
              </p>
            </section>
            <section>
              <h2 className="font-display text-2xl font-extrabold text-black">
                Before launch
              </h2>
              <p className="mt-3">
                The final version will be reviewed alongside the authentication,
                marketplace, support and payment services so the published
                policy matches the actual product behavior.
              </p>
            </section>
            <div className="rounded-2xl border border-[#f5b544]/50 bg-[#fff8e8] p-5 text-black/70">
              <strong className="text-black">Important:</strong> This frontend
              page is informational and is not a substitute for the final legal
              agreement or privacy notice.
            </div>
          </div>
        ) : isContact ? (
          <div className="mt-14 grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid content-start gap-4">
              {page.cards.map(({ icon: Icon, title, text }) => (
                <div key={title} className="feature-card">
                  <Icon className="h-5 w-5 text-[#a36500]" />
                  <h2 className="mt-5 font-display text-lg font-extrabold tracking-[-.03em]">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-black/55">{text}</p>
                </div>
              ))}
            </div>
            <ContactForm />
          </div>
        ) : isFaq ? (
          <FaqDetails />
        ) : (
          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {page.cards.map(({ icon: Icon, title, text }) => (
              <article key={title} className="feature-card">
                <Icon className="h-5 w-5 text-[#a36500]" />
                <h2 className="mt-6 font-display text-xl font-extrabold tracking-[-.04em]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-black/55">{text}</p>
              </article>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
