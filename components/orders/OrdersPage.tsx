"use client";

import {
  useCallback,
  useSyncExternalStore,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

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
  } | null;
};

type CustomerOrder = {
  _id: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    area?: string;
    postalCode?: string;
  };
  items: OrderItem[];
  createdAt: string | null;
  updatedAt: string | null;
};

type OrdersResponse = {
  success?: boolean;

  data?: {
    customer?: {
      id: string;
      name: string;
      email: string;
    };

    orders?: CustomerOrder[];

    pagination?: {
      page: number;
      limit: number;
      totalOrders: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };

    filters?: {
      status?: string;
      paymentStatus?: string;
    };
  } | null;

  message?: string;
};

/* ============================================================
   CLIENT SNAPSHOT
============================================================ */

type OrdersSnapshot = {
  orders: CustomerOrder[];
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  pagination: {
    page: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  loading: boolean;
  error: string;
};

const EMPTY_SNAPSHOT: OrdersSnapshot = {
  orders: [],
  customer: null,
  pagination: {
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: true,
  error: "",
};

let ordersSnapshot =
  EMPTY_SNAPSHOT;

/* ============================================================
   EXTERNAL STORE
============================================================ */

const ORDERS_UPDATED_EVENT =
  "smart-pharmacy-orders-updated";

const ordersListeners =
  new Set<() => void>();

function subscribeToOrders(
  listener: () => void
) {
  ordersListeners.add(
    listener
  );

  return () => {
    ordersListeners.delete(
      listener
    );
  };
}

function notifyOrdersUpdated() {
  ordersListeners.forEach(
    (listener) =>
      listener()
  );
}

function getOrdersSnapshot() {
  return ordersSnapshot;
}

function getServerOrdersSnapshot() {
  return EMPTY_SNAPSHOT;
}

/* ============================================================
   API URL
============================================================ */

function getApiUrl() {
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
   FETCH ORDERS
============================================================ */

async function fetchCustomerOrders(
  page: number,
  limit = 10
) {
  try {
    ordersSnapshot = {
      ...ordersSnapshot,
      loading: true,
      error: "",
    };

    notifyOrdersUpdated();

    const baseUrl =
      getApiUrl();

    const response =
      await fetch(
        `${baseUrl}/api/orders/my?page=${page}&limit=${limit}`,
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

    const text =
      await response.text();

    let result:
      | OrdersResponse
      | null = null;

    try {
      result = text
        ? (JSON.parse(
            text
          ) as OrdersResponse)
        : null;
    } catch {
      throw new Error(
        `Orders API returned an invalid response (${response.status}).`
      );
    }

    /* ========================================================
       UNAUTHORIZED
    ======================================================== */

    if (
      response.status ===
      401
    ) {
      ordersSnapshot = {
        ...ordersSnapshot,
        loading: false,
        error:
          "Please sign in to view your orders.",
      };

      notifyOrdersUpdated();

      return {
        authenticated:
          false,
      };
    }

    /* ========================================================
       OTHER ERROR
    ======================================================== */

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          `Unable to fetch orders (${response.status}).`
      );
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    ordersSnapshot = {
      orders:
        result.data?.orders ||
        [],

      customer:
        result.data?.customer ||
        null,

      pagination:
        result.data?.pagination || {
          page,
          limit,
          totalOrders: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage:
            false,
        },

      loading: false,

      error: "",
    };

    notifyOrdersUpdated();

    return {
      authenticated:
        true,
    };
  } catch (error) {
    console.error(
      "Customer Orders Error:",
      error
    );

    ordersSnapshot = {
      ...ordersSnapshot,
      loading: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to fetch orders.",
    };

    notifyOrdersUpdated();

    return {
      authenticated:
        false,
    };
  }
}

/* ============================================================
   ORDERS PAGE
============================================================ */

export default function OrdersPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const successOrderId =
    searchParams.get(
      "success"
    );

  const snapshot =
    useSyncExternalStore(
      subscribeToOrders,
      getOrdersSnapshot,
      getServerOrdersSnapshot
    );

  /* ==========================================================
     LOAD ORDERS

     useCallback keeps the function stable.
  ========================================================== */

  const loadOrders =
    useCallback(
      (
        page: number
      ) => {
        void fetchCustomerOrders(
          page
        );
      },
      []
    );

  /* ==========================================================
     INITIAL LOAD

     Trigger through a microtask so the component can mount
     before updating the external store.
  ========================================================== */

  if (
    typeof window !==
      "undefined" &&
    snapshot.loading &&
    !snapshot.error &&
    ordersSnapshot ===
      EMPTY_SNAPSHOT
  ) {
    queueMicrotask(() => {
      void loadOrders(1);
    });
  }

  /* ==========================================================
     SUCCESS BANNER
  ========================================================== */

  const showSuccess =
    Boolean(
      successOrderId
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    snapshot.loading &&
    snapshot.orders.length ===
      0
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <SpinnerIcon />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Loading your orders...
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
    snapshot.error &&
    snapshot.orders.length ===
      0
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ErrorIcon />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load orders
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {snapshot.error}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {snapshot.error.includes(
                "sign in"
              ) ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/login?redirect=${encodeURIComponent(
                        "/orders"
                      )}`
                    )
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white"
                >
                  Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    void loadOrders(
                      1
                    )
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white"
                >
                  Try Again
                </button>
              )}

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1250px]">
        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="mb-7">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            My Pharmacy
          </span>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            My Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and track your medicine orders.
          </p>
        </div>

        {/* ==================================================
            SUCCESS
        =================================================== */}

        {showSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckIcon />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-800">
                  Order placed successfully!
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Your order has been received.
                </p>

                {successOrderId && (
                  <p className="mt-1 break-all font-mono text-[10px] text-emerald-600">
                    Order ID:{" "}
                    {
                      successOrderId
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            CUSTOMER INFO
        =================================================== */}

        {snapshot.customer && (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                  {getInitials(
                    snapshot
                      .customer
                      .name
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {
                      snapshot
                        .customer
                        .name
                    }
                  </p>

                  <p className="text-xs text-slate-400">
                    {
                      snapshot
                        .customer
                        .email
                    }
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
                {
                  snapshot
                    .pagination
                    .totalOrders
                }{" "}
                {snapshot
                  .pagination
                  .totalOrders ===
                1
                  ? "Order"
                  : "Orders"}
              </span>
            </div>
          </section>
        )}

        {/* ==================================================
            EMPTY
        =================================================== */}

        {snapshot.orders.length ===
        0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <OrderIcon />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You have not placed an order yet. Browse our
              medicines and place your first order.
            </p>

            <Link
              href="/medicines"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-100"
            >
              Browse Medicines
            </Link>
          </section>
        ) : (
          /* =================================================
             ORDER LIST
          ================================================== */

          <section className="space-y-4">
            {snapshot.orders.map(
              (order) => (
                <OrderCard
                  key={
                    order._id
                  }
                  order={
                    order
                  }
                />
              )
            )}
          </section>
        )}

        {/* ==================================================
            PAGINATION
        =================================================== */}

        {snapshot
          .pagination
          .totalPages >
          1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button
              type="button"
              disabled={
                !snapshot
                  .pagination
                  .hasPreviousPage
              }
              onClick={() =>
                void loadOrders(
                  snapshot
                    .pagination
                    .page -
                    1
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="text-xs font-semibold text-slate-500">
              Page{" "}
              {
                snapshot
                  .pagination
                  .page
              }{" "}
              of{" "}
              {
                snapshot
                  .pagination
                  .totalPages
              }
            </span>

            <button
              type="button"
              disabled={
                !snapshot
                  .pagination
                  .hasNextPage
              }
              onClick={() =>
                void loadOrders(
                  snapshot
                    .pagination
                    .page +
                    1
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ============================================================
   ORDER CARD
============================================================ */

function OrderCard({
  order,
}: {
  order: CustomerOrder;
}) {
  const firstItem =
    order.items[0];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* ======================================================
          TOP
      ======================================================= */}

      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Order ID
          </p>

          <p className="mt-1 font-mono text-xs font-bold text-slate-700">
            {order._id}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {formatDate(
              order.createdAt
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* ======================================================
          BODY
      ======================================================= */}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Medicine preview */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
              {firstItem?.image ? (
                <img
                  src={
                    firstItem.image
                  }
                  alt={
                    firstItem.name
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <MedicineIcon />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {firstItem?.name ||
                  "Medicine"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {order.items
                  .length}{" "}
                {order.items
                  .length ===
                1
                  ? "medicine"
                  : "medicines"}{" "}
                ·{" "}
                {getTotalQuantity(
                  order.items
                )}{" "}
                item
                {getTotalQuantity(
                  order.items
                ) ===
                1
                  ? ""
                  : "s"}
              </p>

              {order
                .items
                .length >
                1 && (
                <p className="mt-1 text-[10px] font-medium text-emerald-600">
                  +{" "}
                  {order.items
                    .length -
                    1}{" "}
                  more medicine
                  {order.items
                    .length -
                    1 ===
                  1
                    ? ""
                    : "s"}
                </p>
              )}
            </div>
          </div>

          {/* Payment */}

          <div className="rounded-2xl bg-slate-50 px-4 py-3 lg:min-w-[190px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Payment
            </p>

            <p className="mt-1 text-xs font-bold text-slate-700">
              {order.paymentMethod ===
              "ONLINE"
                ? "Online Payment"
                : "Cash on Delivery"}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {order.paymentStatus ===
              "PAID"
                ? "Payment completed"
                : order.paymentStatus ===
                    "PENDING"
                  ? "Payment pending"
                  : order.paymentStatus}
            </p>
          </div>

          {/* Total */}

          <div className="lg:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Total
            </p>

            <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-600">
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

        {/* ====================================================
            DETAILS
        ===================================================== */}

        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <DetailItem
            label="Delivery To"
            value={
              order
                .shippingAddress
                ?.name ||
              "—"
            }
          />

          <DetailItem
            label="City"
            value={
              order
                .shippingAddress
                ?.city ||
              "—"
            }
          />

          <DetailItem
            label="Phone"
            value={
              order
                .shippingAddress
                ?.phone ||
              "—"
            }
          />
        </div>

        {/* ====================================================
            VIEW
        ===================================================== */}

        <div className="mt-5 flex justify-end">
          <Link
            href={`/orders/${order._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            View Order
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
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
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes[status]}`}
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
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes[status]}`}
    >
      {status}
    </span>
  );
}

/* ============================================================
   DATE
============================================================ */

function formatDate(
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

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* ============================================================
   INITIALS
============================================================ */

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

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
}

/* ============================================================
   TOTAL QUANTITY
============================================================ */

function getTotalQuantity(
  items: OrderItem[]
) {
  return items.reduce(
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
   ORDER ICON
============================================================ */

function OrderIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 8H16M8 12H16M8 16H13"
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
      width="17"
      height="17"
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
   ARROW ICON
============================================================ */

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
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