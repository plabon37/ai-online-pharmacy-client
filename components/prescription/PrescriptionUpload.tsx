"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

/* ============================================================
   TYPES
============================================================ */

type PrescriptionUploadProps = {
  onSuccess?: () => void;
};

type UploadedMedicine = {
  name?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  confidence?: number;
  needsReview?: boolean;
};

type UploadedTest = {
  name?: string;
  category?: string;
  notes?: string;
  confidence?: number;
  needsReview?: boolean;
};

type AIProcessingResult = {
  _id?: string;

  aiStatus?: string;

  extractedText?: string;

  cleanedText?: string;

  medicines?: UploadedMedicine[];

  tests?: UploadedTest[];

  status?: string;

  patientName?: string;

  image?: string;

  fileType?: string;
};

type UploadResponse = {
  success?: boolean;

  data?: {
    prescription?: {
      _id?: string;

      patientName?: string;

      image?: string;

      fileType?: string;

      aiStatus?: string;

      status?: string;
    } | null;
  } | null;

  message?: string;
};

type AIResponse = {
  success?: boolean;

  data?:
    | AIProcessingResult
    | {
        prescription?:
          | AIProcessingResult
          | null;
      }
    | null;

  message?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/* ============================================================
   COMPONENT
============================================================ */

export default function PrescriptionUpload({
  onSuccess,
}: PrescriptionUploadProps) {
  /* ==========================================================
     FORM
  ========================================================== */

  const [
    patientName,
    setPatientName,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    aiProcessing,
    setAiProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* ==========================================================
     AI RESULT
  ========================================================== */

  const [
    aiResult,
    setAiResult,
  ] =
    useState<AIProcessingResult | null>(
      null
    );

  /* ==========================================================
     FILE PREVIEW
  ========================================================== */

  const previewUrl =
    useMemo(() => {
      if (!selectedFile) {
        return "";
      }

      return URL.createObjectURL(
        selectedFile
      );
    }, [
      selectedFile,
    ]);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(
        previewUrl
      );
    };
  }, [
    previewUrl,
  ]);

  /* ==========================================================
     FILE CHANGE
  ========================================================== */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");
    setSuccess("");
    setAiResult(null);

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type as (typeof ALLOWED_FILE_TYPES)[number]
      )
    ) {
      setSelectedFile(null);
      event.target.value = "";

      setError(
        "Only JPG, PNG, WebP and PDF files are allowed."
      );

      return;
    }

    if (
      file.size <= 0
    ) {
      setSelectedFile(null);
      event.target.value = "";

      setError(
        "Selected file is empty."
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setSelectedFile(null);
      event.target.value = "";

      setError(
        "Prescription file must be 10MB or less."
      );

      return;
    }

    setSelectedFile(file);
  };

  /* ==========================================================
     REMOVE FILE
  ========================================================== */

  const handleRemoveFile =
    () => {
      setSelectedFile(null);
      setError("");
      setSuccess("");
      setAiResult(null);

      const input =
        document.getElementById(
          "prescription-file"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    };

  /* ==========================================================
     NORMALIZE AI RESPONSE
  ========================================================== */

  function normalizeAIResult(
    data:
      | AIResponse["data"]
      | null
      | undefined
  ): AIProcessingResult | null {
    if (!data) {
      return null;
    }

    if (
      "prescription" in data
    ) {
      return (
        data.prescription ??
        null
      );
    }

    return data as AIProcessingResult;
  }

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        isUploading ||
        aiProcessing
      ) {
        return;
      }

      setError("");
      setSuccess("");
      setAiResult(null);

      /* ======================================================
         PATIENT
      ====================================================== */

      const cleanPatientName =
        patientName.trim();

      if (!cleanPatientName) {
        setError(
          "Patient name is required."
        );

        return;
      }

      if (
        cleanPatientName.length <
        2
      ) {
        setError(
          "Patient name must be at least 2 characters long."
        );

        return;
      }

      if (
        cleanPatientName.length >
        100
      ) {
        setError(
          "Patient name cannot exceed 100 characters."
        );

        return;
      }

      /* ======================================================
         FILE
      ====================================================== */

      if (!selectedFile) {
        setError(
          "Please select a prescription image or PDF."
        );

        return;
      }

      /* ======================================================
         NOTE
      ====================================================== */

      const cleanNote =
        note.trim();

      if (
        cleanNote.length >
        1000
      ) {
        setError(
          "Note cannot exceed 1000 characters."
        );

        return;
      }

      /* ======================================================
         API URL
      ====================================================== */

      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL?.trim();

      if (!apiUrl) {
        setError(
          "NEXT_PUBLIC_API_URL is not configured."
        );

        return;
      }

      const cleanApiUrl =
        apiUrl.replace(
          /\/+$/,
          ""
        );

      try {
        /* ====================================================
           STEP 1 — UPLOAD
        ==================================================== */

        setIsUploading(true);

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile
        );

        formData.append(
          "patientName",
          cleanPatientName
        );

        formData.append(
          "note",
          cleanNote
        );

        const uploadResponse =
          await fetch(
            `${cleanApiUrl}/api/prescriptions`,
            {
              method: "POST",

              mode: "cors",

              headers: {
                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body:
                formData,
            }
          );

        const uploadText =
          await uploadResponse.text();

        let uploadResult:
          | UploadResponse
          | null = null;

        try {
          uploadResult =
            uploadText
              ? (JSON.parse(
                  uploadText
                ) as UploadResponse)
              : null;
        } catch {
          throw new Error(
            `Upload API returned an invalid response (${uploadResponse.status}).`
          );
        }

        if (
          uploadResponse.status ===
          401
        ) {
          window.location.href =
            `/login?redirect=${encodeURIComponent(
              "/prescriptions/upload"
            )}`;

          return;
        }

        if (
          !uploadResponse.ok ||
          !uploadResult?.success
        ) {
          throw new Error(
            uploadResult?.message ||
              "Failed to upload prescription."
          );
        }

        const prescriptionId =
          uploadResult.data
            ?.prescription?._id;

        if (!prescriptionId) {
          throw new Error(
            "Prescription ID was not returned by the server."
          );
        }

        setIsUploading(false);

        /* ==================================================
           STEP 2 — AI
        ================================================== */

        setAiProcessing(true);

        setSuccess(
          "Prescription uploaded. AI processing has started..."
        );

        const aiResponse =
          await fetch(
            `${cleanApiUrl}/api/prescriptions/${encodeURIComponent(
              prescriptionId
            )}`,
            {
              method: "POST",

              mode: "cors",

              headers: {
                Accept:
                  "application/json",
              },

              credentials:
                "include",
            }
          );

        const aiText =
          await aiResponse.text();

        let aiResponseData:
          | AIResponse
          | null = null;

        try {
          aiResponseData =
            aiText
              ? (JSON.parse(
                  aiText
                ) as AIResponse)
              : null;
        } catch {
          throw new Error(
            `AI API returned an invalid response (${aiResponse.status}).`
          );
        }

        if (
          aiResponse.status ===
          401
        ) {
          window.location.href =
            `/login?redirect=${encodeURIComponent(
              "/prescriptions/upload"
            )}`;

          return;
        }

        if (
          !aiResponse.ok ||
          !aiResponseData?.success
        ) {
          throw new Error(
            aiResponseData?.message ||
              "AI processing failed."
          );
        }

        /* ==================================================
           NORMALIZE
        ================================================== */

        const processedPrescription =
          normalizeAIResult(
            aiResponseData.data
          );

        if (
          !processedPrescription
        ) {
          throw new Error(
            "AI processing returned no prescription data."
          );
        }

        /* ==================================================
           DEBUG
        ================================================== */

        console.log(
          "✅ AI RESULT:",
          processedPrescription
        );

        /* ==================================================
           SET RESULT
        ================================================== */

        setAiResult(
          processedPrescription
        );

        setSuccess(
          "Prescription analysis completed successfully."
        );

        onSuccess?.();
      } catch (error) {
        console.error(
          "Prescription Upload / AI Error:",
          error
        );

        if (
          error instanceof
            TypeError &&
          error.message ===
            "Failed to fetch"
        ) {
          setError(
            "Unable to connect to the pharmacy server. Please make sure the backend is running."
          );

          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Prescription processing failed."
        );
      } finally {
        setIsUploading(false);
        setAiProcessing(false);
      }
    };

  /* ==========================================================
     VALUES
  ========================================================== */

  const formattedFileSize =
    selectedFile
      ? formatFileSize(
          selectedFile.size
        )
      : "";

  const detectedMedicines =
    Array.isArray(
      aiResult?.medicines
    )
      ? aiResult.medicines
      : [];

  const detectedTests =
    Array.isArray(
      aiResult?.tests
    )
      ? aiResult.tests
      : [];

  /* ==========================================================
     AI STATUS
  ========================================================== */

  const aiStatus =
    String(
      aiResult?.aiStatus ||
        "PROCESSING"
    );

  const isAICompleted =
    aiStatus ===
      "COMPLETED";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section className="w-full">
      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
          Prescription AI
        </span>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Upload Prescription
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Upload your prescription and let the AI extract
          prescription text, medicines and diagnostic tests.
        </p>
      </div>

      {/* ====================================================
          SUCCESS
      ===================================================== */}

      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckIcon />
            </span>

            <div>
              <p className="text-sm font-bold text-emerald-800">
                Success
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                {success}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ErrorIcon />
            </span>

            <div>
              <p className="text-sm font-bold text-red-800">
                Processing failed
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          UPLOAD FORM
      ===================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ==================================================
              LEFT
          =================================================== */}

          <div className="space-y-5">
            {/* =================================================
                PATIENT NAME
            ================================================== */}

            <div>
              <label
                htmlFor="patient-name"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Patient Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="patient-name"
                type="text"
                value={
                  patientName
                }
                disabled={
                  isUploading ||
                  aiProcessing
                }
                onChange={(
                  event
                ) => {
                  setPatientName(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Enter patient name"
                maxLength={100}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* =================================================
                FILE
            ================================================== */}

            <div>
              <label
                htmlFor="prescription-file"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Prescription File
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              {!selectedFile ? (
                <label
                  htmlFor="prescription-file"
                  className="group flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                    <UploadIcon />
                  </span>

                  <p className="mt-4 text-sm font-bold text-slate-800">
                    Click to upload prescription
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG, WebP or PDF · Maximum 10MB
                  </p>

                  <span className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                    Choose File
                  </span>
                </label>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="relative flex min-h-[250px] items-center justify-center bg-slate-100 p-4">
                    {selectedFile.type ===
                    "application/pdf" ? (
                      <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                          <PdfIcon />
                        </div>

                        <p className="mt-3 max-w-md break-all text-sm font-bold text-slate-700">
                          {
                            selectedFile.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          PDF ·{" "}
                          {
                            formattedFileSize
                          }
                        </p>
                      </div>
                    ) : (
                      <img
                        src={
                          previewUrl
                        }
                        alt="Prescription preview"
                        className="max-h-[360px] max-w-full rounded-xl object-contain shadow-sm"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-700">
                        {
                          selectedFile.name
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {
                          formattedFileSize
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleRemoveFile
                      }
                      disabled={
                        isUploading ||
                        aiProcessing
                      }
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon />
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <input
                id="prescription-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                disabled={
                  isUploading ||
                  aiProcessing
                }
                onChange={
                  handleFileChange
                }
              />
            </div>

            {/* =================================================
                NOTE
            ================================================== */}

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="prescription-note"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Note{" "}
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <span className="text-[10px] text-slate-400">
                  {note.length}
                  /1000
                </span>
              </div>

              <textarea
                id="prescription-note"
                value={
                  note
                }
                disabled={
                  isUploading ||
                  aiProcessing
                }
                onChange={(
                  event
                ) => {
                  setNote(
                    event.target.value
                  );
                }}
                placeholder="Add any additional information..."
                maxLength={1000}
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* =================================================
                SUBMIT
            ================================================== */}

            <button
              type="submit"
              disabled={
                isUploading ||
                aiProcessing
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isUploading ? (
                <>
                  <SpinnerIcon />
                  Uploading...
                </>
              ) : aiProcessing ? (
                <>
                  <SpinnerIcon />
                  AI Processing...
                </>
              ) : (
                <>
                  <UploadIcon />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>

          {/* ==================================================
              RIGHT PANEL
          =================================================== */}

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                AI Processing
              </p>

              <h2 className="mt-1 text-base font-bold text-slate-900">
                What happens after upload?
              </h2>

              <div className="mt-5 space-y-4">
                <StepItem
                  number="01"
                  title="Upload"
                  description="Your prescription is securely uploaded."
                />

                <StepItem
                  number="02"
                  title="OCR"
                  description="Gemini reads the visible prescription text."
                />

                <StepItem
                  number="03"
                  title="Clean"
                  description="Obvious OCR errors are normalized."
                />

                <StepItem
                  number="04"
                  title="Extract"
                  description="Medicines and diagnostic tests are separated."
                />
              </div>

              <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                <p className="text-[10px] leading-5 text-cyan-700">
                  AI results are preliminary and will later be
                  reviewed by the pharmacy administrator.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>

      {/* ======================================================
          STRUCTURED AI RESULT
      ======================================================= */}

      {aiResult && (
        <section className="mt-6 space-y-5">
          {/* ==================================================
              STATUS CARD
          =================================================== */}

          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  AI Result
                </span>

                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Prescription Analysis
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {isAICompleted
                    ? "AI analysis has been completed."
                    : "AI analysis is still in progress."}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${
                  isAICompleted
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {aiStatus}
              </span>
            </div>
          </div>

          {/* ==================================================
              RAW OCR
          =================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              RAW OCR TEXT
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Extracted Prescription Text
            </h2>

            <div className="mt-4 min-h-[100px] whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {aiResult.extractedText?.trim() ||
                "No OCR text returned."}
            </div>
          </div>

          {/* ==================================================
              CLEANED TEXT
          =================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              CLEANED TEXT
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Normalized Prescription
            </h2>

            <div className="mt-4 min-h-[100px] whitespace-pre-wrap rounded-2xl bg-emerald-50/60 p-4 text-sm leading-7 text-slate-700">
              {aiResult.cleanedText?.trim() ||
                "No cleaned text returned."}
            </div>
          </div>

          {/* ==================================================
              MEDICINES
          =================================================== */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                MEDICINE DETECTION
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Detected Medicines
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {detectedMedicines.length} medicine
                {detectedMedicines.length ===
                1
                  ? ""
                  : "s"}{" "}
                detected
              </p>
            </div>

            {detectedMedicines.length ===
            0 ? (
              <EmptyState
                title="No medicines were detected."
                description="The prescription may need manual review."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <TableHeader>
                        Medicine
                      </TableHeader>

                      <TableHeader>
                        Strength
                      </TableHeader>

                      <TableHeader>
                        Dosage
                      </TableHeader>

                      <TableHeader>
                        Frequency
                      </TableHeader>

                      <TableHeader>
                        Duration
                      </TableHeader>

                      <TableHeader>
                        Confidence
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {detectedMedicines.map(
                      (
                        medicine,
                        index
                      ) => (
                        <tr
                          key={`${medicine.name || "medicine"}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {medicine.name ||
                                "Unknown"}
                            </p>

                            {medicine.needsReview && (
                              <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
                                Needs Review
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {medicine.strength ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {medicine.dosage ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {medicine.frequency ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {medicine.duration ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <ConfidenceBadge
                              value={
                                medicine.confidence
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ==================================================
              TESTS
          =================================================== */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">
                TEST DETECTION
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Detected Tests
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {detectedTests.length} test
                {detectedTests.length ===
                1
                  ? ""
                  : "s"}{" "}
                detected
              </p>
            </div>

            {detectedTests.length ===
            0 ? (
              <EmptyState
                title="No tests were detected."
                description="No diagnostic investigation was identified in the prescription."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <TableHeader>
                        Test
                      </TableHeader>

                      <TableHeader>
                        Category
                      </TableHeader>

                      <TableHeader>
                        Notes
                      </TableHeader>

                      <TableHeader>
                        Confidence
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {detectedTests.map(
                      (
                        test,
                        index
                      ) => (
                        <tr
                          key={`${test.name || "test"}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {test.name ||
                                "Unknown test"}
                            </p>

                            {test.needsReview && (
                              <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
                                Needs Review
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {test.category ||
                              "Other"}
                          </td>

                          <td className="max-w-[350px] px-5 py-4 text-xs leading-5 text-slate-600">
                            {test.notes ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <ConfidenceBadge
                              value={
                                test.confidence
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ==================================================
              REVIEW NOTICE
          =================================================== */}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <InfoIcon />
              </span>

              <div>
                <p className="text-xs font-bold text-amber-800">
                  AI result requires pharmacy review
                </p>

                <p className="mt-1 text-[10px] leading-5 text-amber-700">
                  AI extraction is only an assistance step. The
                  pharmacy administrator will review medicines and
                  tests before final approval.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          BACK
      ======================================================= */}

      <div className="mt-6">
        <Link
          href="/medicines"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          ← Back to Medicines
        </Link>
      </div>
    </section>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================
   CONFIDENCE BADGE
============================================================ */

function ConfidenceBadge({
  value,
}: {
  value?: number;
}) {
  const confidence =
    Math.min(
      1,
      Math.max(
        0,
        Number(value) || 0
      )
    );

  const percentage =
    Math.round(
      confidence * 100
    );

  return (
    <span
      className={`text-xs font-bold ${
        percentage >= 80
          ? "text-emerald-600"
          : percentage >= 60
          ? "text-amber-600"
          : "text-red-600"
      }`}
    >
      {percentage}%
    </span>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   STEP ITEM
============================================================ */

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-extrabold text-emerald-600 shadow-sm">
        {number}
      </span>

      <div>
        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   FILE SIZE
============================================================ */

function formatFileSize(
  bytes: number
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* ============================================================
   UPLOAD ICON
============================================================ */

function UploadIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M7 9L12 4L17 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   PDF ICON
============================================================ */

function PdfIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3H14L18 7V21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M14 3V7H18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M8 12H16M8 15H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   TRASH ICON
============================================================ */

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9 7V4H15V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
   ERROR ICON
============================================================ */

function ErrorIcon() {
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

/* ============================================================
   INFO ICON
============================================================ */

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
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