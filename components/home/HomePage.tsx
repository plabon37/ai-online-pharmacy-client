import Link from "next/link";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string;
};

type Medicine = {
  _id: string;
  name: string;
  genericName?: string;
  slug?: string;
  price?: number;
  stock?: number;
  image?: string;
  category?: {
    _id: string;
    name: string;
    slug?: string;
  } | null;
};

type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
};

type MedicineApiData = {
  medicines: Medicine[];
};

type CategoryApiData = {
  categories: Category[];
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

  return apiUrl.replace(/\/$/, "");
}

/* ============================================================
   FETCH MEDICINES
============================================================ */

async function getMedicines(): Promise<
  Medicine[]
> {
  try {
    const apiBaseUrl =
      getApiBaseUrl();

    const response =
      await fetch(
        `${apiBaseUrl}/api/medicines?limit=8`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      const text =
        await response.text();

      console.error(
        "Home medicines API returned non-JSON:",
        text.slice(0, 500)
      );

      return [];
    }

    const result =
      (await response.json()) as ApiResponse<MedicineApiData>;

    if (
      !response.ok ||
      !result.success ||
      !result.data
    ) {
      console.error(
        "Home medicines API error:",
        result.message
      );

      return [];
    }

    return Array.isArray(
      result.data.medicines
    )
      ? result.data.medicines
      : [];
  } catch (error) {
    console.error(
      "Home medicines fetch error:",
      error
    );

    return [];
  }
}

/* ============================================================
   FETCH CATEGORIES
============================================================ */

async function getCategories(): Promise<
  Category[]
> {
  try {
    const apiBaseUrl =
      getApiBaseUrl();

    const response =
      await fetch(
        `${apiBaseUrl}/api/categories?limit=8`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      const text =
        await response.text();

      console.error(
        "Home categories API returned non-JSON:",
        text.slice(0, 500)
      );

      return [];
    }

    const result =
      (await response.json()) as ApiResponse<CategoryApiData>;

    if (
      !response.ok ||
      !result.success ||
      !result.data
    ) {
      console.error(
        "Home categories API error:",
        result.message
      );

      return [];
    }

    return Array.isArray(
      result.data.categories
    )
      ? result.data.categories
      : [];
  } catch (error) {
    console.error(
      "Home categories fetch error:",
      error
    );

    return [];
  }
}

/* ============================================================
   HOME PAGE
============================================================ */

export default async function HomePage() {
  const [
    medicines,
    categories,
  ] = await Promise.all([
    getMedicines(),
    getCategories(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        {/* Background decoration */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          {/* ==================================================
              HERO CONTENT
          =================================================== */}

          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-xs">
              Smart Healthcare
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              A smarter way to
              <span className="text-emerald-600">
                {" "}
                manage your healthcare
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              Discover medicines, explore healthcare
              categories, track your orders and access
              trusted pharmacy services from one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/medicines"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Browse Medicines

                <ArrowIcon />
              </Link>

              <Link
                href="/categories"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Explore Categories

                <ArrowIcon />
              </Link>
            </div>

            {/* Trust indicators */}

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <TrustItem
                value="24/7"
                label="Easy Access"
              />

              <TrustItem
                value="Secure"
                label="Ordering"
              />

              <TrustItem
                value="Smart"
                label="Pharmacy Care"
              />
            </div>
          </div>

          {/* ==================================================
              HERO VISUAL
          =================================================== */}

          <div className="relative">
            <div className="relative mx-auto max-w-[560px]">
              <div className="aspect-square overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-1 shadow-2xl shadow-emerald-100">
                <div className="flex h-full flex-col items-center justify-center rounded-[28px] bg-white/10 p-8 text-center backdrop-blur-sm">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 text-white shadow-xl backdrop-blur-md">
                    <MedicalIcon />
                  </div>

                  <h2 className="mt-7 text-2xl font-bold text-white sm:text-3xl">
                    Smart Pharmacy
                  </h2>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-50">
                    Medicines, orders and
                    intelligent healthcare
                    support in one platform.
                  </p>

                  <div className="mt-7 flex flex-wrap justify-center gap-2">
                    <Badge text="Medicines" />

                    <Badge text="Orders" />

                    <Badge text="AI Support" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:-left-6">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                  Pharmacy
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  Always here for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="Explore"
          title="Shop by Category"
          description="Find the medicines and healthcare products you need."
          href="/categories"
          action="View All"
        />

        {categories.length === 0 ? (
          <PromoCard
            href="/categories"
            eyebrow="Healthcare Collection"
            title="Explore our medicine categories"
            description="Browse pain relief, vitamins, digestive care, personal care, and more in one convenient place."
            action="Explore Categories"
            icon={<CategoryIcon />}
            variant="emerald"
          />
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map(
              (category) => (
                <Link
                  key={
                    category._id
                  }
                  href={`/categories/${encodeURIComponent(
                    category.slug
                  )}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
                    <CategoryIcon />
                  </div>

                  <h3 className="mt-4 truncate text-sm font-bold text-slate-800 sm:text-base">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    Explore medicines
                  </p>
                </Link>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          MEDICINES
      ====================================================== */}

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="Pharmacy"
            title="Popular Medicines"
            description="Browse available medicines from your smart pharmacy."
            href="/medicines"
            action="View All Medicines"
          />

          {medicines.length === 0 ? (
            <PromoCard
              href="/medicines"
              eyebrow="Pharmacy Store"
              title="Discover medicines for your everyday needs"
              description="Visit our medicine store to explore available products, prices, stock information, and details."
              action="Browse Medicines"
              icon={<MedicineIcon large />}
              variant="teal"
            />
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
        </div>
      </section>

      {/* =====================================================
          QUICK LINKS
      ====================================================== */}

      <section className="mx-auto w-full max-w-[1440px] px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/orders"
            icon={<OrderIcon />}
            title="Track Orders"
            description="View your recent order history."
          />

          <QuickLink
            href="/prescription"
            icon={
              <PrescriptionIcon />
            }
            title="Prescription"
            description="Upload and review prescriptions."
          />

          <QuickLink
            href="/profile"
            icon={<UserIcon />}
            title="My Profile"
            description="Manage your customer account."
          />
        </div>
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
  const outOfStock =
    Number(
      medicine.stock ?? 0
    ) <= 0;

  return (
    <Link
      href={`/medicines/${
        medicine.slug ||
        medicine._id
      }`}
      className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50">
        {medicine.image ? (
          <img
            src={medicine.image}
            alt={
              medicine.name
            }
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <MedicinePlaceholder />
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold ${
            outOfStock
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {outOfStock
            ? "Out of stock"
            : "Available"}
        </span>
      </div>

      <div className="p-3.5 sm:p-4">
        <p className="truncate text-sm font-bold text-slate-800">
          {medicine.name}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
          {medicine.genericName ||
            medicine.category?.name ||
            "Medicine"}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-emerald-600 sm:text-base">
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

          <span className="text-[10px] font-semibold text-slate-400 transition group-hover:text-emerald-600">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   SECTION HEADING
============================================================ */

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>

        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-emerald-600 transition hover:text-emerald-700"
      >
        {action}

        <ArrowIcon />
      </Link>
    </div>
  );
}

/* ============================================================
   TRUST ITEM
============================================================ */

function TrustItem({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-sm font-bold text-slate-800">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
   BADGE
============================================================ */

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-semibold text-white backdrop-blur-sm">
      {text}
    </span>
  );
}

/* ============================================================
   QUICK LINK
============================================================ */

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[10px] text-slate-400 sm:text-xs">
          {description}
        </span>
      </span>

      <ArrowIcon />
    </Link>
  );
}

/* ============================================================
   PROMO CARD
============================================================ */

function PromoCard({
  href,
  eyebrow,
  title,
  description,
  action,
  icon,
  variant = "emerald",
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  variant?: "emerald" | "teal";
}) {
  const emerald =
    variant === "emerald";

  return (
    <Link
      href={href}
      className="group mt-7 block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
    >
      <div className="relative overflow-hidden">
        <div
          className={`absolute inset-0 ${
            emerald
              ? "bg-gradient-to-br from-emerald-50 via-white to-cyan-50"
              : "bg-gradient-to-br from-teal-50 via-white to-emerald-50"
          }`}
        />

        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${
            emerald
              ? "bg-emerald-200/45"
              : "bg-teal-200/45"
          }`}
        />

        <div
          className={`pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full blur-3xl ${
            emerald
              ? "bg-cyan-200/35"
              : "bg-emerald-200/35"
          }`}
        />

        <div className="relative grid items-center gap-6 px-6 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1fr_auto] lg:px-10">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-emerald-600 shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 ${
                emerald
                  ? "bg-emerald-100"
                  : "bg-teal-100"
              }`}
            >
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                {eyebrow}
              </p>

              <h3 className="mt-1.5 max-w-2xl text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                {action}

                <ArrowIcon />
              </span>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-[28px] text-emerald-600 shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 ${
                emerald
                  ? "bg-white"
                  : "bg-white"
              }`}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   EMPTY SECTION
============================================================ */

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        <MedicineIcon />
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-700">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   MEDICINE PLACEHOLDER
============================================================ */

function MedicinePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-emerald-300">
      <MedicineIcon large />
    </div>
  );
}

/* ============================================================
   ICONS
============================================================ */

function MedicalIcon() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 8V16M8 12H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function CategoryIcon() {
  return (
    <svg
      width="21"
      height="21"
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

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function ChatIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size =
    large ? 34 : 17;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="ml-2"
    >
      <path
        d="M5 6.5C5 5.12 6.12 4 7.5 4H16.5C17.88 4 19 5.12 19 6.5V13.5C19 14.88 17.88 16 16.5 16H11L7 20V16.3C5.84 16.08 5 15.06 5 13.8V6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 9H15.5M8.5 12H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 12H16M8 15H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3.5H14L18 7.5V20.5H6V3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.5V7.5H18"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 11H15M9 14H15M9 17H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.6 16.4 8 14.5 12 14.5C16 14.5 18.4 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}