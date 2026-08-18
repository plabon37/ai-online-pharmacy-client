import Link from "next/link";

/* ============================================================
   TYPES
============================================================ */

type ApiResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string;
};

type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
};

type Medicine = {
  _id: string;
  name: string;
  genericName?: string;
  slug?: string;
  price?: number;
  stock?: number;
  image?: string;
};

type CategoryApiData =
  | Category
  | {
      category?: Category;
      data?: Category;
    };

type MedicineApiData =
  | Medicine[]
  | {
      medicines?: Medicine[];
      items?: Medicine[];
      data?: Medicine[];
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
   FETCH CATEGORY
============================================================ */

async function getCategory(
  slug: string
): Promise<Category> {
  const apiBaseUrl =
    getApiBaseUrl();

  const response =
    await fetch(
      `${apiBaseUrl}/api/categories/${encodeURIComponent(
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
    | ApiResponse<CategoryApiData>
    | null = null;

  try {
    result = responseText
      ? (JSON.parse(
          responseText
        ) as ApiResponse<CategoryApiData>)
      : null;
  } catch {
    throw new Error(
      `Category API returned invalid response (${response.status}).`
    );
  }

  if (
    !response.ok ||
    !result?.success ||
    !result.data
  ) {
    throw new Error(
      result?.message ||
        `Failed to load category (${response.status}).`
    );
  }

  const rawData =
    result.data;

  if (
    rawData &&
    typeof rawData ===
      "object" &&
    "category" in rawData
  ) {
    if (rawData.category) {
      return rawData.category;
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

  return rawData as Category;
}

/* ============================================================
   FETCH CATEGORY MEDICINES
============================================================ */

async function getCategoryMedicines(
  slug: string
): Promise<Medicine[]> {
  const apiBaseUrl =
    getApiBaseUrl();

  /*
   * We use the public medicine endpoint
   * with category filter.
   */

  const response =
    await fetch(
      `${apiBaseUrl}/api/medicines?category=${encodeURIComponent(
        slug
      )}&limit=50`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const responseText =
    await response.text();

  let result:
    | ApiResponse<MedicineApiData>
    | null = null;

  try {
    result = responseText
      ? (JSON.parse(
          responseText
        ) as ApiResponse<MedicineApiData>)
      : null;
  } catch {
    throw new Error(
      `Category medicines API returned invalid response (${response.status}).`
    );
  }

  if (
    !response.ok ||
    !result?.success
  ) {
    throw new Error(
      result?.message ||
        `Failed to load category medicines (${response.status}).`
    );
  }

  const rawData =
    result.data;

  if (
    Array.isArray(
      rawData
    )
  ) {
    return rawData;
  }

  if (
    rawData &&
    typeof rawData ===
      "object"
  ) {
    if (
      Array.isArray(
        rawData.medicines
      )
    ) {
      return rawData.medicines;
    }

    if (
      Array.isArray(
        rawData.items
      )
    ) {
      return rawData.items;
    }

    if (
      Array.isArray(
        rawData.data
      )
    ) {
      return rawData.data;
    }
  }

  return [];
}

/* ============================================================
   PAGE
============================================================ */

export default async function CategoryDetails({
  slug,
}: {
  slug: string;
}) {
  let category: Category | null =
    null;

  let medicines: Medicine[] =
    [];

  let errorMessage = "";

  try {
    const [
      categoryData,
      medicineData,
    ] = await Promise.all([
      getCategory(slug),
      getCategoryMedicines(slug),
    ]);

    category =
      categoryData;

    medicines =
      medicineData;
  } catch (error) {
    console.error(
      "CATEGORY DETAILS ERROR:",
      error
    );

    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load category.";
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (!category) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex min-h-[70vh] w-full max-w-[900px] items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ErrorIcon />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-500">
              Category Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Unable to load category
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
              {errorMessage ||
                "The requested category could not be found."}
            </p>

            <Link
              href="/categories"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Back to Categories
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
            href="/categories"
            className="text-slate-400 transition hover:text-emerald-600"
          >
            Categories
          </Link>

          <ChevronIcon />

          <span className="truncate font-semibold text-slate-700">
            {category.name}
          </span>
        </div>
      </section>

      {/* =====================================================
          CATEGORY HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Medicine Category
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                {category.description ||
                  `Browse medicines available in the ${category.name} category.`}
              </p>

              <div className="mt-6">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                  {medicines.length}{" "}
                  {medicines.length === 1
                    ? "medicine"
                    : "medicines"}
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-white bg-white shadow-xl">
                {category.image ? (
                  <img
                    src={
                      category.image
                    }
                    alt={
                      category.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-300">
                    <CategoryIcon large />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MEDICINES
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Products
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Medicines in {category.name}
            </h2>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Select a medicine to view its full details.
            </p>
          </div>

          <Link
            href="/medicines"
            className="inline-flex w-fit items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            View all medicines
            <ArrowIcon />
          </Link>
        </div>

        {medicines.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <MedicineIcon large />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
              No medicines in this category
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
              There are currently no medicines available
              in this category.
            </p>

            <Link
              href="/medicines"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse All Medicines
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

  const medicineSlug =
    medicine.slug ||
    medicine._id;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <Link
        href={`/medicines/${medicineSlug}`}
        className="block"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50">
          {medicine.image ? (
            <img
              src={medicine.image}
              alt={
                medicine.name
              }
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-300">
              <MedicineIcon large />
            </div>
          )}

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

      <div className="p-3.5 sm:p-4">
        <Link
          href={`/medicines/${medicineSlug}`}
          className="block"
        >
          <p className="truncate text-sm font-bold text-slate-800 transition hover:text-emerald-600">
            {medicine.name}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
            {medicine.genericName ||
              "Medicine"}
          </p>
        </Link>

        <div className="mt-3">
          <span className="text-base font-extrabold text-emerald-600">
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

        <div className="mt-4">
          {outOfStock ? (
            <span className="flex h-10 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-400">
              Out of Stock
            </span>
          ) : (
            <Link
              href={`/cart?add=${encodeURIComponent(
                medicineSlug
              )}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <CartIcon />
              Add to Cart
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   ICONS
============================================================ */

function CategoryIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 42 : 20;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

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