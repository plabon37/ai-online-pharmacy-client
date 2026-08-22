import {
  NextRequest,
  NextResponse,
} from "next/server";

/* ============================================================
   CONFIG
============================================================ */

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   TYPES
============================================================ */

type BackendLoginResponse = {
  success?: boolean;

  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
      role: "CUSTOMER";
      isActive: boolean;
    };
  } | null;

  message?: string;
};

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
   POST - CUSTOMER LOGIN PROXY
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. BACKEND URL
    ======================================================== */

    const backendUrl =
      getBackendUrl();

    /* ========================================================
       2. READ REQUEST BODY
    ======================================================== */

    let body: {
      email?: unknown;
      password?: unknown;
    };

    try {
      body =
        (await request.json()) as {
          email?: unknown;
          password?: unknown;
        };
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    const email =
      typeof body.email ===
      "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    /* ========================================================
       3. VALIDATION
    ======================================================== */

    if (
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Email and password are required",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       4. BACKEND LOGIN
       
       Server-to-server request.
       Browser CORS is NOT involved here.
    ======================================================== */

    const backendResponse =
      await fetch(
        `${backendUrl}/api/auth/customer/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),

          cache:
            "no-store",
        }
      );

    /* ========================================================
       5. READ BACKEND RESPONSE
    ======================================================== */

    const responseText =
      await backendResponse.text();

    let result:
      | BackendLoginResponse
      | null = null;

    try {
      result =
        responseText
          ? (JSON.parse(
              responseText
            ) as BackendLoginResponse)
          : null;
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            `Backend login returned invalid JSON (${backendResponse.status}).`,
        },
        {
          status: 502,
        }
      );
    }

    /* ========================================================
       6. BACKEND ERROR
    ======================================================== */

    if (
      !backendResponse.ok ||
      !result?.success
    ) {
      return NextResponse.json(
        {
          success: false,

          data:
            result?.data ??
            null,

          message:
            result?.message ||
            `Login failed (${backendResponse.status}).`,
        },
        {
          status:
            backendResponse.status >=
              400 &&
            backendResponse.status <=
              599
              ? backendResponse.status
              : 502,
        }
      );
    }

    /* ========================================================
       7. VALIDATE CUSTOMER
    ======================================================== */

    const customer =
      result.data?.user;

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Customer information was not returned by the backend.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      customer.role !==
      "CUSTOMER"
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Invalid customer account.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !customer.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Your customer account is currently inactive.",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       8. CREATE CLIENT RESPONSE
    ======================================================== */

    const response =
      NextResponse.json(
        {
          success: true,

          data: {
            user: customer,
          },

          message:
            "Customer login successful",
        },
        {
          status: 200,
        }
      );

    /* ========================================================
       9. GET BACKEND SET-COOKIE
       
       Node/Next.js may expose getSetCookie().
    ======================================================== */

    const setCookieHeader =
      typeof backendResponse
        .headers.getSetCookie ===
      "function"
        ? backendResponse.headers.getSetCookie()
        : [];

    /* ========================================================
       10. EXTRACT CUSTOMER TOKEN
    ======================================================== */

    let customerToken =
      "";

    for (
      const cookie of
        setCookieHeader
    ) {
      const match =
        cookie.match(
          /(?:^|;\s*)customer_token=([^;]*)/
        );

      if (match?.[1]) {
        customerToken =
          match[1];

        break;
      }
    }

    /*
     * Fallback for environments where
     * getSetCookie() is unavailable.
     */

    if (
      !customerToken
    ) {
      const rawSetCookie =
        backendResponse.headers.get(
          "set-cookie"
        );

      if (
        rawSetCookie
      ) {
        const match =
          rawSetCookie.match(
            /customer_token=([^;]*)/
          );

        if (match?.[1]) {
          customerToken =
            match[1];
        }
      }
    }

    /* ========================================================
       11. TOKEN MUST EXIST
    ======================================================== */

    if (
      !customerToken
    ) {
      console.error(
        "Customer login proxy: Backend login succeeded but customer_token was not returned."
      );

      return NextResponse.json(
        {
          success: false,
          data: null,
          message:
            "Login succeeded but customer session could not be created.",
        },
        {
          status: 502,
        }
      );
    }

    /* ========================================================
       12. SET COOKIE ON CLIENT DOMAIN
       
       This is the key fix.
    ======================================================== */

    response.cookies.set(
      "customer_token",
      customerToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        /*
         * Same-site when cookie belongs
         * to the client domain.
         *
         * This works for both localhost
         * and the deployed client domain.
         */
        sameSite: "lax",

        path: "/",

        maxAge:
          60 *
          60 *
          24 *
          7,
      }
    );

    /* ========================================================
       13. RETURN
    ======================================================== */

    return response;
  } catch (error) {
    console.error(
      "Customer Login Proxy Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to the backend server.",
      },
      {
        status: 500,
      }
    );
  }
}