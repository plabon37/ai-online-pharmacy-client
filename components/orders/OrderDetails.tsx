"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

/* ============================================================
   TYPES
============================================================ */

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentMethod =
  | "COD"
  | "ONLINE";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  medicine?: {
    _id?: string;
    name?: string;
    image?: string;
    price?: number;
  } | null;
};

type ShippingAddress = {
  name: string;
  phone: string;
  address: string;
  city: string;
  area?: string;
  postalCode?: string;
};

type CustomerOrder = {
  _id: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

type OrderResponse = {
  success?: boolean;
  data?: CustomerOrder | null;
  message?: string;
};

/* ============================================================
   PROPS
============================================================ */

type Props = {
  orderId: string;
};

/* ============================================================
   API
============================================================ */

function getApiBaseUrl() {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured."
    );
  }

  return apiUrl.replace(
    /\/+$/,
    ""
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function OrderDetails({
  orderId,
}: Props) {
  const router =
    useRouter();

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    order,
    setOrder,
  ] = useState<CustomerOrder | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     FETCH ORDER
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const fetchOrder =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const baseUrl =
            getApiBaseUrl();

          const response =
            await fetch(
              `${baseUrl}/api/orders/${encodeURIComponent(
                orderId
              )}`,
              {
                method:
                  "GET",

                mode:
                  "cors",

                headers: {
                  Accept:
                    "application/json",
                },

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const text =
            await response.text();

          let result:
            | OrderResponse
            | null = null;

          try {
            result = text
              ? (JSON.parse(
                  text
                ) as OrderResponse)
              : null;
          } catch {
            throw new Error(
              `Order API returned an invalid response (${response.status}).`
            );
          }

          if (
            response.status ===
            401
          ) {
            router.push(
              `/login?redirect=${encodeURIComponent(
                `/orders/${orderId}`
              )}`
            );

            return;
          }

          if (
            response.status ===
            404
          ) {
            throw new Error(
              "Order not found."
            );
          }

          if (
            !response.ok ||
            !result?.success ||
            !result.data
          ) {
            throw new Error(
              result?.message ||
                "Failed to load order."
            );
          }

          if (
            !cancelled
          ) {
            setOrder(
              result.data
            );
          }
        } catch (error) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Order Details Error:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Unable to load order."
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [
    orderId,
    router,
  ]);

  /* ==========================================================
     DOWNLOAD / PRINT ORDER
  ========================================================== */

  const handleDownloadOrder =
    () => {
      /*
       * Browser Print dialog allows:
       * Print → Save as PDF
       *
       * Print CSS below hides non-invoice elements.
       */
      window.print();
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <SpinnerIcon />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Loading order...
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Please wait a moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !order
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ErrorIcon />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load order
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "Order not found."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/orders"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white"
              >
                Back to My Orders
              </Link>

              <Link
                href="/medicines"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
              >
                Browse Medicines
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* ======================================================
          PRINT STYLES
      ======================================================= */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          header,
          nav,
          footer,
          .print-hidden {
            display: none !important;
          }

          .print-page {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }

          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
          }

          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }

          .print-only {
            display: block !important;
          }
        }

        .print-only {
          display: none;
        }
      `}</style>

      <main className="print-page min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="print-container mx-auto w-full max-w-[1100px]">
          {/* ==================================================
              TOP ACTIONS
          =================================================== */}

          <div className="print-hidden mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/orders"
              className="inline-flex w-fit items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              ← Back to My Orders
            </Link>

            <button
              type="button"
              onClick={
                handleDownloadOrder
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <DownloadIcon />
              Download Order
            </button>
          </div>

          {/* ==================================================
              PRINT HEADER
          =================================================== */}

          <div className="print-only mb-6">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-2xl font-extrabold text-slate-900">
                Smart Pharmacy
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Order Invoice
              </p>
            </div>
          </div>

          {/* ==================================================
              PAGE HEADER
          =================================================== */}

          <div className="mb-6">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              Order Details
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Order #{order._id}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Placed on{" "}
              {formatDateTime(
                order.createdAt
              )}
            </p>
          </div>

          {/* ==================================================
              MAIN ORDER CARD
          =================================================== */}

          <section className="print-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* =================================================
                ORDER STATUS HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Order Status
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={
                      order.status
                    }
                  />

                  <PaymentBadge
                    status={
                      order.paymentStatus
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 px-4 py-3 lg:min-w-[190px] lg:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                  Total Amount
                </p>

                <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                  ৳
                  {Number(
                    order.totalAmount ||
                      0
                  ).toFixed(
                    2
                  )}
                </p>
              </div>
            </div>

            {/* =================================================
                ITEMS
            ================================================== */}

            <div className="p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Order Items
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Medicines
                </h2>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[1fr_100px_100px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:grid">
                  <span>
                    Medicine
                  </span>

                  <span>
                    Price
                  </span>

                  <span>
                    Quantity
                  </span>

                  <span className="text-right">
                    Total
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.items.map(
                    (
                      item,
                      index
                    ) => {
                      const itemTotal =
                        Number(
                          item.price ||
                            0
                        ) *
                        Number(
                          item.quantity ||
                            0
                        );

                      const image =
                        item.image ||
                        item.medicine
                          ?.image ||
                        "";

                      return (
                        <div
                          key={`${item.name}-${index}`}
                          className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_100px_100px_120px] sm:items-center sm:gap-4"
                        >
                          {/* Medicine */}

                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    item.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <MedicineIcon />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {
                                  item.name
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-slate-400 sm:hidden">
                                ৳
                                {Number(
                                  item.price ||
                                    0
                                ).toFixed(
                                  2
                                )}{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </p>
                            </div>
                          </div>

                          {/* Price */}

                          <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-slate-700">
                              ৳
                              {Number(
                                item.price ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </p>
                          </div>

                          {/* Quantity */}

                          <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                item.quantity
                              }
                            </p>
                          </div>

                          {/* Total */}

                          <div className="sm:text-right">
                            <p className="text-sm font-bold text-slate-900">
                              ৳
                              {itemTotal.toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                INFORMATION
            ================================================== */}

            <div className="grid gap-5 border-t border-slate-100 p-5 sm:p-6 lg:grid-cols-2">
              {/* Shipping */}

              <section className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  Delivery Information
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Shipping Address
                </h3>

                <div className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
                  <InfoLine
                    label="Name"
                    value={
                      order
                        .shippingAddress
                        ?.name ||
                      "—"
                    }
                  />

                  <InfoLine
                    label="Phone"
                    value={
                      order
                        .shippingAddress
                        ?.phone ||
                      "—"
                    }
                  />

                  <InfoLine
                    label="Address"
                    value={
                      order
                        .shippingAddress
                        ?.address ||
                      "—"
                    }
                  />

                  <InfoLine
                    label="City"
                    value={
                      order
                        .shippingAddress
                        ?.city ||
                      "—"
                    }
                  />

                  <InfoLine
                    label="Area"
                    value={
                      order
                        .shippingAddress
                        ?.area ||
                      "—"
                    }
                  />

                  <InfoLine
                    label="Postal Code"
                    value={
                      order
                        .shippingAddress
                        ?.postalCode ||
                      "—"
                    }
                  />
                </div>
              </section>

              {/* Payment */}

              <section className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  Payment Information
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Payment Details
                </h3>

                <div className="mt-4 space-y-3">
                  <InfoLine
                    label="Method"
                    value={
                      order.paymentMethod ===
                      "ONLINE"
                        ? "Online Payment"
                        : "Cash on Delivery"
                    }
                  />

                  <InfoLine
                    label="Status"
                    value={
                      order.paymentStatus
                    }
                  />

                  <InfoLine
                    label="Order Status"
                    value={
                      order.status
                    }
                  />

                  <InfoLine
                    label="Order Date"
                    value={formatDateTime(
                      order.createdAt
                    )}
                  />

                  <InfoLine
                    label="Updated"
                    value={formatDateTime(
                      order.updatedAt
                    )}
                  />
                </div>

                {order.paymentMethod ===
                  "ONLINE" && (
                  <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold text-cyan-800">
                      Prototype Payment
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-cyan-700">
                      Online payment is currently simulated.
                      No real payment was processed.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* =================================================
                TOTAL
            ================================================== */}

            <div className="border-t border-slate-100 p-5 sm:p-6">
              <div className="ml-auto max-w-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Items Total
                  </span>

                  <span className="text-sm font-semibold text-slate-700">
                    ৳
                    {Number(
                      order.totalAmount ||
                        0
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">
                    Grand Total
                  </span>

                  <span className="text-2xl font-extrabold text-emerald-600">
                    ৳
                    {Number(
                      order.totalAmount ||
                        0
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              BOTTOM ACTIONS
          =================================================== */}

          <div className="print-hidden mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/medicines"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Continue Shopping
            </Link>

            <button
              type="button"
              onClick={
                handleDownloadOrder
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <DownloadIcon />
              Download Order
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

/* ============================================================
   INFO LINE
============================================================ */

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 font-medium text-slate-400">
        {label}
      </span>

      <span className="text-right font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const classes: Record<
    OrderStatus,
    string
  > = {
    PENDING:
      "bg-amber-50 text-amber-700",

    CONFIRMED:
      "bg-cyan-50 text-cyan-700",

    PROCESSING:
      "bg-blue-50 text-blue-700",

    SHIPPED:
      "bg-violet-50 text-violet-700",

    DELIVERED:
      "bg-emerald-50 text-emerald-700",

    CANCELLED:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${classes[status]}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   PAYMENT BADGE
============================================================ */

function PaymentBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const classes: Record<
    PaymentStatus,
    string
  > = {
    PENDING:
      "bg-amber-50 text-amber-700",

    PAID:
      "bg-emerald-50 text-emerald-700",

    FAILED:
      "bg-red-50 text-red-700",

    REFUNDED:
      "bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${classes[status]}`}
    >
      Payment: {status}
    </span>
  );
}

/* ============================================================
   DATE
============================================================ */

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   MEDICINE ICON
============================================================ */

function MedicineIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 3.5H15.5C16.6 3.5 17.5 4.4 17.5 5.5V18.5C17.5 19.6 16.6 20.5 15.5 20.5H8.5C7.4 20.5 6.5 19.6 6.5 18.5V5.5C6.5 4.4 7.4 3.5 8.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M9.5 8H14.5M12 5.5V10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   DOWNLOAD ICON
============================================================ */

function DownloadIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M7 11L12 16L17 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 21H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
      width="22"
      height="22"
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
        opacity="0.25"
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

/* ============================================================
   ERROR ICON
============================================================ */

function ErrorIcon() {
  return (
    <svg
      width="25"
      height="25"
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
        d="M12 7V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}