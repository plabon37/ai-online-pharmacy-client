import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

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

    const cookieStore =
      await cookies();

    const customerToken =
      cookieStore.get(
        "customer_token"
      )?.value;

    /* ========================================================
       BACKEND LOGOUT
    ======================================================== */

    try {
      await fetch(
        `${backendUrl}/api/auth/customer/logout`,
        {
          method:
            "POST",

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
    } catch (
      backendError
    ) {
      console.error(
        "Backend logout error:",
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
        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path: "/",

        maxAge:
          0,

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

    const response =
      NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Failed to logout",
        },
        {
          status: 500,
        }
      );

    response.cookies.set(
      "customer_token",
      "",
      {
        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path: "/",

        maxAge:
          0,

        expires:
          new Date(0),
      }
    );

    return response;
  }
}