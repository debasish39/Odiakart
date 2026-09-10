import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaSearch,
  FaSlidersH,
  FaChevronRight,
  FaShoppingBag,
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaUndo,
  FaClock,
  FaSyncAlt,
  FaTimes,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AccountShell } from "./AccountShell";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL;

/*
|--------------------------------------------------------------------------
| ORDER STATUS
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS = [
  "All",
  "Pending Payment",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Return Approved",
  "Return Rejected",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const safe = (value, fallback = "") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/*
 * Product identity is always productId.
 * title/slug are display-only.
 */
const getProductId = (item) => {
  const value = item?.productId;

  if (value && typeof value === "object") {
    return value?._id || value?.id || "";
  }

  return value || "";
};

const getPopulatedProduct = (item) => {
  if (item?.productId && typeof item.productId === "object") {
    return item.productId;
  }

  return null;
};

const getProductTitle = (item) => {
  const product = getPopulatedProduct(item);

  return (
    item?.title ||
    product?.title ||
    product?.name ||
    "Product"
  );
};

const getProductImage = (item) => {
  const product = getPopulatedProduct(item);

  return (
    item?.image ||
    item?.thumbnail ||
    product?.thumbnail ||
    product?.images?.[0] ||
    product?.media?.thumbnail ||
    product?.media?.images?.[0] ||
    ""
  );
};

const getOrderItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const getOrderTotal = (order) =>
  Number(
    order?.pricing?.total ??
      order?.totalAmount ??
      order?.total ??
      0
  );

const getOrderStatus = (order) =>
  safe(order?.status, "Processing");

const getStatusType = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("cancel")) return "cancelled";
  if (value.includes("return")) return "return";
  if (value.includes("deliver")) return "delivered";
  if (
    value.includes("ship") ||
    value.includes("transit") ||
    value.includes("pickup")
  ) {
    return "shipping";
  }

  if (
    value.includes("confirm") ||
    value.includes("packed")
  ) {
    return "confirmed";
  }

  return "processing";
};

const getStatusIcon = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("cancel")) return <FaTimesCircle />;
  if (value.includes("return")) return <FaUndo />;
  if (value.includes("deliver")) return <FaCheckCircle />;

  if (
    value.includes("ship") ||
    value.includes("transit") ||
    value.includes("pickup")
  ) {
    return <FaTruck />;
  }

  return <FaClock />;
};

const getStatusDate = (order) => {
  const status = getOrderStatus(order).toLowerCase();

  if (status.includes("cancel")) {
    return (
      order?.cancellation?.cancelledAt ||
      order?.updatedAt ||
      order?.createdAt
    );
  }

  if (status.includes("deliver")) {
    const history = Array.isArray(order?.statusHistory)
      ? order.statusHistory
      : [];

    const delivered = [...history]
      .reverse()
      .find((entry) =>
        String(entry?.status || "")
          .toLowerCase()
          .includes("deliver")
      );

    return (
      delivered?.date ||
      order?.updatedAt ||
      order?.createdAt
    );
  }

  return order?.updatedAt || order?.createdAt;
};

const getStatusText = (order) => {
  const status = getOrderStatus(order);
  const lower = status.toLowerCase();
  const date = formatDate(getStatusDate(order));

  if (lower.includes("cancel")) {
    return date !== "-"
      ? `Cancelled on ${date}`
      : "Cancelled";
  }

  if (lower.includes("deliver")) {
    return date !== "-"
      ? `Delivered on ${date}`
      : "Delivered";
  }

  if (lower.includes("return")) {
    return date !== "-"
      ? `${status} on ${date}`
      : status;
  }

  return date !== "-"
    ? `${status} • ${date}`
    : status;
};

const getSearchText = (order) => {
  const items = getOrderItems(order);

  return [
    order?.orderNumber,
    order?._id,
    order?.status,
    order?.fullname,
    order?.email,
    ...items.flatMap((item) => {
      const product = getPopulatedProduct(item);

      return [
        item?.title,
        item?.variantSku,
        product?.title,
        product?.brand,
        product?.category,
        getProductId(item),
      ];
    }),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const type = getStatusType(status);

  return (
    <span className={`orders-status-badge ${type}`}>
      <span className="orders-status-icon">
        {getStatusIcon(status)}
      </span>

      <span>{safe(status, "Processing")}</span>
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| PROMO AREA
|--------------------------------------------------------------------------
|
| This is intentionally original/brand-neutral.
| It follows the visual role of the reference image without copying it.
|
*/

function PromoBanner() {
  return (
    <section className="orders-promo">
      <div className="orders-promo-content">
        <span className="orders-promo-kicker">
          MEMBER PERKS
        </span>

        <h2>
          A little extra
          <br />
          with every order.
        </h2>

        <p>
          Discover new benefits, offers and easier shopping.
        </p>

        <button
          type="button"
          onClick={() => {
            toast.info("Benefits section coming soon.");
          }}
        >
          Explore benefits
          <span>→</span>
        </button>
      </div>

      <div
        className="orders-promo-art"
        aria-hidden="true"
      >
        <div className="promo-orbit orbit-one" />
        <div className="promo-orbit orbit-two" />

        <div className="promo-card-shape">
          <div className="promo-card-top" />
          <div className="promo-card-line line-a" />
          <div className="promo-card-line line-b" />
          <div className="promo-card-dot" />
        </div>

        <div className="promo-bubble bubble-one">+</div>
        <div className="promo-bubble bubble-two">★</div>
        <div className="promo-bubble bubble-three">₹</div>
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| FILTER SHEET
|--------------------------------------------------------------------------
*/

function FilterSheet({
  open,
  value,
  orders,
  onChange,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const getCount = (status) => {
    if (status === "All") {
      return orders.length;
    }

    return orders.filter(
      (order) =>
        String(order?.status || "")
          .toLowerCase() ===
        status.toLowerCase()
    ).length;
  };

  return createPortal(
    <>
      <div
        className="orders-filter-overlay"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <aside
        className="orders-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-filter-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="orders-filter-sheet-head">
          <div>
            <span>FILTER ORDERS</span>

            <h3 id="orders-filter-title">
              Order status
            </h3>

            <p>
              Choose a status to narrow down
              your order history.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
          >
            <FaTimes />
          </button>
        </div>

        <div className="orders-filter-sheet-list">
          {STATUS_OPTIONS.map((status) => {
            const selected =
              value === status;

            return (
              <button
                type="button"
                key={status}
                className={
                  selected
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  onChange(status);
                  onClose();
                }}
              >
                <span className="orders-filter-option-left">
                  <span
                    className={`orders-filter-radio ${
                      selected
                        ? "checked"
                        : ""
                    }`}
                  >
                    {selected && "✓"}
                  </span>

                  <span>{status}</span>
                </span>

                <b>{getCount(status)}</b>
              </button>
            );
          })}
        </div>

        <div className="orders-filter-sheet-footer">
          <button
            type="button"
            onClick={() => {
              onChange("All");
              onClose();
            }}
            disabled={value === "All"}
          >
            Clear filter
          </button>

          <button
            type="button"
            className="orders-filter-done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT MINI CARD
|--------------------------------------------------------------------------
|
| Clicking the product uses item.productId:
| GET /api/products/:productId
| then /product/:productId
|
*/

function ProductPreview({
  item,
  compact = false,
}) {
  const navigate = useNavigate();

  const [opening, setOpening] = useState(false);
  const queryClient = useQueryClient();

  const productId = getProductId(item);
  const title = getProductTitle(item);
  const image = getProductImage(item);
  const quantity = Number(item?.quantity || 1);

  const openProduct = async () => {
    if (!productId) {
      toast.error("Product ID is not available.");
      return;
    }

    const id = String(productId);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    try {
      setOpening(true);

      const product = await queryClient.fetchQuery({
        queryKey: ["product", id],
        queryFn: async () => {
          const response = await fetch(
            `${API_URL}/api/products/${encodeURIComponent(id)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let data = {};

          try {
            data = await response.json();
          } catch {
            throw new Error("Invalid product response.");
          }

          if (!response.ok) {
            throw new Error(
              data?.message || "Failed to load product."
            );
          }

          return (
            data?.product ||
            data?.data?.product ||
            data?.data ||
            data
          );
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      });

      if (!product) {
        throw new Error("Product not found.");
      }

      navigate(`/products/${encodeURIComponent(id)}`, {
        state: {
          product,
          productId: id,
        },
      });
    } catch (error) {
      console.error("Product loading error:", error);
      toast.error(
        error?.message || "Unable to open product."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      className={`orders-product-preview ${
        compact ? "compact" : ""
      } ${opening ? "loading" : ""}`}
      onClick={openProduct}
      disabled={opening || !productId}
      title={
        productId
          ? "Open product"
          : "Product ID unavailable"
      }
    >
      <div className="orders-product-image">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <FaBoxOpen />
        )}
      </div>

      <div className="orders-product-info">
        <strong>{title}</strong>

        <div className="orders-product-details">
          <span>Qty {quantity}</span>

          {item?.variantSku && (
            <span>{item.variantSku}</span>
          )}

          {productId && (
            <span>
              ID {String(productId).slice(-8)}
            </span>
          )}
        </div>
      </div>

      <FaChevronRight className="orders-product-arrow" />
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| ORDER ROW
|--------------------------------------------------------------------------
|
| The list is intentionally flat and immediately visible.
| There is no expand/collapse state.
|
*/

function OrderListItem({
  order,
  onOpenOrder,
}) {
  const navigate = useNavigate();
  const items = getOrderItems(order);
  const firstItem = items[0];

  const [openingProduct, setOpeningProduct] =
    useState(false);
  const queryClient = useQueryClient();

  const status = getOrderStatus(order);
  const statusType = getStatusType(status);

  const totalQuantity = items.reduce(
    (sum, item) =>
      sum + Number(item?.quantity || 1),
    0
  );

  const firstImage =
    getProductImage(firstItem);

  const firstTitle =
    getProductTitle(firstItem);

  const firstProductId =
    getProductId(firstItem);

  const additionalCount = Math.max(
    items.length - 1,
    0
  );

  const title =
    additionalCount > 0
      ? `${firstTitle} + ${additionalCount} more`
      : firstTitle;

  const total = getOrderTotal(order);
  const created = formatDate(order?.createdAt);
  const statusDate = getStatusDate(order);

  const openProduct = async () => {
    if (!firstProductId) {
      onOpenOrder(order?._id);
      return;
    }

    const id = String(firstProductId);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    try {
      setOpeningProduct(true);

      const product = await queryClient.fetchQuery({
        queryKey: ["product", id],
        queryFn: async () => {
          const response = await fetch(
            `${API_URL}/api/products/${encodeURIComponent(id)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let data = {};

          try {
            data = await response.json();
          } catch {
            throw new Error("Invalid product response.");
          }

          if (!response.ok) {
            throw new Error(
              data?.message || "Failed to load product."
            );
          }

          return (
            data?.product ||
            data?.data?.product ||
            data?.data ||
            data
          );
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      });

      if (!product) {
        throw new Error("Product not found.");
      }

      navigate(`/products/${encodeURIComponent(id)}`, {
        state: {
          product,
          productId: id,
        },
      });
    } catch (error) {
      console.error("Product loading error:", error);
      toast.error(
        error?.message || "Unable to open product."
      );
    } finally {
      setOpeningProduct(false);
    }
  }

  return (
    <article className="orders-list-item">
      <div className="orders-list-item-main">
        <button
          type="button"
          className={`orders-image-button ${
            openingProduct ? "loading" : ""
          }`}
          onClick={openProduct}
          disabled={
            openingProduct ||
            !firstProductId
          }
          aria-label={`Open ${firstTitle}`}
        >
          <div className="orders-list-image">
            {firstImage ? (
              <img
                src={firstImage}
                alt={firstTitle}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <FaBoxOpen />
            )}

            {openingProduct && (
              <span className="orders-image-loading">
                <FaSyncAlt />
              </span>
            )}
          </div>
        </button>

        <div className="orders-list-copy">
          <div className="orders-list-status-line">
            <span
              className={`orders-status-dot ${statusType}`}
            />

            <strong>
              {getStatusText(order)}
            </strong>
          </div>

          <h3>{title}</h3>

          <div className="orders-list-meta">
            <span>
              {totalQuantity}{" "}
              {totalQuantity === 1
                ? "item"
                : "items"}
            </span>

            <i>•</i>

            <span>{formatMoney(total)}</span>

            {order?.orderNumber && (
              <>
                <i>•</i>
                <span>
                  #{order.orderNumber}
                </span>
              </>
            )}
          </div>

          <div className="orders-list-submeta">
            <span>
              <FaCalendarAlt />
              Ordered {created}
            </span>

            {order?.shipping?.trackingNumber && (
              <span>
                <FaTruck />
                {order.shipping.trackingNumber}
              </span>
            )}
          </div>
        </div>

        <div className="orders-list-actions">
          <button
            type="button"
            className="orders-view-button"
            onClick={() =>
              onOpenOrder(order?._id)
            }
          >
            <span>View order</span>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {items.length > 1 && (
        <div className="orders-extra-products">
          {items.slice(0, 4).map(
            (item, index) => (
              <ProductPreview
                key={
                  item?._id ||
                  `${order?._id}-${index}`
                }
                item={item}
                compact
              />
            )
          )}
        </div>
      )}

      <div className="orders-row-footer">
        <span>
          Updated{" "}
          {formatDateTime(
            statusDate ||
              order?.updatedAt
          )}
        </span>

        {order?.deliveryAddress?.address
          ?.city && (
          <span>
            {order.deliveryAddress.address.city}
          </span>
        )}
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| SKELETON
|--------------------------------------------------------------------------
*/

function OrderSkeleton() {
  return (
    <div className="orders-skeleton">
      <div className="skeleton-photo" />

      <div className="skeleton-content">
        <span className="skeleton-line status" />
        <span className="skeleton-line title" />
        <span className="skeleton-line meta" />
        <span className="skeleton-line small" />
      </div>

      <div className="skeleton-action" />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function EmptyOrders({
  hasFilters,
  onClear,
}) {
  return (
    <div className="orders-empty">
      <div className="orders-empty-icon">
        <FaShoppingBag />
      </div>

      <h2>
        {hasFilters
          ? "No matching orders"
          : "No orders yet"}
      </h2>

      <p>
        {hasFilters
          ? "Try a different search or remove the active filter."
          : "Your purchases will appear here after you place an order."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function OrdersPage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState("All");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const filterTabsRef = useRef(null);

  const fetchOrders = async () => {
    if (!token) {
      throw new Error("AUTH_REQUIRED");
    }

    let response = await fetch(
      `${API_URL}/api/orders/my-orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      response = await fetch(
        `${API_URL}/api/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    let data = {};

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid server response.");
    }

    if (!response.ok) {
      throw new Error(
        data?.message || "Failed to load orders."
      );
    }

    return Array.isArray(data?.orders)
      ? data.orders
      : Array.isArray(data?.data?.orders)
      ? data.data.orders
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];
  };

  const {
    data: orders = [],
    isLoading: loading,
    isFetching,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orders", token],
    queryFn: fetchOrders,
    enabled: !!token,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!token) {
      toast.error("Please login to view your orders.");
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (ordersError && ordersError.message !== "AUTH_REQUIRED") {
      console.error("Orders loading error:", ordersError);
      toast.error(
        ordersError?.message ||
          "Unable to load order history."
      );
    }
  }, [ordersError]);

  const loadOrders = async (isRefresh = false) => {
    if (!token) {
      toast.error("Please login to view your orders.");
      navigate("/login");
      return;
    }

    try {
      if (isRefresh) {
        await refetchOrders();
      } else {
        await queryClient.fetchQuery({
          queryKey: ["orders", token],
          queryFn: fetchOrders,
        });
      }
    } catch (error) {
      console.error("Orders loading error:", error);
      toast.error(
        error?.message ||
          "Unable to load order history."
      );
    }
  };

  const refreshing = isFetching && !loading;

  const counts = useMemo(() => {
    const result = {};

    STATUS_OPTIONS.forEach(
      (status) => {
        if (status === "All") {
          result[status] = orders.length;
          return;
        }

        result[status] = orders.filter(
          (order) =>
            String(
              order?.status || ""
            ).toLowerCase() ===
            status.toLowerCase()
        ).length;
      }
    );

    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const statusMatches =
        filter === "All" ||
        String(
          order?.status || ""
        ).toLowerCase() ===
          filter.toLowerCase();

      if (!statusMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      return getSearchText(order).includes(
        query
      );
    });
  }, [orders, search, filter]);

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
  };

  const openOrder = (id) => {
    if (!id) {
      toast.error(
        "Order ID is not available."
      );
      return;
    }

    navigate(
      `/account/orders/${id}`
    );
  };

  return (
    <AccountShell title="My Orders">
      <div className="modern-orders-page">
        <style>{styles}</style>

        {/* -------------------------------------------------------------- */}
        {/* HEADER                                                         */}
        {/* -------------------------------------------------------------- */}

        <header className="orders-header">
          <button
            type="button"
            className="orders-back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>

          <div className="orders-header-title">
            <span>ACCOUNT</span>
            <h1>My Orders</h1>
          </div>

          <button
            type="button"
            className={`orders-refresh-button ${
              refreshing ? "spinning" : ""
            }`}
            onClick={() =>
              loadOrders(true)
            }
            disabled={refreshing}
            aria-label="Refresh orders"
          >
            <FaSyncAlt />
          </button>
        </header>

        {/* -------------------------------------------------------------- */}
        {/* PROMO                                                          */}
        {/* -------------------------------------------------------------- */}

        <PromoBanner />

        {/* -------------------------------------------------------------- */}
        {/* SEARCH                                                         */}
        {/* -------------------------------------------------------------- */}

        <section className="orders-controls">
          <div className="orders-search-box">
            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search your orders"
              aria-label="Search your orders"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            type="button"
            className="orders-filter-trigger"
            onClick={() =>
              setFilterOpen(true)
            }
          >
            <FaSlidersH />
            <span>Filters</span>

            {filter !== "All" && (
              <b>1</b>
            )}
          </button>
        </section>

        <FilterSheet
          open={filterOpen}
          value={filter}
          orders={orders}
          onChange={setFilter}
          onClose={() =>
            setFilterOpen(false)
          }
        />

        {/* -------------------------------------------------------------- */}
        {/* FILTER CHIPS                                                   */}
        {/* -------------------------------------------------------------- */}

        <section
          ref={filterTabsRef}
          className="orders-filter-chips"
          aria-label="Order status tabs"
        >
          {STATUS_OPTIONS.map((status) => (
            <button
              type="button"
              key={status}
              className={
                filter === status
                  ? "active"
                  : ""
              }
              onClick={(event) => {
                setFilter(status);

                event.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }}
            >
              <span>{status}</span>

              <b>
                {counts[status] || 0}
              </b>
            </button>
          ))}
        </section>

        {filter !== "All" && (
          <div className="orders-active-filter">
            <span>
              Showing: <strong>{filter}</strong>
            </span>

            <button
              type="button"
              onClick={() =>
                setFilter("All")
              }
            >
              Clear
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* LIST                                                           */}
        {/* -------------------------------------------------------------- */}

        {loading ? (
          <div className="orders-list">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="orders-list">
            {filteredOrders.map(
              (order) => (
                <OrderListItem
                  key={order?._id}
                  order={order}
                  onOpenOrder={openOrder}
                />
              )
            )}
          </div>
        ) : (
          <EmptyOrders
            hasFilters={
              Boolean(search) ||
              filter !== "All"
            }
            onClear={clearFilters}
          />
        )}

        {/* -------------------------------------------------------------- */}
        {/* BOTTOM INFO                                                    */}
        {/* -------------------------------------------------------------- */}

        {!loading &&
          orders.length > 0 && (
            <div className="orders-bottom-note">
              <span>
                Showing{" "}
                <strong>
                  {filteredOrders.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {orders.length}
                </strong>{" "}
                orders
              </span>
            </div>
          )}
      </div>
    </AccountShell>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = `
.modern-orders-page {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 6px 0 55px;
  color: #312e81;
}

.modern-orders-page *,
.modern-orders-page *::before,
.modern-orders-page *::after {
  box-sizing: border-box;
}

/* ----------------------------------------------------------------------- */
/* HEADER                                                                  */
/* ----------------------------------------------------------------------- */

.orders-header {
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 18px;
}

.orders-back-button,
.orders-refresh-button {
  border: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.orders-back-button {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 50%;
  background: transparent;
  color: #312e81;
  font-size: 18px;
}

.orders-back-button:hover {
  background: #eef2ff;
}

.orders-header-title {
  flex: 1;
  min-width: 0;
}

.orders-header-title > span {
  display: block;
  margin-bottom: 2px;
  color: #8b87b5;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.orders-header-title h1 {
  margin: 0;
  font-size: 25px;
  line-height: 1.15;
  font-weight: 750;
  letter-spacing: -.4px;
}

.orders-refresh-button {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  background: #fff;
  color: #6366f1;
  font-size: 15px;
}

.orders-refresh-button:hover {
  background: #f5f3ff;
}

.orders-refresh-button.spinning svg {
  animation: orders-spin .75s linear infinite;
}

.orders-refresh-button:disabled {
  opacity: .55;
  cursor: default;
}

@keyframes orders-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ----------------------------------------------------------------------- */
/* PROMO                                                                  */
/* ----------------------------------------------------------------------- */

.orders-promo {
  position: relative;
  min-height: 175px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 25px 29px;
  border-radius: 23px;
  color: white;
  background:
    radial-gradient(
      circle at 80% 25%,
      rgba(255,255,255,.18),
      transparent 24%
    ),
    radial-gradient(
      circle at 55% 120%,
      rgba(255,255,255,.10),
      transparent 40%
    ),
    linear-gradient(
      115deg,
      #4f46e5 0%,
      #6366f1 52%,
      #7c3aed 100%
    );
}

.orders-promo-content {
  position: relative;
  z-index: 2;
  max-width: 520px;
}

.orders-promo-kicker {
  display: block;
  margin-bottom: 7px;
  color: rgba(255,255,255,.67);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1.6px;
}

.orders-promo h2 {
  margin: 0;
  font-size: 25px;
  line-height: 1.12;
  letter-spacing: -.45px;
}

.orders-promo p {
  max-width: 380px;
  margin: 8px 0 15px;
  color: rgba(255,255,255,.72);
  font-size: 12px;
  line-height: 1.45;
}

.orders-promo button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 999px;
  padding: 8px 9px 8px 14px;
  background: white;
  color: #312e81;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.orders-promo button span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #312e81;
  color: white;
  font-size: 14px;
}

.orders-promo-art {
  position: relative;
  width: 270px;
  height: 150px;
  flex: 0 0 270px;
}

.promo-orbit {
  position: absolute;
  border: 1px dashed rgba(255,255,255,.2);
  border-radius: 50%;
}

.orbit-one {
  width: 205px;
  height: 205px;
  top: -28px;
  right: 5px;
}

.orbit-two {
  width: 138px;
  height: 138px;
  top: 5px;
  right: 39px;
}

.promo-card-shape {
  position: absolute;
  width: 125px;
  height: 77px;
  top: 43px;
  right: 54px;
  overflow: hidden;
  border-radius: 13px;
  transform: rotate(-7deg);
  background: linear-gradient(
    135deg,
    #e8e8e8,
    #a5b4fc
  );
  box-shadow: 0 18px 30px rgba(0,0,0,.25);
}

.promo-card-top {
  height: 18px;
  background: rgba(255,255,255,.18);
}

.promo-card-line {
  position: absolute;
  height: 5px;
  border-radius: 99px;
  background: rgba(255,255,255,.48);
}

.line-a {
  left: 13px;
  bottom: 19px;
  width: 48px;
}

.line-b {
  left: 13px;
  bottom: 10px;
  width: 31px;
}

.promo-card-dot {
  position: absolute;
  right: 13px;
  bottom: 12px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: rgba(255,255,255,.55);
}

.promo-bubble {
  position: absolute;
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ffffff;
  color: #312e81;
  box-shadow: 0 7px 17px rgba(0,0,0,.2);
  font-size: 12px;
  font-weight: 900;
}

.bubble-one {
  top: 5px;
  right: 170px;
}

.bubble-two {
  left: 30px;
  bottom: 9px;
}

.bubble-three {
  right: 2px;
  bottom: 0;
}

/* ----------------------------------------------------------------------- */
/* CONTROLS                                                                */
/* ----------------------------------------------------------------------- */

.orders-controls {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
}

.orders-search-box {
  height: 53px;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border: 1px solid #ddd6fe;
  border-radius: 16px;
  background: white;
  transition: border-color .18s ease, box-shadow .18s ease;
}

.orders-search-box:focus-within {
  border-color: #a5b4fc;
  box-shadow: 0 5px 18px rgba(0,0,0,.045);
}

.orders-search-box > svg {
  flex: 0 0 auto;
  color: #6366f1;
  font-size: 18px;
}

.orders-search-box input {
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #4f46e5;
  font-size: 14px;
}

.orders-search-box input::placeholder {
  color: #8b87b5;
}

.orders-search-box > button {
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #ede9fe;
  color: #6366f1;
  cursor: pointer;
}

.orders-filter-trigger {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #3730a3;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.orders-filter-trigger > svg {
  font-size: 17px;
}

.orders-filter-trigger b {
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  font-size: 9px;
}

/* ----------------------------------------------------------------------- */
/* CHIPS                                                                   */
/* ----------------------------------------------------------------------- */

.orders-filter-chips {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  margin-bottom: 7px;
  padding: 2px 2px 11px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  touch-action: pan-x;
}

.orders-filter-chips::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.orders-filter-chips button {
  height: 43px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 0 0 auto;
  white-space: nowrap;
  padding: 0 15px;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  background: white;
  color: #3730a3;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color .18s ease,
    background .18s ease,
    color .18s ease,
    transform .18s ease;
}

.orders-filter-chips button:hover {
  border-color: #a5b4fc;
  transform: translateY(-1px);
}

.orders-filter-chips button.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.orders-filter-chips b {
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border-radius: 999px;
  background: #eef2ff;
  color: #7c73c8;
  font-size: 9px;
}

.orders-filter-chips button.active b {
  background: rgba(255,255,255,.16);
  color: white;
}

/* ----------------------------------------------------------------------- */
/* FILTER SHEET                                                            */
/* ----------------------------------------------------------------------- */

.orders-filter-overlay {
  position: fixed;
  z-index: 2147483646;
  inset: 0;
  background: rgba(0,0,0,.42);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: orders-filter-fade-in .18s ease both;
}

.orders-filter-sheet {
  position: fixed;
  z-index: 2147483647;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(410px, 92vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px 22px 18px;
  background: #fff;
  color: #312e81;
  box-shadow: -22px 0 60px rgba(0,0,0,.2);
  animation: orders-filter-slide-in .22s cubic-bezier(.22,.8,.25,1) both;
}

.orders-filter-sheet-head {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ede9fe;
}

.orders-filter-sheet-head > div {
  min-width: 0;
}

.orders-filter-sheet-head > div > span {
  color: #8b87b5;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1.2px;
}

.orders-filter-sheet-head h3 {
  margin: 4px 0 0;
  font-size: 21px;
  line-height: 1.2;
  letter-spacing: -.3px;
}

.orders-filter-sheet-head p {
  max-width: 285px;
  margin: 7px 0 0;
  color: #999;
  font-size: 10px;
  line-height: 1.45;
}

.orders-filter-sheet-head > button {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #eef2ff;
  color: #444;
  cursor: pointer;
}

.orders-filter-sheet-list {
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  padding: 13px 2px 13px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.orders-filter-sheet-list::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.orders-filter-sheet-list button {
  min-height: 51px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #3730a3;
  text-align: left;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease;
}

.orders-filter-sheet-list button:hover {
  background: #f5f3ff;
}

.orders-filter-sheet-list button.selected {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.orders-filter-option-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.orders-filter-option-left > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 650;
}

.orders-filter-radio {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  display: grid;
  place-items: center;
  border: 1px solid #c4b5fd;
  border-radius: 50%;
  background: white;
  color: #4f46e5;
  font-size: 10px;
  font-weight: 900;
}

.orders-filter-radio.checked {
  border-color: white;
  background: white;
  color: #4f46e5;
}

.orders-filter-sheet-list button b {
  min-width: 27px;
  height: 24px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #eef2ff;
  color: #7c73c8;
  font-size: 10px;
}

.orders-filter-sheet-list button.selected b {
  background: rgba(255,255,255,.14);
  color: white;
}

.orders-filter-sheet-footer {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  padding-top: 13px;
  border-top: 1px solid #ede9fe;
}

.orders-filter-sheet-footer > button {
  height: 43px;
  border: 1px solid #ddd6fe;
  border-radius: 11px;
  background: white;
  color: #3730a3;
  cursor: pointer;
  font-size: 11px;
  font-weight: 750;
}

.orders-filter-sheet-footer > button:disabled {
  opacity: .4;
  cursor: default;
}

.orders-filter-sheet-footer .orders-filter-done {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

@keyframes orders-filter-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes orders-filter-slide-in {
  from {
    opacity: .8;
    transform: translateX(28px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ----------------------------------------------------------------------- */
/* LIST                                                                    */
/* ----------------------------------------------------------------------- */

.orders-list {
  border-top: 1px solid #e0e7ff;
}

.orders-list-item {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #e0e7ff;
  background: white;
}

.orders-list-item-main {
  min-height: 154px;
  display: flex;
  align-items: center;
  gap: 19px;
  padding: 17px 5px;
}

.orders-image-button {
  width: 126px;
  height: 126px;
  flex: 0 0 126px;
  padding: 0;
  border: 0;
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
}

.orders-image-button:disabled {
  cursor: default;
}

.orders-list-image {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 16px;
  background: #f5f3ff;
}

.orders-list-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.orders-list-image svg {
  color: #a5b4fc;
  font-size: 37px;
}

.orders-image-button {
  position: relative;
}

.orders-image-button.loading {
  opacity: .72;
}

.orders-image-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255,255,255,.62);
  color: #6366f1;
  backdrop-filter: blur(2px);
}

.orders-image-loading svg {
  font-size: 17px;
  animation: orders-spin .7s linear infinite;
}

.orders-list-copy {
  min-width: 0;
  flex: 1;
}

.orders-list-status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

.orders-list-status-line strong {
  overflow: hidden;
  color: #222;
  font-size: 16px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-status-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border-radius: 50%;
  background: #999;
}

.orders-status-dot.delivered {
  background: #22a06b;
}

.orders-status-dot.shipping {
  background: #3984d6;
}

.orders-status-dot.cancelled {
  background: #d64a4a;
}

.orders-status-dot.return {
  background: #8955a9;
}

.orders-status-dot.confirmed {
  background: #2c9a67;
}

.orders-status-dot.processing {
  background: #d48a35;
}

.orders-list-copy h3 {
  max-width: 680px;
  overflow: hidden;
  margin: 0;
  color: #737373;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-list-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
  color: #979797;
  font-size: 11px;
}

.orders-list-meta i {
  font-style: normal;
  color: #c1c1c1;
}

.orders-list-submeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 11px;
  color: #a0a0a0;
  font-size: 10px;
}

.orders-list-submeta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.orders-list-submeta svg {
  font-size: 9px;
}

.orders-list-actions {
  flex: 0 0 auto;
  padding-right: 7px;
}

.orders-view-button {
  min-width: 97px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #ddd6fe;
  border-radius: 10px;
  background: white;
  color: #272727;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  transition: .18s ease;
}

.orders-view-button:hover {
  border-color: #1c1c1c;
  background: #fafafa;
}

.orders-view-button svg {
  font-size: 9px;
}

.orders-row-footer {
  min-height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 5px 11px 150px;
  color: #a5b4fc;
  font-size: 9px;
}

.orders-row-footer span:last-child {
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ----------------------------------------------------------------------- */
/* OPTIONAL MULTI-PRODUCT STRIP                                           */
/* ----------------------------------------------------------------------- */

.orders-extra-products {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(210px, 1fr)
  );
  gap: 7px;
  padding: 0 5px 11px 150px;
}

.orders-product-preview {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px;
  border: 1px solid #ede9fe;
  border-radius: 11px;
  background: #fafafa;
  color: #222;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.orders-product-preview:hover:not(:disabled) {
  border-color: #d0d0d0;
  background: #f6f6f6;
}

.orders-product-preview:disabled {
  cursor: default;
}

.orders-product-preview.loading {
  opacity: .65;
}

.orders-product-preview .orders-product-image {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
}

.orders-product-preview .orders-product-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.orders-product-preview .orders-product-image svg {
  color: #a5b4fc;
  font-size: 18px;
}

.orders-product-info {
  min-width: 0;
  flex: 1;
}

.orders-product-info strong {
  display: block;
  overflow: hidden;
  color: #444;
  font-size: 9px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-product-details {
  display: flex;
  gap: 5px;
  margin-top: 4px;
  overflow: hidden;
}

.orders-product-details span {
  overflow: hidden;
  padding: 2px 5px;
  border-radius: 5px;
  background: #eee;
  color: #999;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-product-arrow {
  flex: 0 0 auto;
  color: #a5b4fc;
  font-size: 8px;
}

/* ----------------------------------------------------------------------- */
/* STATUS BADGE                                                           */
/* ----------------------------------------------------------------------- */

.orders-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

.orders-status-badge.success,
.orders-status-badge.delivered {
  background: #eaf8f0;
  color: #18784d;
}

.orders-status-badge.shipping {
  background: #edf5ff;
  color: #2566a9;
}

.orders-status-badge.cancelled {
  background: #fff0f0;
  color: #bf3434;
}

.orders-status-badge.return {
  background: #f5effa;
  color: #744494;
}

.orders-status-badge.confirmed {
  background: #eaf8f0;
  color: #18784d;
}

.orders-status-badge.processing {
  background: #fff5e8;
  color: #a15e13;
}

/* ----------------------------------------------------------------------- */
/* EMPTY                                                                   */
/* ----------------------------------------------------------------------- */

.orders-empty {
  min-height: 310px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 45px 20px;
  border-bottom: 1px solid #e4e4e4;
  text-align: center;
}

.orders-empty-icon {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 19px;
  background: #eef2ff;
  color: #7c73c8;
  font-size: 24px;
}

.orders-empty h2 {
  margin: 0;
  color: #242424;
  font-size: 19px;
}

.orders-empty p {
  max-width: 390px;
  margin: 7px 0 0;
  color: #929292;
  font-size: 12px;
  line-height: 1.55;
}

.orders-empty button {
  margin-top: 15px;
  border: 0;
  border-radius: 9px;
  padding: 9px 14px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

/* ----------------------------------------------------------------------- */
/* SKELETON                                                                */
/* ----------------------------------------------------------------------- */

.orders-skeleton {
  min-height: 154px;
  display: flex;
  align-items: center;
  gap: 19px;
  padding: 17px 5px;
  border-bottom: 1px solid #e0e7ff;
}

.skeleton-photo {
  width: 126px;
  height: 126px;
  flex: 0 0 126px;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    #eef2ff,
    #e7e7e7,
    #eef2ff
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.25s infinite;
}

.skeleton-content {
  flex: 1;
  min-width: 0;
}

.skeleton-line {
  display: block;
  height: 10px;
  margin-bottom: 11px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    #eef2ff,
    #e7e7e7,
    #eef2ff
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.25s infinite;
}

.skeleton-line.status {
  width: 32%;
}

.skeleton-line.title {
  width: 67%;
}

.skeleton-line.meta {
  width: 37%;
}

.skeleton-line.small {
  width: 24%;
  margin-bottom: 0;
}

.skeleton-action {
  width: 97px;
  height: 38px;
  flex: 0 0 97px;
  border-radius: 10px;
  background: #ede9fe;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* ----------------------------------------------------------------------- */
/* BOTTOM                                                                  */
/* ----------------------------------------------------------------------- */

.orders-bottom-note {
  display: flex;
  justify-content: center;
  padding-top: 17px;
  color: #a5b4fc;
  font-size: 10px;
}

.orders-bottom-note strong {
  color: #6366f1;
}

/* ----------------------------------------------------------------------- */
/* TABLET                                                                  */
/* ----------------------------------------------------------------------- */

@media (max-width: 850px) {
  .modern-orders-page {
    padding-left: 4px;
    padding-right: 4px;
  }

  .orders-promo-art {
    transform: scale(.9);
    transform-origin: right center;
  }

  .orders-list-item-main {
    gap: 15px;
  }

  .orders-list-copy h3 {
    max-width: 480px;
  }
}

/* ----------------------------------------------------------------------- */
/* MOBILE                                                                  */
/* ----------------------------------------------------------------------- */

@media (max-width: 650px) {
  .orders-filter-sheet {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: min(82vh, 680px);
    padding: 19px 16px 14px;
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -18px 55px rgba(0,0,0,.2);
    animation-name: orders-filter-slide-up;
  }

  .orders-filter-sheet::before {
    content: "";
    width: 38px;
    height: 4px;
    flex: 0 0 4px;
    align-self: center;
    margin-bottom: 14px;
    border-radius: 99px;
    background: #c4b5fd;
  }

  .orders-filter-sheet-head {
    padding-bottom: 14px;
  }

  .orders-filter-sheet-list {
    padding-top: 9px;
  }

  .orders-filter-sheet-footer {
    padding-top: 10px;
  }

  @keyframes orders-filter-slide-up {
    from {
      opacity: .8;
      transform: translateY(35px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modern-orders-page {
    padding: 2px 0 40px;
  }

  .orders-header {
    margin-bottom: 14px;
  }

  .orders-header-title > span {
    font-size: 8px;
  }

  .orders-header-title h1 {
    font-size: 23px;
  }

  .orders-back-button {
    width: 37px;
    height: 37px;
    flex-basis: 37px;
  }

  .orders-refresh-button {
    width: 37px;
    height: 37px;
    flex-basis: 37px;
  }

  .orders-promo {
    min-height: 162px;
    margin-bottom: 16px;
    padding: 21px 18px;
    border-radius: 20px;
  }

  .orders-promo-content {
    max-width: 235px;
  }

  .orders-promo-kicker {
    font-size: 8px;
  }

  .orders-promo h2 {
    font-size: 20px;
  }

  .orders-promo p {
    max-width: 195px;
    margin-bottom: 12px;
    font-size: 10px;
  }

  .orders-promo button {
    padding: 7px 8px 7px 11px;
    font-size: 9px;
  }

  .orders-promo button span {
    width: 21px;
    height: 21px;
    font-size: 12px;
  }

  .orders-promo-art {
    position: absolute;
    top: 17px;
    right: -10px;
    width: 170px;
    height: 130px;
    transform: scale(.8);
    transform-origin: right center;
  }

  .orders-controls {
    gap: 11px;
  }

  .orders-search-box {
    height: 52px;
    border-radius: 15px;
  }

  .orders-search-box input {
    font-size: 13px;
  }

  .orders-filter-trigger {
    gap: 7px;
    font-size: 13px;
  }

  .orders-filter-trigger > svg {
    font-size: 16px;
  }

  .orders-filter-chips {
    gap: 8px;
    padding: 2px 1px 9px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-padding-inline: 8px;
  }

  .orders-filter-chips::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .orders-filter-chips button {
    min-width: max-content;
    height: 42px;
    padding: 0 13px;
  }

  .orders-filter-chips button {
    height: 43px;
    padding: 0 13px;
    border-radius: 12px;
    font-size: 11px;
  }

  .orders-list-item-main {
    min-height: 121px;
    gap: 12px;
    padding: 15px 0;
  }

  .orders-image-button,
  .orders-list-image {
    width: 102px;
    height: 102px;
    flex-basis: 102px;
    border-radius: 14px;
  }

  .orders-list-copy {
    min-width: 0;
  }

  .orders-list-status-line {
    gap: 6px;
    margin-bottom: 6px;
  }

  .orders-list-status-line strong {
    font-size: 13px;
  }

  .orders-status-dot {
    width: 7px;
    height: 7px;
    flex-basis: 7px;
  }

  .orders-list-copy h3 {
    font-size: 11px;
  }

  .orders-list-meta {
    gap: 5px;
    margin-top: 6px;
    font-size: 9px;
  }

  .orders-list-submeta {
    gap: 8px;
    margin-top: 8px;
    font-size: 8px;
  }

  .orders-list-actions {
    padding-right: 0;
  }

  .orders-view-button {
    min-width: 29px;
    width: 29px;
    height: 34px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .orders-view-button span {
    display: none;
  }

  .orders-view-button svg {
    color: #312e81;
    font-size: 14px;
  }

  .orders-row-footer {
    min-height: 29px;
    padding: 0 0 9px 114px;
    font-size: 8px;
  }

  .orders-extra-products {
    grid-template-columns: 1fr;
    padding: 0 0 10px 114px;
  }

  .orders-product-preview {
    width: 100%;
  }

  .orders-product-preview .orders-product-image {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .orders-skeleton {
    min-height: 121px;
    gap: 12px;
    padding: 15px 0;
  }

  .skeleton-photo {
    width: 102px;
    height: 102px;
    flex-basis: 102px;
    border-radius: 14px;
  }

  .skeleton-line.status {
    width: 65%;
  }

  .skeleton-line.title {
    width: 95%;
  }

  .skeleton-line.meta {
    width: 55%;
  }

  .skeleton-line.small {
    width: 42%;
  }

  .skeleton-action {
    width: 28px;
    height: 34px;
    flex-basis: 28px;
    background: transparent;
  }
}

/* ----------------------------------------------------------------------- */
/* SMALL MOBILE                                                            */
/* ----------------------------------------------------------------------- */

@media (max-width: 410px) {
  .orders-promo {
    min-height: 154px;
  }

  .orders-promo h2 {
    font-size: 18px;
  }

  .orders-promo-content {
    max-width: 205px;
  }

  .orders-promo-art {
    right: -20px;
    transform: scale(.7);
  }

  .orders-image-button,
  .orders-list-image {
    width: 91px;
    height: 91px;
    flex-basis: 91px;
  }

  .orders-list-item-main {
    gap: 9px;
  }

  .orders-list-status-line strong {
    font-size: 12px;
  }

  .orders-list-copy h3 {
    font-size: 10px;
  }

  .orders-list-submeta {
    display: none;
  }

  .orders-row-footer {
    padding-left: 100px;
  }

  .orders-extra-products {
    padding-left: 100px;
  }

  .orders-filter-trigger span {
    display: none;
  }
}
`;

