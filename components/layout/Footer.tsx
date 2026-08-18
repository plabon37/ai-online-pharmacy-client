import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* ==================================================
            MAIN FOOTER
        =================================================== */}

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* ==================================================
              BRAND
          =================================================== */}

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-950/20">
                <MedicalLogoIcon />
              </span>

              <span>
                <span className="block text-base font-bold tracking-tight">
                  Smart Pharmacy
                </span>

                <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Healthcare & Medicine
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              Your trusted digital pharmacy platform for
              browsing medicines, managing orders and
              accessing smarter healthcare support.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <SocialButton label="Facebook">
                <FacebookIcon />
              </SocialButton>

              <SocialButton label="Instagram">
                <InstagramIcon />
              </SocialButton>

              <SocialButton label="LinkedIn">
                <LinkedInIcon />
              </SocialButton>
            </div>
          </div>

          {/* ==================================================
              QUICK LINKS
          =================================================== */}

          <div>
            <h3 className="text-sm font-bold text-white">
              Quick Links
            </h3>

            <div className="mt-4 space-y-2.5">
              <FooterLink
                href="/"
                label="Home"
              />

              <FooterLink
                href="/medicines"
                label="Medicines"
              />

              <FooterLink
                href="/categories"
                label="Categories"
              />

              <FooterLink
                href="/search"
                label="Search"
              />

              <FooterLink
                href="/cart"
                label="Cart"
              />
            </div>
          </div>

          {/* ==================================================
              CUSTOMER
          =================================================== */}

          <div>
            <h3 className="text-sm font-bold text-white">
              Customer
            </h3>

            <div className="mt-4 space-y-2.5">
              <FooterLink
                href="/login"
                label="Login"
              />

              <FooterLink
                href="/register"
                label="Create Account"
              />

              <FooterLink
                href="/orders"
                label="My Orders"
              />

              <FooterLink
                href="/prescription"
                label="Prescription"
              />

              <FooterLink
                href="/profile"
                label="My Profile"
              />
            </div>
          </div>

          {/* ==================================================
              CONTACT
          =================================================== */}

          <div>
            <h3 className="text-sm font-bold text-white">
              Contact Us
            </h3>

            <div className="mt-4 space-y-4">
              <ContactItem
                icon={<MapPinIcon />}
                title="Address"
                value="Dhaka, Bangladesh"
              />

              <ContactItem
                icon={<PhoneIcon />}
                title="Phone"
                value="+880 1XXXXXXXXX"
              />

              <ContactItem
                icon={<MailIcon />}
                title="Email"
                value="support@smartpharmacy.com"
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            HEALTHCARE NOTICE
        =================================================== */}

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <InfoIcon />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">
                Healthcare Information Notice
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
                AI-generated healthcare information is
                for informational purposes only and
                should not replace professional medical
                advice.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            BOTTOM
        =================================================== */}

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500 sm:text-xs">
            © 2026 Smart Pharmacy. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 sm:text-xs">
            <Link
              href="/privacy"
              className="transition hover:text-emerald-400"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-emerald-400"
            >
              Terms
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-emerald-400"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   FOOTER LINK
============================================================ */

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
    >
      <span className="h-1 w-1 rounded-full bg-slate-700 transition group-hover:bg-emerald-400" />

      {label}
    </Link>
  );
}

/* ============================================================
   SOCIAL BUTTON
============================================================ */

function SocialButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
    >
      {children}
    </a>
  );
}

/* ============================================================
   CONTACT ITEM
============================================================ */

function ContactItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        <p className="mt-0.5 break-words text-sm text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function MedicalLogoIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        stroke="white"
        strokeWidth="1.8"
      />

      <path
        d="M12 8V16M8 12H16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 22V13.1H16.5L17 9.6H13.5V7.4C13.5 6.4 13.8 5.7 15.1 5.7H17.1V2.6C16.8 2.6 15.7 2.4 14.5 2.4C11.9 2.4 10.1 4 10.1 6.9V9.6H7.1V13.1H10.1V22H13.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.5 8.5H3.2V21H6.5V8.5ZM4.85 3C3.78 3 3 3.78 3 4.8C3 5.82 3.78 6.6 4.85 6.6C5.87 6.6 6.65 5.82 6.65 4.8C6.65 3.78 5.87 3 4.85 3ZM21 13.75C21 10 19.02 8.06 16.38 8.06C14.3 8.06 13.37 9.2 12.85 10V8.5H9.55V21H12.85V14.2C12.85 12.4 13.18 10.66 15.43 10.66C17.64 10.66 17.67 12.72 17.67 14.32V21H21V13.75Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 10C20 15 12 21 12 21C12 21 4 15 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3H9L11 8L8.8 9.6C10 12.2 11.8 14 14.4 15.2L16 13L21 15V18C21 19.1 20.1 20 19 20C10.7 20 4 13.3 4 5C4 3.9 4.9 3 6 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M4 7L12 13L20 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 10V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}