import Reveal from "@/components/Reveal";
import {
  CONTACT_EMAIL,
  FACEBOOK_URL,
  WHATSAPP_COMMUNITY_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/contact";

export const metadata = { title: "Contact — SILA Collective" };

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M13.8 8.2h-1.4c-.9 0-1.4.5-1.4 1.4V11h2.6l-.35 2.1h-2.25V19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3.5a8.3 8.3 0 0 0-7.1 12.6L3.5 20.5l4.5-1.4A8.3 8.3 0 1 0 12 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 8.4c.2-.4.4-.4.6-.4h.4c.15 0 .3 0 .45.35.15.35.5 1.2.55 1.3.05.1.08.2 0 .35-.08.15-.12.2-.22.3-.1.1-.2.2-.3.3-.1.1-.2.2-.1.4.1.2.5.85 1.05 1.35.7.65 1.3.85 1.5.95.2.1.3.08.4-.02.1-.1.4-.45.5-.6.1-.15.2-.13.35-.08.15.05 1 .47 1.15.55.15.08.25.12.3.2.05.08.05.45-.1.9-.15.4-.85.8-1.2.85-.3.05-.7.07-1.1-.07a10 10 0 0 1-3.6-2.55c-.6-.6-1.2-1.4-1.4-2.15-.1-.4-.1-.75.05-1.05Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9" cy="8.5" r="2.5" />
      <path d="M4 18c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" strokeLinecap="round" />
      <circle cx="16.5" cy="9" r="2" />
      <path d="M14.5 13.6c2.3.2 4 1.7 4 4" strokeLinecap="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      className="h-6 w-6"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7l7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const secondaryChannels = [
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: "@silacollective_",
    sub: "DM us",
    href: "https://instagram.com/silacollective_",
  },
  {
    icon: FacebookIcon,
    label: "Facebook",
    value: "SILA Collective",
    sub: "Follow our page",
    href: FACEBOOK_URL,
  },
  {
    icon: GroupIcon,
    label: "WhatsApp Community",
    value: "Join the group",
    sub: "Drops & offers",
    href: WHATSAPP_COMMUNITY_URL,
  },
  {
    icon: EmailIcon,
    label: "Email",
    value: CONTACT_EMAIL,
    sub: "Orders & support",
    href: `mailto:${CONTACT_EMAIL}`,
    breakWords: true,
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-x-clip">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <p
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif italic text-outline text-[26vw] sm:text-[13vw] leading-none opacity-[0.1] whitespace-nowrap select-none pointer-events-none"
        >
          hello hello
        </p>
        <div className="relative mx-auto max-w-2xl px-4 sm:px-8 text-center">
          <Reveal>
            <p className="text-gold uppercase tracking-[0.3em] text-xs mb-4">Get in touch</p>
            <h1 className="font-serif text-6xl sm:text-7xl">
              Say <span className="italic text-gold">hello</span>
            </h1>
            <p className="mt-6 text-smoke leading-relaxed max-w-md mx-auto">
              Questions about sizing, your order, or a custom mom &amp; girl
              combo? We&apos;d love to hear from you.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-3 bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors duration-300"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
            <p className="mt-4 text-xs text-smoke uppercase tracking-[0.15em]">
              {WHATSAPP_DISPLAY} · fastest response
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── OTHER WAYS TO REACH US ───────────────────────── */}
      <section className="border-t border-ink/10 bg-cream/40 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-smoke text-center mb-12">
              Or find us here
            </p>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-12">
            {secondaryChannels.map((c, i) => {
              const Icon = c.icon;
              const external = c.href.startsWith("http");
              return (
                <Reveal key={c.label} delay={i * 90} className="text-center">
                  <a href={c.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="group inline-flex flex-col items-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-ivory">
                      <Icon />
                    </span>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-smoke mt-4">{c.label}</p>
                    <p
                      className={`font-serif text-lg mt-1.5 group-hover:text-gold transition-colors ${
                        c.breakWords ? "break-words" : ""
                      }`}
                    >
                      {c.value}
                    </p>
                    <p className="text-xs text-smoke mt-1">{c.sub}</p>
                  </a>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
