"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  addToCart,
  type CartItem,
} from "@/lib/cart/cart";

/* ============================================================
   PENDING CART STORAGE
============================================================ */

export const PENDING_CART_ITEM_KEY =
  "smart_pharmacy_pending_cart_item";

/* ============================================================
   PROPS
============================================================ */

type Props = {
  medicine: CartItem;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function AddToCartButton({
  medicine,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [added, setAdded] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     HANDLE ADD
  ========================================================== */

  const handleAddToCart =
    async () => {
      if (
        loading ||
        medicine.stock <= 0
      ) {
        return;
      }

      setError("");
      setLoading(true);

      try {
        /* ====================================================
           CHECK CUSTOMER SESSION
        ==================================================== */

        const apiBaseUrl =
          process.env
            .NEXT_PUBLIC_API_URL?.trim();

        if (!apiBaseUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        const baseUrl =
          apiBaseUrl.replace(
            /\/+$/,
            ""
          );

        const sessionEndpoint =
          `${baseUrl}/api/auth/customer/session`;

        const sessionResponse =
          await fetch(
            sessionEndpoint,
            {
              method: "GET",

              mode: "cors",

              headers: {
                Accept:
                  "application/json",
              },

              credentials:
                "include",

              cache: "no-store",
            }
          );

        /* ====================================================
           LOGGED IN
        ==================================================== */

        if (
          sessionResponse.ok
        ) {
          const sessionText =
            await sessionResponse.text();

          let sessionResult:
            | {
                success?: boolean;
                data?: {
                  user?: {
                    role:
                      | "CUSTOMER"
                      | string;
                    isActive?: boolean;
                  };
                } | null;
                message?: string;
              }
            | null = null;

          try {
            sessionResult =
              sessionText
                ? JSON.parse(
                    sessionText
                  )
                : null;
          } catch {
            sessionResult =
              null;
          }

          const user =
            sessionResult?.data?.user;

          if (
            sessionResult?.success &&
            user?.role ===
              "CUSTOMER" &&
            user.isActive !== false
          ) {
            /* ================================================
               DIRECT LOCAL CART
            ================================================= */

            addToCart({
              ...medicine,
              quantity: 1,
            });

            setAdded(true);

            window.setTimeout(
              () => {
                setAdded(false);
              },
              1500
            );

            return;
          }
        }

        /* ====================================================
           NOT LOGGED IN
           
           Save COMPLETE medicine locally.
           
           No medicine API call will be required
           after login.
        ==================================================== */

        window.localStorage.setItem(
          PENDING_CART_ITEM_KEY,
          JSON.stringify({
            ...medicine,
            quantity: 1,
          })
        );

        /* ====================================================
           LOGIN REDIRECT
        ==================================================== */

        const redirect =
          "/cart?pendingCart=true";

        router.push(
          `/login?redirect=${encodeURIComponent(
            redirect
          )}`
        );
      } catch (error) {
        console.error(
          "Add to cart error:",
          error
        );

        if (
          error instanceof
            TypeError &&
          error.message ===
            "Failed to fetch"
        ) {
          /*
           * IMPORTANT:
           *
           * Even if session API is temporarily
           * unavailable, do NOT lose the medicine.
           *
           * Store it and send the customer to login.
           */

          try {
            window.localStorage.setItem(
              PENDING_CART_ITEM_KEY,
              JSON.stringify({
                ...medicine,
                quantity: 1,
              })
            );

            router.push(
              `/login?redirect=${encodeURIComponent(
                "/cart?pendingCart=true"
              )}`
            );

            return;
          } catch {
            setError(
              "Unable to continue. Please try again."
            );

            return;
          }
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to add medicine to cart."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     OUT OF STOCK
  ========================================================== */

  if (
    medicine.stock <= 0
  ) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 text-[9px] font-bold text-slate-400 sm:text-[10px]"
      >
        <CartIcon />
        Unavailable
      </button>
    );
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={
          handleAddToCart
        }
        disabled={loading}
        className={`flex h-10 w-full items-center justify-center gap-1 rounded-xl px-2 text-[9px] font-bold transition active:scale-[0.98] sm:text-[10px] ${
          added
            ? "bg-emerald-600 text-white"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        } ${
          loading
            ? "cursor-wait opacity-70"
            : ""
        }`}
      >
        {added ? (
          <>
            <CheckIcon />
            Added
          </>
        ) : (
          <>
            <CartIcon />

            {loading
              ? "Checking..."
              : "Add to Cart"}
          </>
        )}
      </button>

      {error && (
        <p className="mt-1 text-center text-[9px] leading-4 text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   CART ICON
============================================================ */

function CartIcon() {
  return (
    <svg
      width="14"
      height="14"
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

/* ============================================================
   CHECK ICON
============================================================ */

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
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