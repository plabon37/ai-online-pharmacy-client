import Link from "next/link";

import AddToCartButton from "@/components/cart/AddToCartButton";

/* ============================================================
   API RESPONSE TYPES
============================================================ */

type ApiResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string;

  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
};

type Medicine = {
  _id: string;
  name: string;
  genericName?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;

  category?:
    | {
        _id: string;
        name: string;
        slug?: string;
      }
    | string
    | null;
};

type MedicineApiData =
  | Medicine[]
  | {
      medicines?: Medicine[];
      items?: Medicine[];
      data?: Medicine[];

      pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };
    };

type MedicineResult = {
  medicines: Medicine[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
   NORMALIZE PAGINATION
============================================================ */

function normalizePagination(
  value:
    | {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      }
    | null
    | undefined,
  medicinesLength: number
) {
  if (!value) {
    return {
      page: 1,
      limit: medicinesLength,
      total: medicinesLength,
      totalPages:
        medicinesLength > 0
          ? 1
          : 0,
    };
  }

  return {
    page: Number(
      value.page ?? 1
    ),

    limit: Number(
      value.limit ??
        medicinesLength
    ),

    total: Number(
      value.total ??
        medicinesLength
    ),

    totalPages: Number(
      value.totalPages ??
        (medicinesLength > 0
          ? 1
          : 0)
    ),
  };
}

/* ============================================================
   FETCH MEDICINES
============================================================ */

async function getMedicines(): Promise<MedicineResult> {
  try {
    const apiBaseUrl =
      getApiBaseUrl();

    const response =
      await fetch(
        `${apiBaseUrl}/api/medicines?limit=20`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    /* ========================================================
       READ RESPONSE AS TEXT
    ======================================================== */

    const responseText =
      await response.text();

    let result:
      | ApiResponse<MedicineApiData>
      | null = null;

    /* ========================================================
       PARSE JSON
    ======================================================== */

    try {
      result = responseText
        ? (JSON.parse(
            responseText
          ) as ApiResponse<MedicineApiData>)
        : null;
    } catch {
      console.error(
        "MEDICINES API NON-JSON RESPONSE:",
        {
          status:
            response.status,

          response:
            responseText.slice(
              0,
              1000
            ),
        }
      );

      throw new Error(
        `Medicines API returned invalid response (${response.status}).`
      );
    }

    /* ========================================================
       DEBUG
    ======================================================== */

    console.log(
      "MEDICINES API STATUS:",
      response.status
    );

    console.log(
      "MEDICINES API RESPONSE:",
      result
    );

    /* ========================================================
       API ERROR
    ======================================================== */

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          `Failed to load medicines (${response.status}).`
      );
    }

    /* ========================================================
       RAW DATA
    ======================================================== */

    const rawData =
      result.data;

    let medicines: Medicine[] =
      [];

    let pagination =
      normalizePagination(
        result.pagination,
        0
      );

    /* ========================================================
       CASE 1: data = [...]
    ======================================================== */

    if (
      Array.isArray(
        rawData
      )
    ) {
      medicines =
        rawData;

      pagination =
        normalizePagination(
          result.pagination,
          medicines.length
        );
    }

    /* ========================================================
       CASE 2: data = { medicines: [...] }
    ======================================================== */

    else if (
      rawData &&
      typeof rawData ===
        "object"
    ) {
      const nestedData =
        rawData as {
          medicines?: Medicine[];
          items?: Medicine[];
          data?: Medicine[];

          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
          };
        };

      if (
        Array.isArray(
          nestedData.medicines
        )
      ) {
        medicines =
          nestedData.medicines;
      } else if (
        Array.isArray(
          nestedData.items
        )
      ) {
        medicines =
          nestedData.items;
      } else if (
        Array.isArray(
          nestedData.data
        )
      ) {
        medicines =
          nestedData.data;
      }

      pagination =
        normalizePagination(
          nestedData.pagination ||
            result.pagination,
          medicines.length
        );
    }

    /* ========================================================
       FINAL VALIDATION
    ======================================================== */

    if (
      !Array.isArray(
        medicines
      )
    ) {
      medicines = [];
    }

    return {
      medicines,
      pagination,
    };
  } catch (error) {
    console.error(
      "MEDICINES FETCH ERROR:",
      error
    );

    throw error;
  }
}

/* ============================================================
   PAGE
============================================================ */

export default async function MedicineList() {
  let medicines: Medicine[] =
    [];

  let pagination:
    | MedicineResult["pagination"]
    | undefined;

  let apiError = "";

  try {
    const result =
      await getMedicines();

    medicines =
      result.medicines;

    pagination =
      result.pagination;
  } catch (error) {
    apiError =
      error instanceof Error
        ? error.message
        : "Failed to load medicines.";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
            Pharmacy
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Medicines
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Browse medicines available from
            our pharmacy and find the
            products you need.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/categories"
              className="inline-flex h-10 w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Browse Categories
            </Link>

            <Link
              href="/search"
              className="inline-flex h-10 w-fit items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Search Medicines

              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* ===================================================
            API ERROR
        ==================================================== */}

        {apiError && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">
              Medicine API Error
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-red-700">
              {apiError}
            </p>

            <p className="mt-2 text-xs leading-5 text-red-500">
              Check the browser or server console
              for the exact API response.
            </p>
          </div>
        )}

        {/* ===================================================
            RESULT HEADER
        ==================================================== */}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Available Products
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              All Medicines
            </h2>
          </div>

          <div className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            {pagination?.total ??
              medicines.length}{" "}
            {(
              pagination?.total ??
              medicines.length
            ) === 1
              ? "medicine"
              : "medicines"}
          </div>
        </div>

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {medicines.length ===
        0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <MedicineIcon large />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
              {apiError
                ? "Unable to load medicines"
                : "No medicines available"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
              {apiError
                ? "The Client could not read the medicine API response."
                : "Medicines added through the admin panel will automatically appear here."}
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {medicines.map(
              (medicine) => (
                <MedicineCard
                  key={
                    medicine._id
                  }
                  medicine={
                    medicine
                  }
                />
              )
            )}
          </div>
        )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {pagination &&
          pagination.totalPages > 1 && (
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>
            </div>
          )}
      </section>
    </main>
  );
}

/* ============================================================
   MEDICINE CARD
============================================================ */

function MedicineCard({
  medicine,
}: {
  medicine: Medicine;
}) {
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
      ? ""
      : medicine.category?.name ||
        "";

  const medicineSlug =
    medicine.slug ||
    medicine._id;

  const detailsHref =
    `/medicines/${medicineSlug}`;

  const buyNowHref =
    `/checkout?medicine=${encodeURIComponent(
      medicineSlug
    )}`;

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      {/* ====================================================
          IMAGE
      ===================================================== */}

      <Link
        href={detailsHref}
        className="block"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50">
          {medicine.image ? (
            <img
              src={
                medicine.image
              }
              alt={
                medicine.name
              }
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <MedicinePlaceholder />
          )}

          {/* STOCK BADGE */}

          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold ${
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
      </Link>

      {/* ====================================================
          DETAILS
      ===================================================== */}

      <div className="p-3.5 sm:p-4">
        <Link
          href={detailsHref}
          className="block"
        >
          <p className="truncate text-sm font-bold text-slate-800 transition hover:text-emerald-600">
            {medicine.name}
          </p>

          <p className="mt-1 min-h-[17px] truncate text-[10px] text-slate-400 sm:text-xs">
            {medicine.genericName ||
              categoryName ||
              "Medicine"}
          </p>
        </Link>

        {/* PRICE */}

        <div className="mt-3">
          <span className="text-base font-extrabold text-emerald-600 sm:text-lg">
            {typeof medicine.price ===
            "number"
              ? `৳${medicine.price.toLocaleString(
                  "en-BD",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}`
              : "View price"}
          </span>
        </div>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {/* =================================================
              ADD TO CART
          ================================================= */}

          <AddToCartButton
            medicine={{
              medicineId:
                medicine._id,

              name:
                medicine.name,

              slug:
                medicineSlug,

              genericName:
                medicine.genericName,

              image:
                medicine.image,

              price:
                Number(
                  medicine.price ??
                    0
                ),

              quantity: 1,

              stock,
            }}
          />

          {/* =================================================
              BUY NOW
          ================================================= */}

          {outOfStock ? (
            <span
              aria-disabled="true"
              className="flex h-10 cursor-not-allowed items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 text-[9px] font-bold text-slate-400 sm:text-[10px]"
            >
              Buy Now

              <BuyIcon />
            </span>
          ) : (
            <Link
              href={
                buyNowHref
              }
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 text-[9px] font-bold text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-700 active:scale-[0.98] sm:text-[10px]"
            >
              Buy Now

              <BuyIcon />
            </Link>
          )}
        </div>

        {/* STOCK INFO */}

        {!outOfStock && (
          <p className="mt-2 text-[9px] text-slate-400">
            {stock}{" "}
            {stock === 1
              ? "unit"
              : "units"}{" "}
            available
          </p>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   PLACEHOLDER
============================================================ */

function MedicinePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-emerald-300">
      <MedicineIcon large />
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
    large ? 34 : 19;

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

/* ============================================================
   BUY ICON
============================================================ */

function BuyIcon() {
  return (
    <svg
      width="14"
      height="14"
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
      className="ml-1"
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