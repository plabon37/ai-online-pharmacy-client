"use client";

import {
  useState,
} from "react";

import useSWR from "swr";

/* ============================================================
   TYPES
============================================================ */

type MatchedMedicine = {
  _id: string;
  name?: string;
  genericName?: string;
  price?: number;
  stock?: number;
  image?: string;
  category?: string;
  isActive?: boolean;
};

type PrescriptionMedicine = {
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;

  matchedMedicineId:
    | MatchedMedicine
    | string
    | null;

  confidence: number;

  needsReview: boolean;
};

type PrescriptionTest = {
  name: string;
  category: string;
  notes: string;
  confidence: number;
  needsReview: boolean;
};

type MyPrescription = {
  _id: string;

  patientName: string;

  image: string;

  note: string;

  adminNote: string;

  status:
    | "PENDING"
    | "REVIEWING"
    | "APPROVED"
    | "REJECTED";

  reviewedAt:
    | string
    | null;

  createdAt: string;

  updatedAt: string;

  extractedText?: string;

  cleanedText?: string;

  medicines?:
    | PrescriptionMedicine[]
    | [];

  tests?:
    | PrescriptionTest[]
    | [];

  aiStatus?: string;
};

type ApiResponse = {
  success: boolean;

  data:
    | MyPrescription[]
    | null;

  message: string;
};

/* ============================================================
   BACKEND URL
============================================================ */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"
).replace(
  /\/+$/,
  ""
);

/* ============================================================
   FETCHER

   IMPORTANT:
   Request goes to ADMIN/BACKEND project, not client project.
============================================================ */

async function fetcher(
  path: string
): Promise<
  MyPrescription[]
> {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        method: "GET",

        credentials:
          "include",

        cache:
          "no-store",
      }
    );

  const result =
    (await response.json()) as ApiResponse;

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Failed to fetch prescriptions"
    );
  }

  return Array.isArray(
    result.data
  )
    ? result.data
    : [];
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function MyPrescriptions() {
  /* ==========================================================
     SELECTED PRESCRIPTION
  ========================================================== */

  const [
    selectedPrescription,
    setSelectedPrescription,
  ] =
    useState<MyPrescription | null>(
      null
    );

  /* ==========================================================
     SWR

     NO useEffect
  ========================================================== */

  const {
    data: prescriptions,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<
    MyPrescription[],
    Error
  >(
    "/api/prescriptions/my",
    fetcher,
    {
      revalidateOnFocus:
        false,

      revalidateOnReconnect:
        true,

      dedupingInterval:
        3000,

      keepPreviousData:
        true,
    }
  );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    isLoading &&
    !prescriptions
  ) {
    return (
      <section className="mt-10">
        <div className="mb-5">
          <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map(
            (
              item
            ) => (
              <div
                key={
                  item
                }
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />

                <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-100" />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

                  <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            )
          )}
        </div>
      </section>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error &&
    !prescriptions
  ) {
    return (
      <section className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-red-700">
              Failed to load your prescriptions
            </p>

            <p className="mt-1 text-xs leading-5 text-red-600">
              {
                error.message
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void mutate()
            }
            className="h-10 rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  /* ==========================================================
     SAFE DATA
  ========================================================== */

  const prescriptionList =
    Array.isArray(
      prescriptions
    )
      ? prescriptions
      : [];

  /* ==========================================================
     EMPTY
  ========================================================== */

  if (
    prescriptionList.length ===
    0
  ) {
    return (
      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Prescription History
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              My Prescriptions
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your uploaded prescriptions and pharmacy review
              results will appear here.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void mutate()
            }
            disabled={
              isValidating
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
          >
            {isValidating
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <PrescriptionIcon />
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-800 sm:text-lg">
            No prescriptions yet
          </h3>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
            Upload your first prescription above and the pharmacy
            review result will appear here.
          </p>
        </div>
      </section>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <>
      <section className="mt-10">

        {/* HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Prescription History
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              My Prescriptions
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track pharmacy review status, admin notes, AI
              results and detected medicines.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void mutate()
            }
            disabled={
              isValidating
            }
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isValidating
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {isValidating && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-emerald-500" />

            Updating prescription status...
          </div>
        )}

        {/* CARDS */}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {prescriptionList.map(
            (
              prescription
            ) => (
              <PrescriptionCard
                key={
                  prescription._id
                }
                prescription={
                  prescription
                }
                onOpen={() =>
                  setSelectedPrescription(
                    prescription
                  )
                }
              />
            )
          )}
        </div>
      </section>

      {/* DETAILS */}

      {selectedPrescription && (
        <PrescriptionResultModal
          prescription={
            selectedPrescription
          }
          onClose={() =>
            setSelectedPrescription(
              null
            )
          }
        />
      )}
    </>
  );
}

/* ============================================================
   CARD
============================================================ */

function PrescriptionCard({
  prescription,
  onOpen,
}: {
  prescription: MyPrescription;

  onOpen: () => void;
}) {
  const medicines =
    Array.isArray(
      prescription.medicines
    )
      ? prescription.medicines
      : [];

  const tests =
    Array.isArray(
      prescription.tests
    )
      ? prescription.tests
      : [];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Patient
          </p>

          <h3 className="mt-1 truncate text-base font-bold text-slate-900">
            {
              prescription.patientName
            }
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            Submitted{" "}
            {formatDate(
              prescription.createdAt
            )}
          </p>
        </div>

        <StatusBadge
          status={
            prescription.status
          }
        />
      </div>

      <div className="p-5">

        <div className="flex gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {prescription.image ? (
              <img
                src={
                  prescription.image
                }
                alt="Prescription"
                className="h-full w-full object-contain"
              />
            ) : (
              <PrescriptionIcon />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <InfoMiniRow
              label="Review Status"
              value={formatStatus(
                prescription.status
              )}
            />

            <InfoMiniRow
              label="AI Status"
              value={
                prescription.aiStatus
                  ? formatStatus(
                      prescription.aiStatus
                    )
                  : "Not processed"
              }
            />

            <InfoMiniRow
              label="Medicines Detected"
              value={`${medicines.length}`}
            />

            <InfoMiniRow
              label="Tests Detected"
              value={`${tests.length}`}
            />
          </div>
        </div>

        <div className="mt-4">
          <div
            className={`rounded-2xl border p-4 ${getNoteClass(
              prescription.status
            )}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
              Pharmacy Review
            </p>

            <p className="mt-1.5 text-sm font-semibold">
              {getReviewMessage(
                prescription
              )}
            </p>

            {prescription.adminNote && (
              <div className="mt-3 rounded-xl bg-white/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  Admin Note
                </p>

                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5">
                  {
                    prescription.adminNote
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={
            onOpen
          }
          className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          View Prescription Result
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   RESULT MODAL
============================================================ */

function PrescriptionResultModal({
  prescription,
  onClose,
}: {
  prescription: MyPrescription;

  onClose: () => void;
}) {
  const medicines =
    Array.isArray(
      prescription.medicines
    )
      ? prescription.medicines
      : [];

  const tests =
    Array.isArray(
      prescription.tests
    )
      ? prescription.tests
      : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Prescription Result
            </p>

            <h2 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {
                prescription.patientName
              }
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Submitted{" "}
              {formatDate(
                prescription.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

          {/* PHARMACY DECISION */}

          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Pharmacy Decision
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {
                    getReviewTitle(
                      prescription.status
                    )
                  }
                </h3>
              </div>

              <StatusBadge
                status={
                  prescription.status
                }
              />
            </div>

            <div className="p-4 sm:p-5">
              <div
                className={`rounded-2xl border p-4 ${getNoteClass(
                  prescription.status
                )}`}
              >
                <p className="text-sm font-semibold">
                  {getReviewMessage(
                    prescription
                  )}
                </p>

                {prescription.reviewedAt && (
                  <p className="mt-2 text-[10px] opacity-70">
                    Reviewed{" "}
                    {formatDate(
                      prescription.reviewedAt
                    )}
                  </p>
                )}
              </div>

              {prescription.adminNote && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Message from Pharmacy
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {
                      prescription.adminNote
                    }
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* DOCUMENT */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Uploaded Prescription
            </p>

            <div className="mt-3 flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-3 sm:min-h-[420px]">
              {prescription.image ? (
                <img
                  src={
                    prescription.image
                  }
                  alt="Uploaded prescription"
                  className="max-h-[400px] max-w-full rounded-xl object-contain"
                />
              ) : (
                <div className="text-center">
                  <PrescriptionIcon />

                  <p className="mt-2 text-sm text-slate-400">
                    No prescription image
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* AI RESULT */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                AI Analysis
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                Prescription Analysis
              </h3>
            </div>

            <div className="p-4 sm:p-5">

              {prescription.extractedText && (
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Extracted Text
                  </p>

                  <div className="mt-2 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                    {
                      prescription.extractedText
                    }
                  </div>
                </div>
              )}

              {/* MEDICINES */}

              <div className="mt-5">
                <p className="text-xs font-bold text-slate-700">
                  Detected Medicines
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {medicines.length} detected
                </p>

                {medicines.length ===
                0 ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      No medicines detected.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {medicines.map(
                      (
                        medicine,
                        index
                      ) => (
                        <MedicineResultCard
                          key={`${medicine.name}-${index}`}
                          medicine={
                            medicine
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>

              {/* TESTS */}

              <div className="mt-6">
                <p className="text-xs font-bold text-slate-700">
                  Detected Tests
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {tests.length} detected
                </p>

                {tests.length ===
                0 ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      No tests detected.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {tests.map(
                      (
                        test,
                        index
                      ) => (
                        <TestResultCard
                          key={`${test.name}-${index}`}
                          test={
                            test
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CUSTOMER NOTE */}

          {prescription.note && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-bold text-slate-700">
                Your Note
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {
                  prescription.note
                }
              </p>
            </section>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MEDICINE RESULT
============================================================ */

function MedicineResultCard({
  medicine,
}: {
  medicine: PrescriptionMedicine;
}) {
  const matched =
    getMatchedMedicine(
      medicine.matchedMedicineId
    );

  const confidence =
    Math.round(
      Math.min(
        1,
        Math.max(
          0,
          medicine.confidence ||
            0
        )
      ) * 100
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {
              medicine.name
            }
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            AI detected medicine
          </p>
        </div>

        {medicine.needsReview ? (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
            Needs Review
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
            Verified
          </span>
        )}
      </div>

      {matched && (
        <div className="mt-3 rounded-xl bg-emerald-50/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Matched Pharmacy Medicine
          </p>

          <div className="mt-2 flex items-center gap-3">
            {matched.image ? (
              <img
                src={
                  matched.image
                }
                alt={
                  matched.name ||
                  "Medicine"
                }
                className="h-10 w-10 rounded-lg border border-white bg-white object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-emerald-600">
                RX
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">
                {
                  matched.name
                }
              </p>

              <p className="truncate text-[10px] text-slate-500">
                {
                  matched.genericName ||
                  "Generic unavailable"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MedicineInfo
          label="Strength"
          value={
            medicine.strength ||
            "—"
          }
        />

        <MedicineInfo
          label="Dosage"
          value={
            medicine.dosage ||
            "—"
          }
        />

        <MedicineInfo
          label="Frequency"
          value={
            medicine.frequency ||
            "—"
          }
        />

        <MedicineInfo
          label="Duration"
          value={
            medicine.duration ||
            "—"
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px]">
        <span className="font-semibold text-slate-500">
          AI Confidence:
        </span>

        <span
          className={`font-bold ${
            confidence >= 80
              ? "text-emerald-600"
              : confidence >=
                60
              ? "text-amber-600"
              : "text-red-600"
          }`}
        >
          {confidence}%
        </span>

        {matched?.price !==
          undefined && (
          <>
            <span className="text-slate-300">
              •
            </span>

            <span className="font-semibold text-slate-600">
              Price:{" "}
              {formatCurrency(
                matched.price
              )}
            </span>
          </>
        )}

        {matched && (
          <>
            <span className="text-slate-300">
              •
            </span>

            <span
              className={
                (matched.stock ??
                  0) >
                0
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-red-500"
              }
            >
              {(matched.stock ??
                0) >
              0
                ? "Available"
                : "Out of Stock"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TEST RESULT
============================================================ */

function TestResultCard({
  test,
}: {
  test: PrescriptionTest;
}) {
  const confidence =
    Math.round(
      Math.min(
        1,
        Math.max(
          0,
          test.confidence ||
            0
        )
      ) * 100
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {test.name}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {
              test.category
            }
          </p>
        </div>

        {test.needsReview ? (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
            Needs Review
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
            Verified
          </span>
        )}
      </div>

      {test.notes && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {test.notes}
        </p>
      )}

      <p className="mt-3 text-[10px] font-semibold text-slate-400">
        AI Confidence:{" "}
        <span
          className={
            confidence >= 80
              ? "text-emerald-600"
              : confidence >=
                60
              ? "text-amber-600"
              : "text-red-600"
          }
        >
          {confidence}%
        </span>
      </p>
    </div>
  );
}

/* ============================================================
   MINI INFO
============================================================ */

function InfoMiniRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-[10px] text-slate-400">
        {label}
      </span>

      <span className="truncate text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   MEDICINE INFO
============================================================ */

function MedicineInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  status,
}: {
  status: MyPrescription["status"];
}) {
  const config: Record<
    MyPrescription["status"],
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label:
        "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },

    REVIEWING: {
      label:
        "Under Review",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },

    APPROVED: {
      label:
        "Approved",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },

    REJECTED: {
      label:
        "Rejected",
      className:
        "bg-red-50 text-red-700 border-red-100",
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

/* ============================================================
   REVIEW MESSAGE
============================================================ */

function getReviewMessage(
  prescription: MyPrescription
) {
  switch (
    prescription.status
  ) {
    case "APPROVED":
      return (
        prescription.adminNote ||
        "Your prescription has been reviewed and approved by the pharmacy."
      );

    case "REJECTED":
      return (
        prescription.adminNote ||
        "Your prescription was rejected by the pharmacy. Please check the pharmacy note."
      );

    case "REVIEWING":
      return (
        prescription.adminNote ||
        "Your prescription is currently being reviewed by the pharmacy team."
      );

    default:
      return "Your prescription has been submitted and is waiting for pharmacy review.";
  }
}

/* ============================================================
   REVIEW TITLE
============================================================ */

function getReviewTitle(
  status: MyPrescription["status"]
) {
  switch (
    status
  ) {
    case "APPROVED":
      return "Prescription Approved";

    case "REJECTED":
      return "Prescription Rejected";

    case "REVIEWING":
      return "Prescription Under Review";

    default:
      return "Prescription Submitted";
  }
}

/* ============================================================
   NOTE CLASS
============================================================ */

function getNoteClass(
  status: MyPrescription["status"]
) {
  switch (
    status
  ) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-800";

    case "REVIEWING":
      return "border-blue-200 bg-blue-50 text-blue-800";

    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

/* ============================================================
   MATCHED MEDICINE
============================================================ */

function getMatchedMedicine(
  value:
    | MatchedMedicine
    | string
    | null
    | undefined
) {
  if (
    !value ||
    typeof value ===
      "string"
  ) {
    return null;
  }

  return value;
}

/* ============================================================
   CURRENCY
============================================================ */

function formatCurrency(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-BD",
    {
      style:
        "currency",
      currency:
        "BDT",
      maximumFractionDigits:
        2,
    }
  ).format(value);
}

/* ============================================================
   DATE
============================================================ */

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      day: "2-digit",

      month: "short",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    }
  ).format(date);
}

/* ============================================================
   STATUS FORMAT
============================================================ */

function formatStatus(
  value: string
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

/* ============================================================
   CLOSE ICON
============================================================ */

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   PRESCRIPTION ICON
============================================================ */

function PrescriptionIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-slate-400"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 8H16M8 11H16M8 14H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15 15.5L18 18.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="13.5"
        cy="13.5"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}