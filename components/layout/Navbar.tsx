import {
  cookies,
} from "next/headers";

import Link from "next/link";

import CustomerNavbarActions from "@/components/layout/CustomerNavbarActions";

/* ============================================================
   TYPES
============================================================ */

type CustomerUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
  isActive: boolean;
};

type CustomerSessionResponse = {
  success?: boolean;

  data?: {
    user?: CustomerUser;
  } | null;

  message?: string;
};

/* ============================================================
   NAV ITEMS
============================================================ */

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Medicines",
    href: "/medicines",
  },
  {
    label: "Categories",
    href: "/categories",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

/* ============================================================
   API BASE URL
============================================================ */

function getApiBaseUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return "";
  }

  return apiUrl.replace(
    /\/$/,
    ""
  );
}

/* ============================================================
   GET CUSTOMER SESSION
============================================================ */

async function getCustomerSession(): Promise<CustomerUser | null> {
  try {
    const apiBaseUrl =
      getApiBaseUrl();

    if (!apiBaseUrl) {
      return null;
    }

    /* --------------------------------------------------------
       Read browser cookies on the server
    -------------------------------------------------------- */

    const cookieStore =
      await cookies();

    const customerToken =
      cookieStore.get(
        "customer_token"
      )?.value;

    if (!customerToken) {
      return null;
    }

    /* --------------------------------------------------------
       Forward customer cookie to backend
    -------------------------------------------------------- */

    const response =
      await fetch(
        `${apiBaseUrl}/api/auth/customer/session`,
        {
          method: "GET",

          headers: {
            Cookie: `customer_token=${customerToken}`,
          },

          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      return null;
    }

    const result =
      (await response.json()) as CustomerSessionResponse;

    if (
      !result.success ||
      !result.data?.user
    ) {
      return null;
    }

    if (
      result.data.user.role !==
      "CUSTOMER"
    ) {
      return null;
    }

    if (
      !result.data.user.isActive
    ) {
      return null;
    }

    return result.data.user;
  } catch (error) {
    console.error(
      "Customer Navbar Session Error:",
      error
    );

    return null;
  }
}

/* ============================================================
   NAVBAR
============================================================ */

export default async function Navbar() {
  const customer =
    await getCustomerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            MAIN NAVBAR
        =================================================== */}

        <div className="flex h-[72px] items-center justify-between">
          {/* ==================================================
              LOGO
          =================================================== */}

          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md shadow-emerald-100 transition-transform duration-200 group-hover:scale-105">
              <MedicalLogoIcon />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                Smart Pharmacy
              </span>

              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:block">
                Healthcare & Medicine
              </span>
            </span>
          </Link>

          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navItems.map(
              (item) => (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-emerald-700"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* ==================================================
              RIGHT ACTIONS
          =================================================== */}

          <CustomerNavbarActions
            customer={
              customer
            }
            navItems={
              navItems
            }
          />
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   LOGO ICON
============================================================ */

function MedicalLogoIcon() {
  return (
    <svg
      width="22"
      height="22"
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