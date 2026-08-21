"use client";

import {
  FormEvent,
  KeyboardEvent,
  useState,
} from "react";

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
};

type ChatApiResponse = {
  success: boolean;

  data:
    | {
        reply: string;
      }
    | null;

  message: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "initial-message",
  role: "model",
  text: "Hello! 👋 I’m Smart Pharmacy AI Assistant. How can I help you with medicines or pharmacy-related questions?",
};

const MAX_MESSAGE_LENGTH = 4000;

export default function ChatBot() {
  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] = useState<
    ChatMessage[]
  >([
    INITIAL_MESSAGE,
  ]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     BACKEND URL
  ========================================================== */

  const getApiBaseUrl =
    () => {
      const value =
        process.env
          .NEXT_PUBLIC_API_URL?.trim();

      if (!value) {
        return null;
      }

      return value.replace(
        /\/+$/,
        ""
      );
    };

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const sendMessage =
    async () => {
      const message =
        input.trim();

      if (
        loading ||
        !message
      ) {
        return;
      }

      if (
        message.length >
        MAX_MESSAGE_LENGTH
      ) {
        setError(
          `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`
        );

        return;
      }

      setError("");

      const userMessage: ChatMessage =
        {
          id: `${Date.now()}-user`,
          role: "user",
          text: message,
        };

      /* ========================================================
         UPDATE UI IMMEDIATELY
      ======================================================== */

      setMessages(
        (
          current
        ) => [
          ...current,
          userMessage,
        ]
      );

      setInput("");
      setLoading(true);

      try {
        /* ======================================================
           API URL
        ====================================================== */

        const apiBaseUrl =
          getApiBaseUrl();

        if (!apiBaseUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        /* ======================================================
           CHAT HISTORY
           
           Only send meaningful previous messages.
           Initial greeting is okay to include.
        ====================================================== */

        const history =
          messages
            .slice(-20)
            .map(
              (
                item
              ) => ({
                role:
                  item.role,
                text:
                  item.text,
              })
            );

        /* ======================================================
           API REQUEST
        ====================================================== */

        const response =
          await fetch(
            `${apiBaseUrl}/api/chat`,
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
                JSON.stringify({
                  message,

                  history,
                }),
            }
          );

        /* ======================================================
           READ RESPONSE
        ====================================================== */

        const responseText =
          await response.text();

        let result:
          | ChatApiResponse
          | null = null;

        try {
          result =
            responseText
              ? (JSON.parse(
                  responseText
                ) as ChatApiResponse)
              : null;
        } catch {
          throw new Error(
            `Chat API returned an invalid response (${response.status}).`
          );
        }

        /* ======================================================
           ERROR
        ====================================================== */

        if (
          !response.ok ||
          !result?.success ||
          !result.data?.reply
        ) {
          throw new Error(
            result?.message ||
              `Unable to get AI response (${response.status}).`
          );
        }

        /* ======================================================
           AI MESSAGE
        ====================================================== */

        const aiMessage: ChatMessage =
          {
            id: `${Date.now()}-model`,
            role: "model",
            text:
              result.data.reply,
          };

        setMessages(
          (
            current
          ) => [
            ...current,
            aiMessage,
          ]
        );
      } catch (error) {
        console.error(
          "Chatbot request error:",
          error
        );

        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to connect to the AI assistant."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     FORM SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await sendMessage();
    };

  /* ==========================================================
     ENTER KEY
  ========================================================== */

  const handleKeyDown =
    async (
      event: KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        await sendMessage();
      }
    };

  /* ==========================================================
     CLEAR CHAT
  ========================================================== */

  const clearChat =
    () => {
      if (loading) {
        return;
      }

      setMessages([
        INITIAL_MESSAGE,
      ]);

      setInput("");

      setError("");
    };

  return (
    <>
      {/* ======================================================
          FLOATING BUTTON
      ======================================================= */}

      {!isOpen && (
        <button
          type="button"
          onClick={() =>
            setIsOpen(true)
          }
          aria-label="Open Smart Pharmacy AI Assistant"
          className="fixed bottom-5 right-5 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_15px_40px_rgba(16,185,129,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(16,185,129,0.45)] sm:bottom-6 sm:right-6"
        >
          <div className="relative">
            <BotIcon />

            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-300" />
          </div>
        </button>
      )}

      {/* ======================================================
          CHAT WINDOW
      ======================================================= */}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] sm:bottom-6 sm:right-6">
          {/* ==================================================
              HEADER
          =================================================== */}

          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <BotIcon />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  Smart Pharmacy AI
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />

                  <span className="text-[10px] font-medium text-emerald-50">
                    Online assistant
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={
                  clearChat
                }
                disabled={
                  loading
                }
                aria-label="Clear chat"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshIcon />
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(
                    false
                  )
                }
                aria-label="Close chat"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* ==================================================
              MESSAGES
          =================================================== */}

          <div className="h-[420px] overflow-y-auto bg-slate-50/80 p-4">
            <div className="space-y-3">
              {messages.map(
                (
                  message
                ) => {
                  const isUser =
                    message.role ===
                    "user";

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`flex ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          isUser
                            ? "rounded-br-md bg-emerald-600 text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                        }`}
                      >
                        {message.text
                          .split(
                            "\n"
                          )
                          .map(
                            (
                              line,
                              index
                            ) => (
                              <p
                                key={`${message.id}-${index}`}
                                className={
                                  index >
                                  0
                                    ? "mt-2"
                                    : ""
                                }
                              >
                                {
                                  line
                                }
                              </p>
                            )
                          )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* =================================================
                  LOADING
              ================================================== */}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2.5">
              <p className="text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* ==================================================
              INPUT
          =================================================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-emerald-300 focus-within:bg-white">
              <textarea
                value={input}
                onChange={(
                  event
                ) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                rows={1}
                maxLength={
                  MAX_MESSAGE_LENGTH
                }
                disabled={
                  loading
                }
                placeholder="Ask about medicines..."
                className="max-h-28 min-h-[42px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim()
                }
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[9px] text-slate-400">
                AI can make mistakes. Verify important medical information.
              </p>

              <span className="shrink-0 text-[9px] text-slate-400">
                {input.length}/
                {MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/* ============================================================
   ICONS
============================================================ */

function BotIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="6"
        width="16"
        height="13"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 3V6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="2.5"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="9"
        cy="12"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="15"
        cy="12"
        r="1"
        fill="currentColor"
      />

      <path
        d="M8 16H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5L20 12L4 19L7 12L4 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M7 12H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function RefreshIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11A8 8 0 1 0 18 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M20 5V11H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}