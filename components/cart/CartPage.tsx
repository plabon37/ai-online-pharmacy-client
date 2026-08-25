"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  type CartItem,
} from "@/lib/cart/cart";

export default function CartPage() {
  const [
    cart,
    setCart,
  ] = useState<CartItem[]>(
    () => getCart()
  );

  const [
    clearing,
    setClearing,
  ] = useState(false);

  /* ==========================================================
     TOTAL ITEMS
  ========================================================== */

  const totalItems =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        ),
      [cart]
    );

  /* ==========================================================
     TOTAL PRICE
  ========================================================== */

  const totalPrice =
    useMemo(
      () =>
        getCartTotal(
          cart
        ),
      [cart]
    );

  /* ==========================================================
     UPDATE QUANTITY
  ========================================================== */

  const handleQuantityChange =
    (
      medicineId: string,
      quantity: number
    ) => {
      const nextCart =
        updateCartQuantity(
          medicineId,
          quantity
        );

      setCart(
        nextCart
      );
    };

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const handleRemove =
    (
      medicineId: string
    ) => {
      const nextCart =
        removeFromCart(
          medicineId
        );

      setCart(
        nextCart
      );
    };

  /* ==========================================================
     CLEAR CART
  ========================================================== */

  const handleClearCart =
    () => {
      if (
        cart.length === 0 ||
        clearing
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to clear your cart?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setClearing(
          true
        );

        clearCart();

        setCart(
          []
        );
      } finally {
        setClearing(
          false
        );
      }
    };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="text-slate-400 transition hover:text-emerald-600"
            >
              Home
            </Link>

            <ChevronIcon />

            <span className="font-semibold text-slate-700">
              Cart
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
                Shopping
              </p>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                My Cart
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Review your selected medicines before checkout.
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={
                  handleClearCart
                }
                disabled={
                  clearing
                }
                className="inline-flex h-10 w-fit items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearing
                  ? "Clearing..."
                  : "Clear Cart"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {cart.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* =================================================
                CART ITEMS
            ================================================== */}

            <div className="space-y-3">
              {/* Summary */}

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                      Cart Items
                    </p>

                    <h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      {totalItems}{" "}
                      {totalItems ===
                      1
                        ? "item"
                        : "items"}
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CartIcon />
                  </div>
                </div>
              </div>

              {/* Items */}

              {cart.map(
                (item) => (
                  <CartItemCard
                    key={
                      item.medicineId
                    }
                    item={
                      item
                    }
                    onQuantityChange={
                      handleQuantityChange
                    }
                    onRemove={
                      handleRemove
                    }
                  />
                )
              )}
            </div>

            {/* =================================================
                SUMMARY
            ================================================== */}

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <OrderSummary
                totalItems={
                  totalItems
                }
                totalPrice={
                  totalPrice
                }
              />
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

/* ============================================================
   CART ITEM CARD
============================================================ */

function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (
    medicineId: string,
    quantity: number
  ) => void;
  onRemove: (
    medicineId: string
  ) => void;
}) {
  const itemTotal =
    item.price *
    item.quantity;

  const maxStock =
    Math.max(
      1,
      item.stock
    );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-4">
        {/* IMAGE */}

        <Link
          href={`/medicines/${item.slug}`}
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 sm:h-28 sm:w-28"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={
                item.name
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <MedicinePlaceholder />
          )}
        </Link>

        {/* DETAILS */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/medicines/${item.slug}`}
                className="block truncate text-sm font-bold text-slate-800 transition hover:text-emerald-600 sm:text-base"
              >
                {item.name}
              </Link>

              {item.genericName && (
                <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
                  {
                    item.genericName
                  }
                </p>
              )}
            </div>

            {/* REMOVE */}

            <button
              type="button"
              onClick={() =>
                onRemove(
                  item.medicineId
                )
              }
              aria-label={`Remove ${item.name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon />
            </button>
          </div>

          {/* PRICE */}

          <p className="mt-3 text-sm font-extrabold text-emerald-600">
            ৳
            {item.price.toLocaleString(
              "en-BD",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </p>

          {/* BOTTOM */}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* QUANTITY */}

            <div className="flex w-fit items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() =>
                  onQuantityChange(
                    item.medicineId,
                    item.quantity -
                      1
                  )
                }
                disabled={
                  item.quantity <=
                  1
                }
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <MinusIcon />
              </button>

              <span className="flex h-9 min-w-[40px] items-center justify-center border-x border-slate-200 px-2 text-xs font-bold text-slate-800">
                {
                  item.quantity
                }
              </span>

              <button
                type="button"
                onClick={() =>
                  onQuantityChange(
                    item.medicineId,
                    item.quantity +
                      1
                  )
                }
                disabled={
                  item.quantity >=
                  maxStock
                }
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <PlusIcon />
              </button>
            </div>

            {/* ITEM TOTAL */}

            <div className="text-left sm:text-right">
              <p className="text-[10px] text-slate-400">
               Total Item
              </p>

              <p className="mt-0.5 text-base font-extrabold text-slate-900">
                ৳
                {itemTotal.toLocaleString(
                  "en-BD",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>
          </div>

          {/* STOCK */}

          <p className="mt-3 text-[9px] text-slate-400">
            {item.stock}{" "}
            {item.stock ===
            1
              ? "unit"
              : "units"}{" "}
            available
          </p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   ORDER SUMMARY
============================================================ */

function OrderSummary({
  totalItems,
  totalPrice,
}: {
  totalItems: number;
  totalPrice: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
        Order Summary
      </p>

      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        Review & Checkout
      </h2>

      <div className="mt-6 space-y-3">
        <SummaryRow
          label="Items"
          value={String(
            totalItems
          )}
        />

        <SummaryRow
          label="Subtotal"
          value={`৳${totalPrice.toLocaleString(
            "en-BD",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`}
        />

        <SummaryRow
          label="Delivery"
          value="Calculated at checkout"
        />
      </div>

      <div className="my-5 h-px bg-slate-100" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">
          Total
        </span>

        <span className="text-xl font-extrabold text-emerald-600">
          ৳
          {totalPrice.toLocaleString(
            "en-BD",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </span>
      </div>

      <Link
        href="/checkout"
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        Proceed to Checkout
        <ArrowIcon />
      </Link>

      <Link
        href="/medicines"
        className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        Continue Shopping
      </Link>

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] leading-5 text-slate-400">
          Your cart is currently stored securely in this
          browser. Your final order will be saved to your
          pharmacy account during checkout.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   EMPTY CART
============================================================ */

function EmptyCart() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center shadow-sm sm:px-8 sm:py-20">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500">
        <CartIcon large />
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
        Shopping Cart
      </p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Your cart is empty
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
        You have not added any medicines to your cart yet.
        Browse the pharmacy and add the products you need.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/medicines"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white transition hover:bg-emerald-700"
        >
          Browse Medicines
          <ArrowIcon />
        </Link>

        <Link
          href="/categories"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          Browse Categories
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   MEDICINE PLACEHOLDER
============================================================ */

function MedicinePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-emerald-300">
      <MedicineIcon />
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function CartIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 38 : 19;

  return (
    <svg
      width={size}
      height={size}
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

function MedicineIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8.5 8H15.5M8.5 12H15.5M8.5 16H12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9 7V5H15V7M8 10V18M12 10V18M16 10V18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M7 7L8 20H16L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
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

function ChevronIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-300"
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}