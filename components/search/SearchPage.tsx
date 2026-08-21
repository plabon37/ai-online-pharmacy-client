"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

/* ============================================================
   TYPES
============================================================ */

type Medicine = {
  _id: string;

  name: string;

  genericName?: string;

  slug?: string;

  description?: string;

  price?: number;

  stock?: number;

  image?: string;

  category?: {
    _id: string;

    name: string;
  } | null;
};

type SearchApiResponse = {
  success: boolean;

  data:
    | {
        medicines: Medicine[];

        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };

        filters?: {
          q?: string;
        };
      }
    | null;

  message: string;
};

/* ============================================================
   API URL
============================================================ */

function getApiBaseUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim();

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

export default function SearchPage() {
  const [query, setQuery] =
    useState("");

  const [
    submittedQuery,
    setSubmittedQuery,
  ] = useState("");

  const [
    medicines,
    setMedicines,
  ] = useState<Medicine[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     SEARCH
  ========================================================== */

  const searchMedicines =
    async (
      searchQuery: string
    ) => {
      const cleanQuery =
        searchQuery.trim();

      if (!cleanQuery) {
        setMedicines([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const apiBaseUrl =
          getApiBaseUrl();

        const response =
          await fetch(
            `${apiBaseUrl}/api/search/medicines?q=${encodeURIComponent(
              cleanQuery
            )}&page=1&limit=12`,
            {
              method: "GET",

              mode: "cors",

              headers: {
                Accept:
                  "application/json",
              },

              cache: "no-store",
            }
          );

        const responseText =
          await response.text();

        let result:
          | SearchApiResponse
          | null = null;

        try {
          result =
            responseText
              ? (JSON.parse(
                  responseText
                ) as SearchApiResponse)
              : null;
        } catch {
          throw new Error(
            `Search API returned invalid JSON (${response.status}).`
          );
        }

        if (
          !response.ok ||
          !result?.success ||
          !result.data
        ) {
          throw new Error(
            result?.message ||
              `Failed to search medicines (${response.status}).`
          );
        }

        setMedicines(
          Array.isArray(
            result.data.medicines
          )
            ? result.data.medicines
            : []
        );
      } catch (searchError) {
        console.error(
          "Search medicines error:",
          searchError
        );

        setMedicines([]);

        setError(
          searchError instanceof
            Error
            ? searchError.message
            : "Unable to search medicines."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const cleanQuery =
        query.trim();

      setSubmittedQuery(
        cleanQuery
      );

      if (!cleanQuery) {
        setMedicines([]);
        setError(
          "Please enter a medicine name."
        );
        return;
      }

      await searchMedicines(
        cleanQuery
      );
    };

  /* ==========================================================
     RESULT COUNT
  ========================================================== */

  const resultCount =
    useMemo(
      () => medicines.length,
      [medicines]
    );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Pharmacy Search
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Search Medicines
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Find medicines by name, generic name,
            category, or description.
          </p>

          {/* ==================================================
              SEARCH FORM
          =================================================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon />

                <input
                  type="search"
                  value={query}
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search medicine name..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !query.trim()
                }
                className="h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ======================================================
          RESULTS
      ======================================================= */}

      <section className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
          >
            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>
          </div>
        )}

        {!error &&
          submittedQuery && (
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Search Results
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {resultCount}{" "}
                  {resultCount === 1
                    ? "medicine"
                    : "medicines"}{" "}
                  found
                </h2>
              </div>

              <p className="text-xs text-slate-400">
                Searching for “
                {submittedQuery}”
              </p>
            </div>
          )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={
                    index
                  }
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="aspect-[4/3] animate-pulse bg-slate-100" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />

                    <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : submittedQuery &&
          medicines.length >
            0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map(
              (
                medicine
              ) => {
                const href =
                  `/medicines/${
                    medicine.slug ||
                    medicine._id
                  }`;

                const stock =
                  Number(
                    medicine.stock ??
                      0
                  );

                return (
                  <Link
                    key={
                      medicine._id
                    }
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
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
                        <div className="text-emerald-300">
                          <MedicineIcon />
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                          stock <= 0
                            ? "bg-red-50 text-red-600"
                            : stock <= 10
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {stock <= 0
                          ? "Out of stock"
                          : stock <= 10
                            ? "Low stock"
                            : "Available"}
                      </span>
                    </div>

                    <div className="p-4">
                      <p className="truncate text-sm font-bold text-slate-800 transition group-hover:text-emerald-600">
                        {
                          medicine.name
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {
                          medicine.genericName ||
                          medicine.category
                            ?.name ||
                          "Medicine"
                        }
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-base font-extrabold text-emerald-600">
                          {typeof medicine.price ===
                          "number"
                            ? `৳${medicine.price.toLocaleString(
                                "en-BD",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}`
                            : "View price"}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-emerald-600">
                          View
                          <ArrowIcon />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        ) : submittedQuery ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <SearchLargeIcon />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              No medicines found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
              Try a different medicine name,
              generic name, or category.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MedicineIcon />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              Search your medicines
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
              Enter a medicine name above to see
              matching products.
            </p>
          </div>
        )}
      </section>
    </main>
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
      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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

function SearchLargeIcon() {
  return (
    <svg
      width="26"
      height="26"
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

function MedicineIcon() {
  return (
    <svg
      width="28"
      height="28"
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
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}