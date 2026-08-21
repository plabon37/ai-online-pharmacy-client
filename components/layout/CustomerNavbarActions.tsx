"use client";

import {
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCart,
} from "@/lib/cart/cart";

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

type NavItem = {
  label: string;

  href: string;
};

type Props = {
  customer:
    | CustomerUser
    | null;

  navItems: NavItem[];
};



/* ============================================================
   CART COUNT
============================================================ */

const CART_UPDATED_EVENT =
  "smart-pharmacy-cart-updated";

function getCartCount() {
  if (
    typeof window ===
    "undefined"
  ) {
    return 0;
  }

  try {
    const cart =
      getCart();

    return cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );
  } catch (error) {
    console.error(
      "Navbar Cart Count Error:",
      error
    );

    return 0;
  }
}

function subscribeToCart(
  callback: () => void
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  const handleCartUpdate =
    () => {
      callback();
    };

  const handleStorage =
    (
      event: StorageEvent
    ) => {
      if (
        event.key ===
          "smart_pharmacy_cart" ||
        event.key === null
      ) {
        callback();
      }
    };

  window.addEventListener(
    CART_UPDATED_EVENT,
    handleCartUpdate
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      CART_UPDATED_EVENT,
      handleCartUpdate
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}

function getServerCartCount() {
  return 0;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CustomerNavbarActions({
  customer,
  navItems,
}: Props) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  /* ==========================================================
     CART
  ========================================================== */

  const cartCount =
    useSyncExternalStore(
      subscribeToCart,
      getCartCount,
      getServerCartCount
    );

  /* ==========================================================
     CUSTOMER

     The server provides the currently authenticated customer.
     Protected customer APIs independently verify the account
     with requireCustomer(), including isActive.
  ========================================================== */

  const verifiedCustomer =
    customer;

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isActive = (
    href: string
  ) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  /* ==========================================================
     CLOSE MOBILE
  ========================================================== */

  const closeMobileMenu =
    () => {
      setMobileOpen(false);

      setProfileOpen(false);
    };

  /* ==========================================================
     TOGGLE MOBILE
  ========================================================== */

  const toggleMobileMenu =
    () => {
      setMobileOpen(
        (
          current
        ) => !current
      );

      setProfileOpen(
        false
      );
    };

  /* ==========================================================
     TOGGLE PROFILE
  ========================================================== */

  const toggleProfileMenu =
    () => {
      setProfileOpen(
        (
          current
        ) => !current
      );
    };

  /* ==========================================================
     INITIALS
  ========================================================== */

  const getInitials = (
    name: string
  ) => {
    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(
          Boolean
        );

    if (
      parts.length ===
      0
    ) {
      return "CU";
    }

    if (
      parts.length ===
      1
    ) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      `${parts[0][0]}${
        parts[
          parts.length - 1
        ][0]
      }`
    ).toUpperCase();
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        const apiUrl =
          process.env
            .NEXT_PUBLIC_API_URL?.trim();

        if (!apiUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        const response =
          await fetch(
            `${apiUrl}/api/auth/customer/logout`,
            {
              method:
                "POST",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const text =
          await response.text();

        let result:
          | {
              success?: boolean;

              message?: string;
            }
          | null = null;

        try {
          result = text
            ? JSON.parse(
                text
              )
            : null;
        } catch {
          throw new Error(
            `Logout API returned invalid response (${response.status}).`
          );
        }

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              "Logout failed."
          );
        }

        closeMobileMenu();

        /*
         * Keep cart.
         */

        router.replace(
          "/login"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Customer Logout Error:",
          error
        );

        window.alert(
          error instanceof
            Error
            ? error.message
            : "Logout failed."
        );
      } finally {
        setLoggingOut(
          false
        );
      }
    };

  return (
    <>
      {/* ======================================================
          DESKTOP / ACTIONS
      ======================================================= */}

      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* SEARCH */}

        <Link
          href="/search"
          aria-label="Search medicines"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isActive(
              "/search"
            )
              ? "bg-emerald-50 text-emerald-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
          }`}
        >
          <SearchIcon />
        </Link>

        {/* CART */}

        <Link
          href="/cart"
          aria-label={
            cartCount > 0
              ? `Shopping cart with ${cartCount} ${
                  cartCount ===
                  1
                    ? "item"
                    : "items"
                }`
              : "Shopping cart"
          }
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isActive(
              "/cart"
            )
              ? "bg-emerald-50 text-emerald-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
          }`}
        >
          <CartIcon />

          {cartCount >
            0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white">
              {cartCount >
              99
                ? "99+"
                : cartCount}
            </span>
          )}
        </Link>

        <span className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

        {/* ====================================================
            VERIFIED CUSTOMER
        ==================================================== */}

        {verifiedCustomer ? (
          <>
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={
                  toggleProfileMenu
                }
                aria-expanded={
                  profileOpen
                }
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                  {getInitials(
                    verifiedCustomer.name
                  )}
                </span>

                <span className="hidden max-w-[130px] truncate text-sm font-semibold text-slate-700 xl:block">
                  {
                    verifiedCustomer.name
                  }
                </span>

                <ChevronDownIcon />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-[70] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                >
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                        {getInitials(
                          verifiedCustomer.name
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {
                            verifiedCustomer.name
                          }
                        </p>

                        <p className="truncate text-[11px] text-slate-400">
                          {
                            verifiedCustomer.email
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <ProfileLink
                      href="/profile"
                      label="My Profile"
                      icon={
                        <UserIcon />
                      }
                    />

                    <ProfileLink
                      href="/orders"
                      label="My Orders"
                      icon={
                        <OrderIcon />
                      }
                    />

                    <ProfileLink
                      href="/prescription"
                      label="Prescription"
                      icon={
                        <PrescriptionIcon />
                      }
                    />

                    <ProfileLink
                      href="/cart"
                      label={
                        cartCount >
                        0
                          ? `My Cart (${cartCount})`
                          : "My Cart"
                      }
                      icon={
                        <CartIcon />
                      }
                    />

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      disabled={
                        loggingOut
                      }
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                        <LogoutIcon />
                      </span>

                      {loggingOut
                        ? "Signing out..."
                        : "Sign Out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-semibold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex"
          >
            Sign In
          </Link>
        )}

        {/* MOBILE BUTTON */}

        <button
          type="button"
          onClick={
            toggleMobileMenu
          }
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={
            mobileOpen
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600 lg:hidden"
        >
          {mobileOpen ? (
            <CloseIcon />
          ) : (
            <MenuIcon />
          )}
        </button>
      </div>

      {/* ======================================================
          MOBILE MENU
      ======================================================= */}

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[72px] z-[60] border-b border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
          <nav
            className="space-y-1"
            aria-label="Mobile navigation"
          >
            {navItems.map(
              (
                item
              ) => {
                const active =
                  isActive(
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={
                      closeMobileMenu
                    }
                    className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {
                      item.label
                    }
                  </Link>
                );
              }
            )}

            <Link
              href="/search"
              onClick={
                closeMobileMenu
              }
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <SearchIcon />
              Search
            </Link>

            <Link
              href="/cart"
              onClick={
                closeMobileMenu
              }
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <CartIcon />
                Cart
              </span>

              {cartCount >
                0 && (
                <span className="flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[9px] font-extrabold text-white">
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            <div className="my-2 h-px bg-slate-100" />

            {verifiedCustomer ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                    {getInitials(
                      verifiedCustomer.name
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {
                        verifiedCustomer.name
                      }
                    </p>

                    <p className="truncate text-[10px] text-slate-400">
                      {
                        verifiedCustomer.email
                      }
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={
                    closeMobileMenu
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <UserIcon />
                  My Profile
                </Link>

                <Link
                  href="/orders"
                  onClick={
                    closeMobileMenu
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <OrderIcon />
                  My Orders
                </Link>

                <Link
                  href="/prescription"
                  onClick={
                    closeMobileMenu
                  }
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <PrescriptionIcon />
                  Prescription
                </Link>

                <Link
                  href="/cart"
                  onClick={
                    closeMobileMenu
                  }
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <CartIcon />
                    My Cart
                  </span>

                  {cartCount >
                    0 && (
                    <span className="flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[9px] font-extrabold text-white">
                      {cartCount >
                      99
                        ? "99+"
                        : cartCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <LogoutIcon />

                  {loggingOut
                    ? "Signing out..."
                    : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={
                    closeMobileMenu
                  }
                  className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-100"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  onClick={
                    closeMobileMenu
                  }
                  className="mt-2 flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700"
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

/* ============================================================
   PROFILE LINK
============================================================ */

function ProfileLink({
  href,
  label,
  icon,
}: {
  href: string;

  label: string;

  icon: ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </span>

      {label}
    </Link>
  );
}

/* ============================================================
   ICONS
============================================================ */

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5H6L8.2 15.2C8.4 16.2 9.3 17 10.3 17H17.2C18.1 17 18.9 16.4 19.2 15.5L21 9H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="10.5"
        cy="20"
        r="1.2"
        fill="currentColor"
      />

      <circle
        cx="17"
        cy="20"
        r="1.2"
        fill="currentColor"
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
      aria-hidden="true"
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

function OrderIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 12H16M8 15H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3.5H14L18 7.5V20.5H6V3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.5V7.5H18"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 11H15M9 14H15M9 17H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function ChevronDownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}