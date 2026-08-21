"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  addToCart,
} from "@/lib/cart/cart";

/* ============================================================
   PENDING CART STORAGE
============================================================ */

const PENDING_CART_ITEM_KEY =
  "smart_pharmacy_pending_cart_item";

/* ============================================================
   LOGIN RESPONSE
============================================================ */

type LoginResponse = {
  success?: boolean;

  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
      role: "CUSTOMER";
      isActive: boolean;
    };
  } | null;

  message?: string;
};

/* ============================================================
   PENDING CART ITEM
============================================================ */

type PendingCartItem = {
  medicineId: string;
  name: string;
  slug: string;
  genericName?: string;
  image?: string;
  price: number;
  quantity: number;
  stock: number;
};

/* ============================================================
   COMPONENT
============================================================ */

function LoginFormContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const redirectParam =
    searchParams.get(
      "redirect"
    );

  /* ==========================================================
     SAFE REDIRECT
  ========================================================== */

  const getSafeRedirect =
    () => {
      if (
        !redirectParam
      ) {
        return "/";
      }

      /*
       * Only allow internal routes.
       */

      if (
        !redirectParam.startsWith(
          "/"
        )
      ) {
        return "/";
      }

      /*
       * Block //external.com
       */

      if (
        redirectParam.startsWith(
          "//"
        )
      ) {
        return "/";
      }

      return redirectParam;
    };

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     RESTORE PENDING CART
     
     IMPORTANT:
     No medicine API call here.
     
     Medicine data was already saved locally
     when the customer clicked Add to Cart.
  ========================================================== */

  const restorePendingCart =
    () => {
      try {
        const raw =
          window.localStorage.getItem(
            PENDING_CART_ITEM_KEY
          );

        if (!raw) {
          return false;
        }

        const pendingItem =
          JSON.parse(
            raw
          ) as Partial<PendingCartItem>;

        /* ====================================================
           VALIDATE PENDING ITEM
        ==================================================== */

        if (
          !pendingItem ||
          !pendingItem.medicineId ||
          !pendingItem.name
        ) {
          window.localStorage.removeItem(
            PENDING_CART_ITEM_KEY
          );

          return false;
        }

        const stock =
          Number(
            pendingItem.stock ??
              0
          );

        const price =
          Number(
            pendingItem.price ??
              0
          );

        const quantity =
          Math.max(
            1,
            Math.floor(
              Number(
                pendingItem.quantity ??
                  1
              )
            )
          );

        /*
         * Medicine may have gone out of stock
         * while the customer was logging in.
         */

        if (
          stock <= 0
        ) {
          window.localStorage.removeItem(
            PENDING_CART_ITEM_KEY
          );

          throw new Error(
            "This medicine is currently out of stock."
          );
        }

        /* ====================================================
           ADD TO REAL CART
        ==================================================== */

        addToCart({
          medicineId:
            pendingItem.medicineId,

          name:
            pendingItem.name,

          slug:
            pendingItem.slug ||
            pendingItem.medicineId,

          genericName:
            pendingItem.genericName,

          image:
            pendingItem.image,

          price:
            Number.isFinite(
              price
            )
              ? price
              : 0,

          quantity,

          stock,
        });

        /* ====================================================
           REMOVE PENDING ITEM
        ==================================================== */

        window.localStorage.removeItem(
          PENDING_CART_ITEM_KEY
        );

        return true;
      } catch (error) {
        /*
         * Remove broken pending data so it
         * does not repeatedly break login.
         */

        window.localStorage.removeItem(
          PENDING_CART_ITEM_KEY
        );

        console.error(
          "Pending cart restore error:",
          error
        );

        if (
          error instanceof Error
        ) {
          throw error;
        }

        throw new Error(
          "Unable to restore the selected medicine."
        );
      }
    };

  /* ==========================================================
     POST LOGIN REDIRECT
  ========================================================== */

  const handlePostLoginRedirect =
    () => {
      const destination =
        getSafeRedirect();

      /* ======================================================
         PENDING CART
      ====================================================== */

      if (
        destination ===
          "/cart?pendingCart=true" ||
        destination.startsWith(
          "/cart?pendingCart=true&"
        )
      ) {
        restorePendingCart();

        router.replace(
          "/cart"
        );

        router.refresh();

        return;
      }

      /* ======================================================
         BACKWARD COMPATIBILITY
         
         In case an older AddToCartButton
         still uses /cart?add=...
         
         We DO NOT call the medicine API.
         Instead, if pending data exists, restore it.
      ====================================================== */

      if (
        destination.startsWith(
          "/cart?add="
        )
      ) {
        restorePendingCart();

        router.replace(
          "/cart"
        );

        router.refresh();

        return;
      }

      /* ======================================================
         BUY NOW
      ====================================================== */

      if (
        destination.startsWith(
          "/checkout?medicine="
        )
      ) {
        router.replace(
          destination
        );

        router.refresh();

        return;
      }

      /* ======================================================
         NORMAL LOGIN
      ====================================================== */

      router.replace(
        destination
      );

      router.refresh();
    };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (loading) {
        return;
      }

      setError("");

      /* ======================================================
         NORMALIZE
      ====================================================== */

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      /* ======================================================
         VALIDATION
      ====================================================== */

      if (!cleanEmail) {
        setError(
          "Email is required."
        );

        return;
      }

      if (!password) {
        setError(
          "Password is required."
        );

        return;
      }

      /* ======================================================
         LOGIN
      ====================================================== */

      try {
        setLoading(true);

        /* ====================================================
           BACKEND URL
        ==================================================== */

        const apiBaseUrl =
          process.env
            .NEXT_PUBLIC_API_URL?.trim();

        if (!apiBaseUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        const cleanApiUrl =
          apiBaseUrl.replace(
            /\/+$/,
            ""
          );

        const endpoint =
          `${cleanApiUrl}/api/auth/customer/login`;

        console.log(
          "[CUSTOMER LOGIN] Backend:",
          endpoint
        );

        /* ====================================================
           DIRECT BACKEND REQUEST
           
           No Client API / Proxy.
        ==================================================== */

        const response =
          await fetch(
            endpoint,
            {
              method: "POST",

              mode: "cors",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify({
                email:
                  cleanEmail,

                password,
              }),
            }
          );

        /* ====================================================
           RESPONSE TEXT
        ==================================================== */

        const responseText =
          await response.text();

        console.log(
          "[CUSTOMER LOGIN] Status:",
          response.status
        );

        let result:
          | LoginResponse
          | null = null;

        /* ====================================================
           JSON PARSE
        ==================================================== */

        try {
          result =
            responseText
              ? (JSON.parse(
                  responseText
                ) as LoginResponse)
              : null;
        } catch {
          console.error(
            "[CUSTOMER LOGIN] NON-JSON RESPONSE:",
            responseText.slice(
              0,
              1000
            )
          );

          throw new Error(
            `Login API returned invalid response (${response.status}).`
          );
        }

        /* ====================================================
           API ERROR
        ==================================================== */

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              `Login failed (${response.status}).`
          );
        }

        /* ====================================================
           CUSTOMER VALIDATION
        ==================================================== */

        const user =
          result.data?.user;

        if (
          !user ||
          user.role !==
            "CUSTOMER"
        ) {
          throw new Error(
            "Invalid customer account."
          );
        }

        if (
          !user.isActive
        ) {
          throw new Error(
            "Your customer account is currently inactive."
          );
        }

        /* ====================================================
           LOGIN SUCCESS
        ==================================================== */

        handlePostLoginRedirect();
      } catch (error) {
        console.error(
          "CUSTOMER LOGIN ERROR:",
          error
        );

        /* ====================================================
           CONNECTION ERROR
        ==================================================== */

        if (
          error instanceof
            TypeError &&
          error.message ===
            "Failed to fetch"
        ) {
          setError(
            "Unable to connect to the backend server. Make sure Backend is running on port 3000 and Client is running on port 3001."
          );

          return;
        }

        /* ====================================================
           NORMAL ERROR
        ==================================================== */

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while logging in."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        {/* ==================================================
            BACKGROUND
        =================================================== */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-100/60 blur-3xl" />

        {/* ==================================================
            CONTAINER
        =================================================== */}

        <div className="relative z-10 mx-auto grid w-full max-w-[1100px] items-center gap-10 lg:grid-cols-2">
          {/* =================================================
              LEFT
          ================================================== */}

          <div className="hidden lg:block">
            <div className="max-w-lg">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Smart Pharmacy
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
                Welcome back to your
                <span className="text-emerald-600">
                  {" "}
                  pharmacy account
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                Sign in to manage your medicines,
                shopping cart, orders and healthcare
                services.
              </p>

              <div className="mt-8 space-y-3">
                <FeatureItem
                  title="Your Medicines"
                  description="Browse and discover available medicines."
                />

                <FeatureItem
                  title="Your Orders"
                  description="Manage and track your pharmacy orders."
                />

                <FeatureItem
                  title="Your Healthcare"
                  description="Access smart healthcare support."
                />
              </div>
            </div>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================== */}

          <div className="mx-auto w-full max-w-[500px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7 lg:p-8">
              {/* Header */}

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-100">
                  <LoginIcon />
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  Welcome Back
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Sign in to your Smart Pharmacy account.
                </p>
              </div>

              {/* =================================================
                  REDIRECT NOTICE
              ================================================== */}

              {redirectParam && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <p className="text-xs font-medium leading-5 text-emerald-700">
                    Please sign in to continue.
                  </p>
                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
                >
                  <p className="text-xs font-medium leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-6 space-y-4"
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MailIcon />
                    </span>

                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={
                        email
                      }
                      onChange={(
                        event
                      ) => {
                        setEmail(
                          event.target.value
                        );

                        if (
                          error
                        ) {
                          setError("");
                        }
                      }}
                      placeholder="Enter your email"
                      disabled={
                        loading
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <span className="text-[10px] text-slate-400">
                      Secure login
                    </span>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LockIcon />
                    </span>

                    <input
                      id="login-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) => {
                        setPassword(
                          event.target.value
                        );

                        if (
                          error
                        ) {
                          setError("");
                        }
                      }}
                      placeholder="Enter your password"
                      disabled={
                        loading
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      disabled={
                        loading
                      }
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOffIcon />
                      ) : (
                        <EyeIcon />
                      )}
                    </button>
                  </div>
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowIcon />
                    </>
                  )}
                </button>
              </form>

              {/* =================================================
                  REGISTER
              ================================================== */}

              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs text-slate-400 sm:text-sm">
                  Do not have an account?
                </p>

                <Link
                  href="/register"
                  className="mt-1 inline-block text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                >
                  Create a new account
                </Link>
              </div>

              {/* =================================================
                  SECURITY
              ================================================== */}

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3">
                <span className="mt-0.5 text-emerald-600">
                  <ShieldIcon />
                </span>

                <p className="text-[10px] leading-5 text-slate-400">
                  Your customer session is protected using
                  a secure HttpOnly authentication cookie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   LOGIN FORM WRAPPER
   Next.js requires useSearchParams() to render below a Suspense
   boundary during production builds.
============================================================ */

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            <span className="text-sm font-medium text-slate-500">
              Loading login...
            </span>
          </div>
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

/* ============================================================
   FEATURE ITEM
============================================================ */

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <CheckIcon />
      </span>

      <div>
        <p className="text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN ICON
============================================================ */

function LoginIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 5H18C19.1 5 20 5.9 20 7V17C20 18.1 19.1 19 18 19H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M4 12H15M11 8L15 12L11 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   MAIL ICON
============================================================ */

function MailIcon() {
  return (
    <svg
      width="17"
      height="17"
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

/* ============================================================
   LOCK ICON
============================================================ */

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5C8 5.3 9.8 3.5 12 3.5C14.2 3.5 16 5.3 16 7.5V10"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="15"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

/* ============================================================
   EYE ICON
============================================================ */

function EyeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12C5.2 8.2 8.2 6.3 12 6.3C15.8 6.3 18.8 8.2 21 12C18.8 15.8 15.8 17.7 12 17.7C8.2 17.7 5.2 15.8 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/* ============================================================
   EYE OFF ICON
============================================================ */

function EyeOffIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9.5 6.7C10.3 6.4 11.1 6.3 12 6.3C15.8 6.3 18.8 8.2 21 12C20.1 13.6 19 14.8 17.7 15.7M14.5 17.1C13.7 17.5 12.8 17.7 12 17.7C8.2 15.8 5.2 12.8 3 12C3.8 10.6 4.7 9.5 5.8 8.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M10.6 10.6C9.9 11.4 10 12.6 10.8 13.3C11.6 14 12.8 14 13.5 13.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   CHECK ICON
============================================================ */

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   SHIELD ICON
============================================================ */

function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11.5C19 16.1 16.1 19.3 12 21C7.9 19.3 5 16.1 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   ARROW ICON
============================================================ */

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   SPINNER
============================================================ */

function SpinnerIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />

      <path
        d="M21 12C21 7.03 16.97 3 12 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}