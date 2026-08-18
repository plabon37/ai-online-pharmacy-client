"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

/* ============================================================
   API RESPONSE
============================================================ */

type RegisterResponse = {
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
   FORM
============================================================ */

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function RegisterForm() {
  const router =
    useRouter();

  const [form, setForm] =
    useState<RegisterFormData>({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* ==========================================================
     UPDATE FIELD
  ========================================================== */

  const updateField = (
    field: keyof RegisterFormData,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
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
      setSuccess("");

      const name =
        form.name.trim();

      const email =
        form.email
          .trim()
          .toLowerCase();

      const password =
        form.password;

      const confirmPassword =
        form.confirmPassword;

      /* ======================================================
         VALIDATION
      ====================================================== */

      if (!name) {
        setError(
          "Name is required."
        );
        return;
      }

      if (name.length < 2) {
        setError(
          "Name must be at least 2 characters long."
        );
        return;
      }

      if (name.length > 100) {
        setError(
          "Name cannot exceed 100 characters."
        );
        return;
      }

      if (!email) {
        setError(
          "Email is required."
        );
        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }

      if (!password) {
        setError(
          "Password is required."
        );
        return;
      }

      if (password.length < 6) {
        setError(
          "Password must be at least 6 characters long."
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match."
        );
        return;
      }

      /* ======================================================
         DIRECT BACKEND REQUEST

         Client:
         http://localhost:3001

         Backend:
         http://localhost:3000
      ====================================================== */

      try {
        setLoading(true);

        const apiUrl =
          process.env
            .NEXT_PUBLIC_API_URL?.trim();

        if (!apiUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        const endpoint =
          `${apiUrl.replace(
            /\/+$/,
            ""
          )}/api/auth/customer/register`;

        console.log(
          "[REGISTER] Backend:",
          endpoint
        );

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
                name,
                email,
                password,
              }),
            }
          );

        const responseText =
          await response.text();

        let result:
          | RegisterResponse
          | null = null;

        try {
          result =
            responseText
              ? (JSON.parse(
                  responseText
                ) as RegisterResponse)
              : null;
        } catch {
          console.error(
            "[REGISTER] Non JSON:",
            responseText.slice(
              0,
              1000
            )
          );

          throw new Error(
            `Backend returned invalid response (${response.status}).`
          );
        }

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              `Registration failed (${response.status}).`
          );
        }

        /* ====================================================
           SUCCESS
        ==================================================== */

        setSuccess(
          "Account created successfully. Redirecting to login..."
        );

        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        window.setTimeout(
          () => {
            router.push(
              "/login"
            );
          },
          800
        );
      } catch (error) {
        console.error(
          "[REGISTER] ERROR:",
          error
        );

        if (
          error instanceof
            TypeError &&
          error.message ===
            "Failed to fetch"
        ) {
          setError(
            "Could not connect to the backend server. Make sure Backend is running on http://localhost:3000 and Client is running on http://localhost:3001."
          );

          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while creating your account."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-100/60 blur-3xl" />

        <div className="relative z-10 mx-auto grid w-full max-w-[1100px] items-center gap-10 lg:grid-cols-2">
          {/* LEFT */}

          <div className="hidden lg:block">
            <div className="max-w-lg">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Smart Pharmacy
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
                Create your
                <span className="text-emerald-600">
                  {" "}
                  pharmacy account
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                Create a customer account to browse
                medicines, manage your cart, place
                orders and access healthcare services.
              </p>

              <div className="mt-8 space-y-3">
                <FeatureItem
                  title="Browse Medicines"
                  description="Find medicines from our pharmacy."
                />

                <FeatureItem
                  title="Manage Orders"
                  description="Track your pharmacy orders easily."
                />

                <FeatureItem
                  title="Healthcare Support"
                  description="Access smarter healthcare features."
                />
              </div>
            </div>
          </div>

          {/* REGISTER */}

          <div className="mx-auto w-full max-w-[500px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7 lg:p-8">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-100">
                  <UserPlusIcon />
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  Create Account
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Register as a Smart Pharmacy customer.
                </p>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                  <p className="text-xs font-medium leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <p className="text-xs font-medium leading-5 text-emerald-700">
                    {success}
                  </p>
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="register-name"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <UserIcon />
                    </span>

                    <input
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      value={
                        form.name
                      }
                      onChange={(e) =>
                        updateField(
                          "name",
                          e.target
                            .value
                        )
                      }
                      placeholder="Enter your full name"
                      disabled={
                        loading
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MailIcon />
                    </span>

                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={
                        form.email
                      }
                      onChange={(e) =>
                        updateField(
                          "email",
                          e.target
                            .value
                        )
                      }
                      placeholder="Enter your email"
                      disabled={
                        loading
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                <PasswordInput
                  id="register-password"
                  label="Password"
                  value={
                    form.password
                  }
                  show={
                    showPassword
                  }
                  disabled={
                    loading
                  }
                  placeholder="Create a password"
                  onChange={(value) =>
                    updateField(
                      "password",
                      value
                    )
                  }
                  onToggle={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                />

                <PasswordInput
                  id="register-confirm-password"
                  label="Confirm Password"
                  value={
                    form.confirmPassword
                  }
                  show={
                    showConfirmPassword
                  }
                  disabled={
                    loading
                  }
                  placeholder="Confirm your password"
                  onChange={(value) =>
                    updateField(
                      "confirmPassword",
                      value
                    )
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (value) =>
                        !value
                    )
                  }
                />

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowIcon />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs text-slate-400 sm:text-sm">
                  Already have an account?
                </p>

                <Link
                  href="/login"
                  className="mt-1 inline-block text-sm font-bold text-emerald-600"
                >
                  Sign in to your account
                </Link>
              </div>

              <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
                By creating an account, you agree to use
                Smart Pharmacy responsibly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   PASSWORD INPUT
============================================================ */

function PasswordInput({
  id,
  label,
  value,
  show,
  disabled,
  placeholder,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  disabled: boolean;
  placeholder: string;
  onChange: (
    value: string
  ) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <LockIcon />
        </span>

        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={
            placeholder
          }
          disabled={
            disabled
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          disabled={
            disabled
          }
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400"
        >
          {show ? (
            <EyeOffIcon />
          ) : (
            <EyeIcon />
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   FEATURE
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
   ICONS
============================================================ */

function UserPlusIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="9"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M2.5 20C3.1 16.4 5.2 14.5 9 14.5C12.8 14.5 14.9 16.4 15.5 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M18 8V14M15 11H21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 20C5.6 16.4 8 14.5 12 14.5C16 14.5 18.4 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
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
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
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
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
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

function EyeOffIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 4L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.5 6.7C10.3 6.4 11.1 6.3 12 6.3C15.8 6.3 18.8 8.2 21 12C20.1 13.6 19 14.8 17.7 15.7M14.5 17.1C13.7 17.5 12.8 17.7 12 17.7C8.2 17.7 5.2 15.8 3 12C3.8 10.6 4.7 9.5 5.8 8.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
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

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
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

function SpinnerIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
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