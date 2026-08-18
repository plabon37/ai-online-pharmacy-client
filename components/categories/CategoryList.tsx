import Link from "next/link";

/* ============================================================
   API TYPES
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

type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
  isActive?: boolean;
};

type CategoryApiData =
  | Category[]
  | {
      categories?: Category[];
      items?: Category[];
      data?: Category[];

      pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };
    };

type CategoryResult = {
  categories: Category[];

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
  categoryLength: number
) {
  if (!value) {
    return {
      page: 1,
      limit: categoryLength,
      total: categoryLength,
      totalPages:
        categoryLength > 0
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
        categoryLength
    ),

    total: Number(
      value.total ??
        categoryLength
    ),

    totalPages: Number(
      value.totalPages ??
        (categoryLength > 0
          ? 1
          : 0)
    ),
  };
}

/* ============================================================
   FETCH CATEGORIES
============================================================ */

async function getCategories(): Promise<CategoryResult> {
  try {
    const apiBaseUrl =
      getApiBaseUrl();

    const response =
      await fetch(
        `${apiBaseUrl}/api/categories?limit=20`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    /* ========================================================
       READ RESPONSE
    ======================================================== */

    const responseText =
      await response.text();

    let result:
      | ApiResponse<CategoryApiData>
      | null = null;

    /* ========================================================
       PARSE JSON
    ======================================================== */

    try {
      result = responseText
        ? (JSON.parse(
            responseText
          ) as ApiResponse<CategoryApiData>)
        : null;
    } catch {
      console.error(
        "CATEGORIES API NON-JSON RESPONSE:",
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
        `Categories API returned invalid response (${response.status}).`
      );
    }

    /* ========================================================
       DEBUG
    ======================================================== */

    console.log(
      "CATEGORIES API STATUS:",
      response.status
    );

    console.log(
      "CATEGORIES API RESPONSE:",
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
          `Failed to load categories (${response.status}).`
      );
    }

    /* ========================================================
       RAW DATA
    ======================================================== */

    const rawData =
      result.data;

    let categories: Category[] =
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
      categories =
        rawData;

      pagination =
        normalizePagination(
          result.pagination,
          categories.length
        );
    }

    /* ========================================================
       CASE 2: data = { categories: [...] }
    ======================================================== */

    else if (
      rawData &&
      typeof rawData ===
        "object"
    ) {
      const nestedData =
        rawData as {
          categories?: Category[];
          items?: Category[];
          data?: Category[];

          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
          };
        };

      if (
        Array.isArray(
          nestedData.categories
        )
      ) {
        categories =
          nestedData.categories;
      } else if (
        Array.isArray(
          nestedData.items
        )
      ) {
        categories =
          nestedData.items;
      } else if (
        Array.isArray(
          nestedData.data
        )
      ) {
        categories =
          nestedData.data;
      }

      pagination =
        normalizePagination(
          nestedData.pagination ||
            result.pagination,
          categories.length
        );
    }

    /* ========================================================
       FINAL VALIDATION
    ======================================================== */

    if (
      !Array.isArray(
        categories
      )
    ) {
      categories = [];
    }

    return {
      categories,
      pagination,
    };
  } catch (error) {
    console.error(
      "CATEGORIES FETCH ERROR:",
      error
    );

    throw error;
  }
}

/* ============================================================
   PAGE
============================================================ */

export default async function CategoryList() {
  let categories: Category[] =
    [];

  let pagination:
    | CategoryResult["pagination"]
    | undefined;

  let apiError = "";

  try {
    const result =
      await getCategories();

    categories =
      result.categories;

    pagination =
      result.pagination;
  } catch (error) {
    apiError =
      error instanceof Error
        ? error.message
        : "Failed to load categories.";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
            Pharmacy
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Categories
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Explore medicine categories and quickly
            find the products you are looking for.
          </p>

          <div className="mt-6">
            <Link
              href="/medicines"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Browse All Medicines

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
              Category API Error
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-red-700">
              {apiError}
            </p>

            <p className="mt-2 text-xs leading-5 text-red-500">
              Check the browser or server console for
              the exact API response.
            </p>
          </div>
        )}

        {/* ===================================================
            RESULT HEADER
        ==================================================== */}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Explore Pharmacy
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Medicine Categories
            </h2>
          </div>

          <div className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            {pagination?.total ??
              categories.length}{" "}
            {(
              pagination?.total ??
              categories.length
            ) === 1
              ? "category"
              : "categories"}
          </div>
        </div>

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {categories.length ===
        0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <CategoryIcon large />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
              {apiError
                ? "Unable to load categories"
                : "No categories available"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
              {apiError
                ? "The Client could not read the category API response."
                : "Categories added through the admin panel will automatically appear here."}
            </p>

            <Link
              href="/medicines"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse Medicines
            </Link>
          </div>
        ) : (
          /* =================================================
             CATEGORY GRID
          ================================================== */

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map(
              (category) => (
                <CategoryCard
                  key={
                    category._id
                  }
                  category={
                    category
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
   CATEGORY CARD
============================================================ */

function CategoryCard({
  category,
}: {
  category: Category;
}) {
  const categorySlug =
    category.slug ||
    category._id;

  return (
    <Link
      href={`/categories/${encodeURIComponent(
        categorySlug
      )}`}
      className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      {/* ==================================================
          IMAGE
      =================================================== */}

      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50">
        {category.image ? (
          <img
            src={category.image}
            alt={
              category.name
            }
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-emerald-300">
            <CategoryIcon large />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* ==================================================
          CONTENT
      =================================================== */}

      <div className="p-4 sm:p-5">
        <h3 className="truncate text-sm font-bold text-slate-800 transition group-hover:text-emerald-600 sm:text-base">
          {category.name}
        </h3>

        <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-slate-400 sm:text-xs">
          {category.description ||
            "Explore medicines in this category."}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-600 sm:text-xs">
            Explore Medicines
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   CATEGORY ICON
============================================================ */

function CategoryIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 38 : 21;

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