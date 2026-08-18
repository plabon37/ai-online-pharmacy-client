/* ============================================================
   CART TYPES
============================================================ */

export type CartItem = {
  medicineId: string;

  name: string;

  slug: string;

  genericName?: string;

  image?: string;

  price: number;

  quantity: number;

  stock: number;
};

/* ============================================================
   CART STORAGE KEY
============================================================ */

export const CART_STORAGE_KEY =
  "smart_pharmacy_cart";

/* ============================================================
   CART UPDATE EVENT
============================================================ */

export const CART_UPDATED_EVENT =
  "smart-pharmacy-cart-updated";

/* ============================================================
   SAFE NUMBER
============================================================ */

function toSafeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

/* ============================================================
   NOTIFY CART UPDATE
============================================================ */

export function notifyCartUpdated() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    /*
     * Same-tab listeners.
     */
    window.dispatchEvent(
      new Event(
        CART_UPDATED_EVENT
      )
    );
  } catch (error) {
    console.error(
      "Cart update event error:",
      error
    );
  }
}

/* ============================================================
   NORMALIZE CART ITEM
============================================================ */

export function normalizeCartItem(
  item: Partial<CartItem>
): CartItem {
  return {
    medicineId: String(
      item.medicineId || ""
    ),

    name: String(
      item.name || ""
    ),

    slug: String(
      item.slug ||
        item.medicineId ||
        ""
    ),

    genericName:
      item.genericName
        ? String(
            item.genericName
          )
        : undefined,

    image:
      item.image
        ? String(
            item.image
          )
        : undefined,

    price:
      toSafeNumber(
        item.price
      ),

    quantity: Math.max(
      1,
      Math.floor(
        toSafeNumber(
          item.quantity,
          1
        )
      )
    ),

    stock: Math.max(
      0,
      Math.floor(
        toSafeNumber(
          item.stock
        )
      )
    ),
  };
}

/* ============================================================
   GET CART
============================================================ */

export function getCart(): CartItem[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        CART_STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed
      .map(
        (item) =>
          normalizeCartItem(
            item
          )
      )
      .filter(
        (item) =>
          item.medicineId &&
          item.name
      );
  } catch (error) {
    console.error(
      "Cart read error:",
      error
    );

    return [];
  }
}

/* ============================================================
   SAVE CART
============================================================ */

export function saveCart(
  cart: CartItem[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const normalizedCart =
      cart
        .map(
          (item) =>
            normalizeCartItem(
              item
            )
        )
        .filter(
          (item) =>
            item.medicineId &&
            item.name
        );

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(
        normalizedCart
      )
    );

    /*
     * Notify all same-page subscribers.
     * Navbar listens to this event.
     */
    notifyCartUpdated();
  } catch (error) {
    console.error(
      "Cart save error:",
      error
    );
  }
}

/* ============================================================
   CLEAR CART
============================================================ */

export function clearCart() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      CART_STORAGE_KEY
    );

    /*
     * Navbar/cart listeners update immediately.
     */
    notifyCartUpdated();
  } catch (error) {
    console.error(
      "Cart clear error:",
      error
    );
  }
}

/* ============================================================
   ADD ITEM
============================================================ */

export function addToCart(
  item: CartItem
): CartItem[] {
  const cart =
    getCart();

  const normalizedItem =
    normalizeCartItem(
      item
    );

  if (
    !normalizedItem.medicineId ||
    !normalizedItem.name
  ) {
    console.error(
      "Invalid cart item:",
      item
    );

    return cart;
  }

  const existingIndex =
    cart.findIndex(
      (cartItem) =>
        cartItem.medicineId ===
        normalizedItem.medicineId
    );

  /* ==========================================================
     NEW ITEM
  ========================================================== */

  if (
    existingIndex === -1
  ) {
    /*
     * Respect stock when stock > 0.
     */
    const safeQuantity =
      normalizedItem.stock >
      0
        ? Math.min(
            normalizedItem.quantity,
            normalizedItem.stock
          )
        : normalizedItem.quantity;

    const nextCart = [
      ...cart,
      {
        ...normalizedItem,
        quantity:
          Math.max(
            1,
            safeQuantity
          ),
      },
    ];

    saveCart(
      nextCart
    );

    return nextCart;
  }

  /* ==========================================================
     EXISTING ITEM
  ========================================================== */

  const existingItem =
    cart[
      existingIndex
    ];

  const requestedQuantity =
    existingItem.quantity +
    normalizedItem.quantity;

  const maxStock =
    Math.max(
      0,
      normalizedItem.stock
    );

  const finalQuantity =
    maxStock > 0
      ? Math.min(
          requestedQuantity,
          maxStock
        )
      : requestedQuantity;

  const nextCart =
    [...cart];

  nextCart[
    existingIndex
  ] = {
    ...existingItem,

    name:
      normalizedItem.name,

    slug:
      normalizedItem.slug,

    genericName:
      normalizedItem.genericName,

    image:
      normalizedItem.image,

    price:
      normalizedItem.price,

    stock:
      normalizedItem.stock,

    quantity:
      Math.max(
        1,
        finalQuantity
      ),
  };

  saveCart(
    nextCart
  );

  return nextCart;
}

/* ============================================================
   UPDATE QUANTITY
============================================================ */

export function updateCartQuantity(
  medicineId: string,
  quantity: number
): CartItem[] {
  const cart =
    getCart();

  const index =
    cart.findIndex(
      (item) =>
        item.medicineId ===
        medicineId
    );

  if (
    index === -1
  ) {
    return cart;
  }

  const item =
    cart[index];

  const requestedQuantity =
    Math.max(
      1,
      Math.floor(
        toSafeNumber(
          quantity,
          1
        )
      )
    );

  const safeQuantity =
    item.stock > 0
      ? Math.min(
          requestedQuantity,
          item.stock
        )
      : requestedQuantity;

  const nextCart =
    [...cart];

  nextCart[index] = {
    ...item,

    quantity:
      Math.max(
        1,
        safeQuantity
      ),
  };

  saveCart(
    nextCart
  );

  return nextCart;
}

/* ============================================================
   REMOVE ITEM
============================================================ */

export function removeFromCart(
  medicineId: string
): CartItem[] {
  const cart =
    getCart();

  const nextCart =
    cart.filter(
      (item) =>
        item.medicineId !==
        medicineId
    );

  saveCart(
    nextCart
  );

  return nextCart;
}

/* ============================================================
   CART TOTAL ITEMS
============================================================ */

export function getCartItemCount(
  cart?: CartItem[]
) {
  const source =
    cart ?? getCart();

  return source.reduce(
    (
      total,
      item
    ) =>
      total +
      Math.max(
        0,
        Number(
          item.quantity || 0
        )
      ),
    0
  );
}

/* ============================================================
   CART TOTAL PRICE
============================================================ */

export function getCartTotal(
  cart?: CartItem[]
) {
  const source =
    cart ?? getCart();

  return source.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(
        item.price || 0
      ) *
        Math.max(
          0,
          Number(
            item.quantity || 0
          )
        ),
    0
  );
}

/* ============================================================
   FIND ITEM
============================================================ */

export function findCartItem(
  medicineId: string,
  cart?: CartItem[]
) {
  const source =
    cart ?? getCart();

  return (
    source.find(
      (item) =>
        item.medicineId ===
        medicineId
    ) || null
  );
}