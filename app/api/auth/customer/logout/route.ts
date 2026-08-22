import {
  NextResponse,
} from "next/server";

/* ============================================================
   CONFIG
============================================================ */

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   BACKEND URL
============================================================ */

function getBackendUrl() {
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
   POST - CUSTOMER LOGOUT
============================================================ */

export async function POST() {
  try {
    const backendUrl =
      getBackendUrl();

    /* ========================================================
       GET CURRENT CLIENT COOKIE
    ======================================================== */

    const requestCookie =
      (
        await import(
          "next/headers"
        )
      ).cookies;

    const cookieStore =
      await requestCookie();

    const customerToken =
      cookieStore.get(
        "customer_token"
      )?.value;

    /* ========================================================
       CALL BACKEND LOGOUT
       
       This is server-to-server.
       Browser CORS is not involved.
    ======================================================== */

    try {
      await fetch(
        `${backendUrl}/api/auth/customer/logout`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            ...(customerToken
              ? {
                  Cookie:
                    `customer_token=${customerToken}`,
                }
              : {}),
          },

          cache:
            "no-store",
        }
      );
    } catch (backendError) {
      /*
       * Even if backend logout fails,
       * we still clear the client cookie.
       *
       * This prevents the client from staying
       * logged in locally.
       */
      console.error(
        "Backend customer logout error:",
        backendError
      );
    }

    /* ========================================================
       CLIENT RESPONSE
    ======================================================== */

    const response =
      NextResponse.json(
        {
          success: true,
          data: null,
          message:
            "Customer logout successful",
        },
        {
          status: 200,
        }
      );

    /* ========================================================
       CLEAR CLIENT COOKIE
    ======================================================== */

    response.cookies.set(
      "customer_token",
      "",
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          process.env.NODE_ENV ===
          "production"
            ? "lax"
            : "lax",

        path: "/",

        maxAge: 0,

        expires:
          new Date(0),
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Customer Logout Proxy Error:",
      error
    );

    /*
     * Even in an unexpected error,
     * return a response that attempts to
     * clear the client session cookie.
     */

    const response =
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            error instanceof Error
              ? error.message
              : "Failed to logout",
        },
        {
          status: 500,
        }
      );

    response.cookies.set(
      "customer_token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires:
          new Date(0),
      }
    );

    return response;
  }
}