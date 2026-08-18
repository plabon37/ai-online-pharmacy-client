import Link from "next/link";

type ApiResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string;
};

type MedicineCategory =
  | {
      _id: string;
      name: string;
      slug?: string;
    }
  | string
  | null;

type Medicine = {
  _id: string;
  name: string;
  genericName?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  category?: MedicineCategory;
};

type MedicineResponse =
  | Medicine
  | {
      medicine?: Medicine;
      data?: Medicine;
    };

/* ============================================================
   API BASE URL
============================================================ */

function getApiBaseUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured."
    );
  }

  return apiUrl.replace(
    /\/$/,
    ""
  );
}

/* ============================================================
   FETCH MEDICINE
============================================================ */

async function getMedicine(
  slug: string
): Promise<Medicine> {
  const apiBaseUrl =
    getApiBaseUrl();

  const response =
    await fetch(
      `${apiBaseUrl}/api/medicines/${encodeURIComponent(
        slug
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const responseText =
    await response.text();

  let result:
    | ApiResponse<MedicineResponse>
    | null = null;

  try {
    result = responseText
      ? (JSON.parse(
          responseText
        ) as ApiResponse<MedicineResponse>)
      : null;
  } catch {
    console.error(
      "MEDICINE DETAILS NON-JSON RESPONSE:",
      responseText.slice(
        0,
        1000
      )
    );

    throw new Error(
      `Medicine details API returned invalid response (${response.status}).`
    );
  }

  if (
    !response.ok ||
    !result?.success ||
    !result.data
  ) {
    throw new Error(
      result?.message ||
        `Failed to load medicine (${response.status}).`
    );
  }

  const rawData =
    result.data;

  if (
    rawData &&
    typeof rawData ===
      "object" &&
    "medicine" in rawData
  ) {
    if (rawData.medicine) {
      return rawData.medicine;
    }
  }

  if (
    rawData &&
    typeof rawData ===
      "object" &&
    "data" in rawData
  ) {
    if (rawData.data) {
      return rawData.data;
    }
  }

  return rawData as Medicine;
}

/* ============================================================
   PAGE
============================================================ */

export default async function MedicineDetails({
  slug,
}: {
  slug: string;
}) {
  let medicine: Medicine | null =
    null;

  let errorMessage = "";

  try {
    medicine =
      await getMedicine(slug);
  } catch (error) {
    console.error(
      "MEDICINE DETAILS ERROR:",
      error
    );

    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load medicine.";
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (!medicine) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex min-h-[70vh] w-full max-w-[900px] items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ErrorIcon />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-500">
              Medicine Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Unable to load medicine
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
              {errorMessage ||
                "The requested medicine could not be found."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/medicines"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                Back to Medicines
              </Link>

              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const stock =
    Number(
      medicine.stock ?? 0
    );

  const outOfStock =
    stock <= 0;

  const lowStock =
    stock > 0 &&
    stock <= 10;

  const categoryName =
    typeof medicine.category ===
    "string"
      ? medicine.category
      : medicine.category?.name ||
        "Medicine";

  const medicineSlug =
    medicine.slug ||
    medicine._id;

  const addToCartHref =
    `/cart?add=${encodeURIComponent(
      medicineSlug
    )}`;

  const buyNowHref =
    `/checkout?medicine=${encodeURIComponent(
      medicineSlug
    )}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 py-4 text-xs sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-slate-400 transition hover:text-emerald-600"
          >
            Home
          </Link>

          <ChevronIcon />

          <Link
            href="/medicines"
            className="text-slate-400 transition hover:text-emerald-600"
          >
            Medicines
          </Link>

          <ChevronIcon />

          <span className="min-w-0 truncate font-semibold text-slate-700">
            {medicine.name}
          </span>
        </div>
      </section>

      {/* =====================================================
          DETAILS
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* =================================================
              IMAGE
          ================================================== */}

          <div>
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {medicine.image ? (
                <img
                  src={medicine.image}
                  alt={
                    medicine.name
                  }
                  className="h-full w-full object-contain p-5 sm:p-8"
                />
              ) : (
                <MedicinePlaceholder large />
              )}

              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                  outOfStock
                    ? "bg-red-50 text-red-600"
                    : lowStock
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {outOfStock
                  ? "Out of stock"
                  : lowStock
                    ? "Low stock"
                    : "Available"}
              </span>
            </div>
          </div>

          {/* =================================================
              INFORMATION
          ================================================== */}

          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              {categoryName}
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {medicine.name}
            </h1>

            {medicine.genericName && (
              <p className="mt-2 text-sm font-medium text-slate-400 sm:text-base">
                {medicine.genericName}
              </p>
            )}

            {/* PRICE */}

            <div className="mt-6">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 sm:text-4xl">
                {typeof medicine.price ===
                "number"
                  ? `৳${medicine.price.toLocaleString(
                      "en-BD",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                  : "Price unavailable"}
              </span>
            </div>

            {/* STOCK */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StockBadge
                stock={stock}
                outOfStock={
                  outOfStock
                }
              />

              {!outOfStock && (
                <span className="text-xs text-slate-400">
                  {stock}{" "}
                  {stock === 1
                    ? "unit"
                    : "units"}{" "}
                  available
                </span>
              )}
            </div>

            {/* DESCRIPTION */}

            <div className="mt-7 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-900">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">
                {medicine.description ||
                  "No description is available for this medicine."}
              </p>
            </div>

            {/* ACTIONS */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {outOfStock ? (
                <span className="flex h-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-400">
                  Out of Stock
                </span>
              ) : (
                <Link
                  href={addToCartHref}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.99]"
                >
                  <CartIcon />
                  Add to Cart
                </Link>
              )}

              {outOfStock ? (
                <span className="flex h-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-400">
                  Buy Now
                </span>
              ) : (
                <Link
                  href={buyNowHref}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  Buy Now
                  <ArrowIcon />
                </Link>
              )}
            </div>

            {/* TRUST */}

            <div className="mt-7 grid grid-cols-3 gap-2">
              <TrustItem
                title="Quality"
                description="Verified"
              />

              <TrustItem
                title="Delivery"
                description="Pharmacy"
              />

              <TrustItem
                title="Support"
                description="Available"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   STOCK BADGE
============================================================ */

function StockBadge({
  stock,
  outOfStock,
}: {
  stock: number;
  outOfStock: boolean;
}) {
  if (outOfStock) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600">
        Out of stock
      </span>
    );
  }

  if (stock <= 10) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
        Low stock
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
      In stock
    </span>
  );
}

/* ============================================================
   TRUST ITEM
============================================================ */

function TrustItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-xs font-bold text-slate-800">
        {title}
      </p>

      <p className="mt-0.5 text-[9px] text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   MEDICINE PLACEHOLDER
============================================================ */

function MedicinePlaceholder({
  large = false,
}: {
  large?: boolean;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-emerald-300">
      <MedicineIcon
        large={large}
      />
    </div>
  );
}

/* ============================================================
   MEDICINE ICON
============================================================ */

function MedicineIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 64 : 24;

  return (
    <svg
      width={size}
      height={size}
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
        strokeWidth="1.5"
      />

      <path
        d="M8.5 8H15.5M8.5 12H15.5M8.5 16H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   CART ICON
============================================================ */

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

/* ============================================================
   ARROW ICON
============================================================ */

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
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
   CHEVRON
============================================================ */

function ChevronIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-slate-300"
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

/* ============================================================
   ERROR ICON
============================================================ */

function ErrorIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4L21 19H3L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 9V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}