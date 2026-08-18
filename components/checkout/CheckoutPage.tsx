"use client";

import {
  FormEvent,
  useSyncExternalStore,
  useState,
} from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  clearCart,
  getCart,
  getCartTotal,
  type CartItem,
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
} from "@/lib/cart/cart";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethod =
  | "COD"
  | "ONLINE";

type ShippingForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  postalCode: string;
};

type CreateOrderResponse = {
  success?: boolean;

  data?: {
    order?: {
      _id: string;
      totalAmount: number;
      status: string;
      paymentMethod:
        | "COD"
        | "ONLINE";
      paymentStatus:
        | "PENDING"
        | "PAID"
        | "FAILED"
        | "REFUNDED";
    };

    payment?: {
      method:
        | "COD"
        | "ONLINE";

      status:
        | "PENDING"
        | "PAID"
        | "FAILED"
        | "REFUNDED";

      isPrototype?: boolean;
    };
  } | null;

  message?: string;
};

/* ============================================================
   CART SUBSCRIPTION
   No useEffect required.
============================================================ */

/*
 * useSyncExternalStore requires the snapshots to be stable.
 * Keeping these references at module scope prevents React from
 * seeing a new array on every render and entering an update loop.
 */
const EMPTY_CART: CartItem[] = [];

let clientCartSnapshot: CartItem[] =
  EMPTY_CART;

/* ============================================================
   INITIAL CLIENT SNAPSHOT
============================================================ */

if (
  typeof window !==
  "undefined"
) {
  clientCartSnapshot =
    getCart();
}

/* ============================================================
   CART SUBSCRIPTION
============================================================ */

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
      clientCartSnapshot =
        getCart();

      callback();
    };

  const handleStorage =
    (event: StorageEvent) => {
      if (
        event.key ===
          CART_STORAGE_KEY ||
        event.key === null
      ) {
        clientCartSnapshot =
          getCart();

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

/* ============================================================
   CLIENT SNAPSHOT
============================================================ */

function getClientCartSnapshot() {
  return clientCartSnapshot;
}

/* ============================================================
   SERVER SNAPSHOT
============================================================ */

function getServerCartSnapshot(): CartItem[] {
  return EMPTY_CART;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CheckoutPage() {
  const router =
    useRouter();

  /* ==========================================================
     CART

     Server and first client render both use [].
     After hydration, useSyncExternalStore reads localStorage.
  ========================================================== */

  const cart =
    useSyncExternalStore(
      subscribeToCart,
      getClientCartSnapshot,
      getServerCartSnapshot
    );

  /* ==========================================================
     SHIPPING FORM
  ========================================================== */

  const [
    form,
    setForm,
  ] = useState<ShippingForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    postalCode: "",
  });

  /* ==========================================================
     PAYMENT
  ========================================================== */

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>(
    "COD"
  );

  /* ==========================================================
     UI
  ========================================================== */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     TOTALS
  ========================================================== */

  const subtotal =
    getCartTotal(cart);

  const deliveryCharge: number =
    0;

  const grandTotal =
    subtotal +
    deliveryCharge;

  /* ==========================================================
     UPDATE FORM
  ========================================================== */

  const updateField = (
    field: keyof ShippingForm,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* ==========================================================
     PLACE ORDER
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
         EMPTY CART
      ====================================================== */

      if (
        cart.length === 0
      ) {
        setError(
          "Your cart is empty."
        );

        return;
      }

      /* ======================================================
         NORMALIZE
      ====================================================== */

      const name =
        form.name.trim();

      const phone =
        form.phone.trim();

      const address =
        form.address.trim();

      const city =
        form.city.trim();

      const area =
        form.area.trim();

      const postalCode =
        form.postalCode.trim();

      /* ======================================================
         VALIDATION
      ====================================================== */

      if (!name) {
        setError(
          "Name is required."
        );

        return;
      }

      if (
        name.length < 2
      ) {
        setError(
          "Name must be at least 2 characters long."
        );

        return;
      }

      if (!phone) {
        setError(
          "Phone number is required."
        );

        return;
      }

      if (
        phone.length < 7
      ) {
        setError(
          "Please enter a valid phone number."
        );

        return;
      }

      if (!address) {
        setError(
          "Address is required."
        );

        return;
      }

      if (!city) {
        setError(
          "City is required."
        );

        return;
      }

      if (
        paymentMethod !==
          "COD" &&
        paymentMethod !==
          "ONLINE"
      ) {
        setError(
          "Please select a valid payment method."
        );

        return;
      }

      /* ======================================================
         BACKEND URL
      ====================================================== */

      const apiBaseUrl =
        process.env
          .NEXT_PUBLIC_API_URL?.trim();

      if (!apiBaseUrl) {
        setError(
          "NEXT_PUBLIC_API_URL is not configured."
        );

        return;
      }

      const cleanApiUrl =
        apiBaseUrl.replace(
          /\/+$/,
          ""
        );

      const endpoint =
        `${cleanApiUrl}/api/orders`;

      try {
        setLoading(true);

        /* ====================================================
           REQUEST BODY
        ==================================================== */

        const requestBody = {
          items:
            cart.map(
              (item) => ({
                medicineId:
                  item.medicineId,

                quantity:
                  item.quantity,
              })
            ),

          shippingAddress: {
            name,

            phone,

            address,

            city,

            area,

            postalCode,
          },

          paymentMethod,
        };

        /* ====================================================
           POST ORDER
        ==================================================== */

        const response =
          await fetch(
            endpoint,
            {
              method:
                "POST",

              mode:
                "cors",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  requestBody
                ),
            }
          );

        const responseText =
          await response.text();

        let result:
          | CreateOrderResponse
          | null = null;

        /* ====================================================
           PARSE
        ==================================================== */

        try {
          result =
            responseText
              ? (JSON.parse(
                  responseText
                ) as CreateOrderResponse)
              : null;
        } catch {
          console.error(
            "Checkout API non-JSON response:",
            responseText.slice(
              0,
              1000
            )
          );

          throw new Error(
            `Order API returned an invalid response (${response.status}).`
          );
        }

        /* ====================================================
           AUTH
        ==================================================== */

        if (
          response.status ===
          401
        ) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              "/checkout"
            )}`
          );

          return;
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
              `Unable to place order (${response.status}).`
          );
        }

        /* ====================================================
           SUCCESS
        ==================================================== */

        clearCart();

        const orderId =
          result.data?.order?._id;

        if (orderId) {
          router.replace(
            `/orders?success=${encodeURIComponent(
              orderId
            )}`
          );

          router.refresh();

          return;
        }

        router.replace(
          "/orders"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Checkout Order Error:",
          error
        );

        if (
          error instanceof
            TypeError &&
          error.message ===
            "Failed to fetch"
        ) {
          setError(
            "Unable to connect to the pharmacy server. Please make sure the Backend is running."
          );

          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to place your order."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     EMPTY CART
     
     During SSR/hydration this can temporarily show the empty
     state because server snapshot is [].
     
     After hydration, useSyncExternalStore updates it from
     localStorage without causing hydration mismatch.
  ========================================================== */

  if (
    cart.length === 0
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CartIcon />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add some medicines to your cart before
              continuing to checkout.
            </p>

            <Link
              href="/medicines"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5"
            >
              Browse Medicines
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     MAIN CHECKOUT
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="mb-7">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Secure Checkout
          </span>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Complete Your Order
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Enter your delivery information and choose
            your preferred payment method.
          </p>
        </div>

        {/* ==================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-medium leading-6 text-red-600">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* =================================================
                LEFT COLUMN
            ================================================== */}

            <div className="space-y-6">
              {/* ===============================================
                  DELIVERY
              ================================================ */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                    Step 1
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Delivery Information
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Where should we deliver your medicines?
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full Name"
                    required
                    value={
                      form.name
                    }
                    placeholder="Enter recipient name"
                    disabled={
                      loading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "name",
                        value
                      )
                    }
                  />

                  <Field
                    label="Phone Number"
                    required
                    type="tel"
                    value={
                      form.phone
                    }
                    placeholder="01XXXXXXXXX"
                    disabled={
                      loading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "phone",
                        value
                      )
                    }
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Full Address"
                      required
                      value={
                        form.address
                      }
                      placeholder="House, road, block, village etc."
                      disabled={
                        loading
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "address",
                          value
                        )
                      }
                    />
                  </div>

                  <Field
                    label="City"
                    required
                    value={
                      form.city
                    }
                    placeholder="Enter city"
                    disabled={
                      loading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "city",
                        value
                      )
                    }
                  />

                  <Field
                    label="Area"
                    value={
                      form.area
                    }
                    placeholder="Enter area"
                    disabled={
                      loading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "area",
                        value
                      )
                    }
                  />

                  <Field
                    label="Postal Code"
                    value={
                      form.postalCode
                    }
                    placeholder="Enter postal code"
                    disabled={
                      loading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "postalCode",
                        value
                      )
                    }
                  />
                </div>
              </section>

              {/* ===============================================
                  PAYMENT
              ================================================ */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                    Step 2
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Payment Method
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Choose your preferred payment method.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <PaymentOption
                    selected={
                      paymentMethod ===
                      "COD"
                    }
                    onSelect={() =>
                      setPaymentMethod(
                        "COD"
                      )
                    }
                    icon={
                      <CashIcon />
                    }
                    title="Cash on Delivery"
                    description="Pay when your order arrives."
                    disabled={
                      loading
                    }
                  />

                  <PaymentOption
                    selected={
                      paymentMethod ===
                      "ONLINE"
                    }
                    onSelect={() =>
                      setPaymentMethod(
                        "ONLINE"
                      )
                    }
                    icon={
                      <CardIcon />
                    }
                    title="Online Payment"
                    description="Prototype mode — no real payment."
                    badge="Prototype"
                    disabled={
                      loading
                    }
                  />
                </div>

                {paymentMethod ===
                  "ONLINE" && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-600">
                      <InfoIcon />
                    </span>

                    <div>
                      <p className="text-xs font-bold text-cyan-800">
                        Online payment is in prototype mode
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-cyan-700">
                        No real money will be charged. This
                        payment method will be treated as successful
                        for the prototype.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* =================================================
                RIGHT COLUMN
            ================================================== */}

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                      Step 3
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      Order Summary
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                    {
                      cart.length
                    }{" "}
                    {cart.length ===
                    1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                {/* Items */}

                <div className="mt-5 space-y-3">
                  {cart.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.medicineId
                        }
                        className="flex gap-3 rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                          {item.image ? (
                            <img
                              src={
                                item.image
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

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-800">
                            {
                              item.name
                            }
                          </p>

                          {item.genericName && (
                            <p className="mt-0.5 truncate text-[10px] text-slate-400">
                              {
                                item.genericName
                              }
                            </p>
                          )}

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              Qty:{" "}
                              {
                                item.quantity
                              }
                            </span>

                            <span className="text-xs font-bold text-slate-800">
                              ৳
                              {(
                                item.price *
                                item.quantity
                              ).toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Divider */}

                <div className="my-5 h-px bg-slate-100" />

                {/* Totals */}

                <div className="space-y-3">
                  <SummaryRow
                    label="Subtotal"
                    value={`৳${subtotal.toFixed(
                      2
                    )}`}
                  />

                  <SummaryRow
                    label="Delivery"
                    value={
                      deliveryCharge ===
                      0
                        ? "Free"
                        : `৳${deliveryCharge.toFixed(
                            2
                          )}`
                    }
                  />

                  <div className="h-px bg-slate-100" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Grand Total
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Final amount verified by server
                      </p>
                    </div>

                    <p className="text-2xl font-extrabold tracking-tight text-emerald-600">
                      ৳
                      {grandTotal.toFixed(
                        2
                      )}
                    </p>
                  </div>
                </div>

                {/* Selected Payment */}

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  {paymentMethod ===
                  "COD" ? (
                    <CashIcon />
                  ) : (
                    <CardIcon />
                  )}

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Payment
                    </p>

                    <p className="truncate text-xs font-semibold text-slate-700">
                      {paymentMethod ===
                      "COD"
                        ? "Cash on Delivery"
                        : "Online Payment · Prototype"}
                    </p>
                  </div>
                </div>

                {/* Confirm */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />

                      Placing Order...
                    </>
                  ) : (
                    <>
                      Confirm Order

                      <ArrowIcon />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                  By placing the order, you confirm that the
                  information provided above is correct.
                </p>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  required = false,
  value,
  placeholder,
  type = "text",
  disabled = false,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  type?: string;
  disabled?: boolean;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

/* ============================================================
   PAYMENT OPTION
============================================================ */

function PaymentOption({
  selected,
  onSelect,
  disabled,
  icon,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={
        onSelect
      }
      disabled={
        disabled
      }
      className={`relative rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border ${
          selected
            ? "border-emerald-500 bg-emerald-500"
            : "border-slate-300 bg-white"
        }`}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-white" />
        )}
      </span>

      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          selected
            ? "bg-white text-emerald-600"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </span>

      <div className="mt-3 pr-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          {badge && (
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-cyan-700">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </button>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   CART ICON
============================================================ */

function CartIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5H6L8.2 15.2C8.4 16.2 9.3 17 10.3 17H17.2C18.1 17 18.9 16.4 19.2 15.5L21 9H7"
        stroke="currentColor"
        strokeWidth="1.6"
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
   MEDICINE ICON
============================================================ */

function MedicineIcon() {
  return (
    <svg
      width="24"
      height="24"
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
   CASH ICON
============================================================ */

function CashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
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

      <path
        d="M6 10V14M18 10V14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   CARD ICON
============================================================ */

function CardIcon() {
  return (
    <svg
      width="20"
      height="20"
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
        d="M3 9H21"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M7 14H11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   INFO ICON
============================================================ */

function InfoIcon() {
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
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 10.5V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7.5"
        r="1"
        fill="currentColor"
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