import React, { useEffect, useMemo, useState } from "react";
import {
    FaBox,
    FaMapMarkerAlt,
    FaTruck,
    FaCreditCard,
    FaClock,
    FaTimesCircle,
    FaUndo,
    FaReceipt,
    FaChevronLeft,
    FaExternalLinkAlt,
    FaCheck,
    FaPhone,
    FaEnvelope,
    FaRedo,
    FaRupeeSign,
} from "react-icons/fa";
import { IoCallOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { AccountShell } from "./AccountShell";
import { HiOutlineMail } from "react-icons/hi";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const money = (value) => (
    <span className="od-money">
        <FaRupeeSign />
        {Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}
    </span>
);

const formatDate = (value) => {
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

const safe = (value, fallback = "-") => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
};

/*
|--------------------------------------------------------------------------
| PRODUCT HELPERS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Products are identified ONLY by productId.
| The product title/slug is never used to identify the product.
|
*/

const getProductId = (item) => {
    const value = item?.productId;

    if (value && typeof value === "object") {
        return value?._id || value?.id || "";
    }

    return value || "";
};

const getItemImage = (item) => {
    const product =
        item?.productId &&
            typeof item.productId === "object"
            ? item.productId
            : null;

    return (
        item?.image ||
        item?.thumbnail ||
        product?.thumbnail ||
        product?.images?.[0] ||
        product?.image ||
        ""
    );
};

const statusLabel = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("deliver")) return "Delivered";
    if (value.includes("ship") || value.includes("transit")) {
        return "Shipped";
    }
    if (value.includes("process")) return "Processing";
    if (value.includes("cancel")) return "Cancelled";
    if (value.includes("return")) return "Return";
    if (value.includes("confirm")) return "Confirmed";

    return safe(status, "Processing");
};

const statusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("cancel")) return "danger";
    if (value.includes("return")) return "purple";
    if (value.includes("deliver")) return "success";
    if (value.includes("ship") || value.includes("transit")) {
        return "info";
    }

    if (
        value.includes("process") ||
        value.includes("pending") ||
        value.includes("confirm")
    ) {
        return "warning";
    }

    return "neutral";
};

const getProgress = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("cancel") || value.includes("return")) return 0;
    if (value.includes("deliver")) return 100;
    if (value.includes("ship") || value.includes("transit")) return 70;
    if (value.includes("process") || value.includes("confirm")) return 35;

    return 15;
};

function Section({ icon, title, subtitle, children }) {
    return (
        <section className="od-section">
            <div className="od-section-heading">
                <div className="od-section-icon">{icon}</div>

                <div>
                    <h2>{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>
            </div>

            {children}
        </section>
    );
}

function Info({ label, value }) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return (
        <div className="od-info">
            <span>{label}</span>
            <strong>{safe(value)}</strong>
        </div>
    );
}

function StatusTimeline({ order }) {
    const currentStatus = statusLabel(order?.status);

    const history = Array.isArray(order?.statusHistory)
        ? order.statusHistory
            .slice()
            .sort(
                (a, b) =>
                    new Date(a?.date || 0) -
                    new Date(b?.date || 0)
            )
        : [];

    const progress = getProgress(order?.status);

    const standardSteps = [
        {
            label: "Confirmed",
            match: ["confirm"],
            progress: 15,
        },
        {
            label: "Processing",
            match: ["process"],
            progress: 35,
        },
        {
            label: "Shipped",
            match: ["ship", "transit"],
            progress: 70,
        },
        {
            label: "Delivered",
            match: ["deliver"],
            progress: 100,
        },
    ];

    const isSpecial =
        currentStatus === "Cancelled" ||
        currentStatus === "Return";

    return (
        <div className="od-timeline-card glow-card">
            <div className="od-timeline-header">
                <div>
                    <span className="od-mini-label">
                        ORDER TIMELINE
                    </span>

                    <h3>
                        {isSpecial
                            ? currentStatus
                            : "Your order progress"}
                    </h3>

                    <p>
                        {history.length
                            ? "Latest updates are shown below."
                            : "Order status updates will appear here."}
                    </p>
                </div>

                <span
                    className={`od-status ${statusClass(
                        order?.status
                    )}`}
                >
                    <span className="od-status-dot" />
                    {currentStatus}
                </span>
            </div>

            {isSpecial ? (
                <div
                    className={`od-special-status ${currentStatus === "Return"
                            ? "return"
                            : "cancel"
                        }`}
                >
                    {currentStatus === "Return" ? (
                        <FaUndo />
                    ) : (
                        <FaTimesCircle />
                    )}

                    <div>
                        <strong>{currentStatus}</strong>
                        <span>
                            {currentStatus === "Return"
                                ? "Return process is in progress."
                                : "This order has been cancelled."}
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="od-progress-track">
                        <div
                            className="od-progress-fill"
                            style={{
                                width: `${Math.max(progress, 8)}%`,
                            }}
                        />
                    </div>

                    <div className="od-step-row">
                        {standardSteps.map((step) => {
                            const active = progress >= step.progress;
                            const isCurrent =
                                step.label === currentStatus;

                            return (
                                <div
                                    key={step.label}
                                    className={`od-step ${active ? "active" : ""
                                        } ${isCurrent ? "current" : ""}`}
                                >
                                    <div className="od-step-dot">
                                        {active ? <FaCheck /> : ""}
                                    </div>

                                    <span>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {history.length > 0 && (
                <div className="od-history">
                    {history
                        .slice()
                        .reverse()
                        .map((item, index) => (
                            <div
                                className="od-history-item"
                                key={
                                    item?._id ||
                                    `${order?._id}-history-${index}`
                                }
                            >
                                <div
                                    className={`od-history-dot ${statusClass(
                                        item?.status
                                    )}`}
                                >
                                    {index === 0 ? <FaCheck /> : ""}
                                </div>

                                <div className="od-history-body">
                                    <div className="od-history-top">
                                        <strong>
                                            {statusLabel(item?.status)}
                                        </strong>

                                        {index === 0 && (
                                            <span className="od-current">
                                                Current
                                            </span>
                                        )}

                                        <time>
                                            {formatDate(item?.date)}
                                        </time>
                                    </div>

                                    {item?.remark && (
                                        <p>{item.remark}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

export default function OrderDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [openingProductId, setOpeningProductId] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | LOAD ORDER + PRODUCTS
    |--------------------------------------------------------------------------
    */

    const loadOrder = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Please login first.");
                navigate("/login");
                return;
            }

            /*
             * Load order
             */
            const response = await fetch(
                `${API_URL}/api/order/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load order"
                );
            }

            const loadedOrder =
                data?.order ||
                data?.data ||
                data;

            setOrder(loadedOrder);

        } catch (error) {
            console.error(
                "Order details error:",
                error
            );

            toast.error(
                error?.message ||
                "Unable to load order"
            );

            setOrder(null);
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [id]);

    const customer = useMemo(
        () => order?.deliveryAddress?.customer || {},
        [order]
    );

    const address = useMemo(
        () => order?.deliveryAddress?.address || {},
        [order]
    );

    const pricing = useMemo(
        () => order?.pricing || {},
        [order]
    );

    const payment = useMemo(
        () => order?.payment || {},
        [order]
    );

    const shipping = useMemo(
        () => order?.shipping || {},
        [order]
    );

    const items = useMemo(
        () =>
            Array.isArray(order?.items)
                ? order.items
                : [],
        [order]
    );

    const courier = shipping?.courier || {};

    const orderNumber =
        order?.orderNumber ||
        order?._id?.slice(-8)?.toUpperCase();

    const totalItems = items.reduce(
        (sum, item) =>
            sum + Number(item?.quantity || 1),
        0
    );

    const retry = async () => {
        setRetrying(true);
        await loadOrder();
    };

    /*
    |--------------------------------------------------------------------------
    | OPEN PRODUCT BY PRODUCT ID
    |--------------------------------------------------------------------------
    */

    const openProduct = async (item) => {
        const productId = getProductId(item);

        if (!productId) {
            toast.error("Product ID is not available for this item.");
            return;
        }

        const productIdString = String(productId);

        try {
            setOpeningProductId(productIdString);

            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Please login first.");
                navigate("/login");
                return;
            }

            console.log("Loading product by productId:", {
                productId: productIdString,
            });

            const response = await fetch(
                `${API_URL}/api/products/${encodeURIComponent(productIdString)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load product"
                );
            }

            const product =
                data?.product ||
                data?.data?.product ||
                data?.data ||
                data;

            if (!product) {
                throw new Error("Product not found.");
            }

            console.log("Product loaded by productId:", {
                productId: productIdString,
                product,
            });

            /*
             * IMPORTANT:
             * The product page is opened using PRODUCT ID.
             * We do NOT use product.title or product.slug
             * to identify the product.
             */
            navigate(`/products/${encodeURIComponent(productIdString)}`, {
                state: {
                    product,
                    productId: productIdString,
                },
            });
        } catch (error) {
            console.error(
                "Product loading error:",
                error
            );

            toast.error(
                error?.message ||
                "Unable to open product."
            );
        } finally {
            setOpeningProductId(null);
        }
    };

    if (loading) {
        return (
            <AccountShell title="Order details">
                <div className="od-loading">
                    <div className="od-spinner" />

                    <h3>
                        Loading order...
                    </h3>

                    <p>
                        Getting your order and product
                        information.
                    </p>
                </div>

                <style>{styles}</style>
            </AccountShell>
        );
    }

    if (!order) {
        return (
            <AccountShell title="Order details">
                <div className="od-empty">
                    <FaBox />

                    <h2>
                        Order not found
                    </h2>

                    <p>
                        We couldn't find this order.
                    </p>

                    <div className="od-actions">
                        <button
                            type="button"
                            className="od-secondary-btn"
                            onClick={() =>
                                navigate("/account/orders")
                            }
                        >
                            <FaChevronLeft />
                            Back to Orders
                        </button>

                        <button
                            type="button"
                            className="od-primary-btn"
                            onClick={retry}
                            disabled={retrying}
                        >
                            <FaRedo
                                className={
                                    retrying
                                        ? "od-spin"
                                        : ""
                                }
                            />

                            Try Again
                        </button>
                    </div>
                </div>

                <style>{styles}</style>
            </AccountShell>
        );
    }

    return (
        <AccountShell title="Order details">
            <div className="od-page">
                <div className="od-ambient od-ambient-one" />
                <div className="od-ambient od-ambient-two" />


                {/* ORDER HERO */}

                <div className="od-hero glow-border mt-18">
                    <div className="od-hero-main">
                        <div className="od-hero-icon">
                            <FaBox />
                        </div>

                        <div>
                            <span className="od-eyebrow">
                                ORDER
                            </span>

                            <h1>
                                #{safe(orderNumber)}
                            </h1>

                            <p>
                                {totalItems} item
                                {totalItems !== 1
                                    ? "s"
                                    : ""}{" "}
                                • {money(pricing.total)}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`od-status ${statusClass(
                            order.status
                        )}`}
                    >
                        <span className="od-status-dot" />
                        {statusLabel(order.status)}
                    </span>
                </div>

                {/* TIMELINE */}

                <Section
                    icon={<FaClock />}
                    title="Order Timeline"
                    subtitle="Track your order status"
                >
                    <StatusTimeline order={order} />
                </Section>

                {/* TRACKING */}

                {shipping.trackingUrl && (
                    <a
                        href={shipping.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="od-track glow-card"
                    >
                        <div className="od-track-icon">
                            <FaTruck />
                        </div>

                        <div>
                            <small>
                                SHIPMENT
                            </small>

                            <strong>
                                Track your order
                            </strong>

                            {shipping.trackingNumber && (
                                <span>
                                    {shipping.trackingNumber}
                                </span>
                            )}
                        </div>

                        <FaExternalLinkAlt />
                    </a>
                )}

                {/* ITEMS */}

                <Section
                    icon={<FaBox />}
                    title="Items"
                    subtitle={`${totalItems} item${totalItems !== 1
                            ? "s"
                            : ""
                        }`}
                >
                    <div className="od-products">
                        {items.map((item, index) => {
                            const productId =
                                getProductId(item);

                            const product =
                                item?.productId &&
                                    typeof item.productId === "object"
                                    ? item.productId
                                    : null;

                            const image =
                                item?.image ||
                                item?.thumbnail ||
                                product?.thumbnail ||
                                product?.images?.[0] ||
                                product?.image ||
                                "";

                            const quantity = Number(
                                item?.quantity || 1
                            );

                            const itemTotal =
                                item?.total ??
                                Number(
                                    item?.price || 0
                                ) * quantity;

                            /*
                             * The product is opened by productId.
                             * The title is display-only.
                             */
                            const productTitle =
                                product?.title ||
                                item?.title ||
                                "Product";

                            return (
                                <button
                                    type="button"
                                    className={`od-product glow-card ${productId
                                            ? "clickable"
                                            : ""
                                        } ${openingProductId ===
                                            String(productId)
                                            ? "loading"
                                            : ""
                                        }`}
                                    key={
                                        item?._id ||
                                        `${order._id}-${index}`
                                    }
                                    onClick={() =>
                                        openProduct(item)
                                    }
                                    disabled={
                                        !productId ||
                                        openingProductId ===
                                        String(productId)
                                    }
                                    aria-label={
                                        productId
                                            ? `Open ${productTitle}`
                                            : productTitle
                                    }
                                >
                                    <div className="od-product-image">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={productTitle}
                                                onError={(
                                                    event
                                                ) => {
                                                    event.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <FaBox />
                                        )}
                                    </div>

                                    <div className="od-product-info">
                                        <div className="od-product-title">
                                            <h3>
                                                {productTitle}
                                            </h3>

                                            <strong>
                                                {money(itemTotal)}
                                            </strong>
                                        </div>

                                        <div className="od-product-meta">
                                            <span>
                                                Qty {quantity}
                                            </span>

                                            {item?.variantSku && (
                                                <span>
                                                    {item.variantSku}
                                                </span>
                                            )}

                                            {productId && (
                                                <span
                                                    title={String(
                                                        productId
                                                    )}
                                                >
                                                    Product ID:{" "}
                                                    {String(
                                                        productId
                                                    ).slice(-8)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {productId && (
                                        <span
                                            className="od-product-arrow"
                                            aria-hidden="true"
                                        >
                                            {openingProductId ===
                                                String(productId) ? (
                                                <span className="od-product-loading">
                                                    Loading...
                                                </span>
                                            ) : (
                                                <FaExternalLinkAlt />
                                            )}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {/* DELIVERY */}

                <Section
                    icon={<FaMapMarkerAlt />}
                    title="Delivery"
                    subtitle="Delivery address"
                >
                    <div className="od-delivery glow-card">
                        <div className="od-delivery-head">
                            <div className="od-address-icon">
                                <FaMapMarkerAlt />
                            </div>

                            <div>
                                <strong>
                                    {safe(
                                        customer.fullName ||
                                        order.fullname,
                                        "Delivery Address"
                                    )}
                                </strong>

                                <span>
                                    {safe(
                                        address.city,
                                        "Delivery location"
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="od-address">
                            {safe(
                                address.addressLine1
                            )}

                            {address.addressLine2 && (
                                <>
                                    <br />
                                    {address.addressLine2}
                                </>
                            )}

                            {address.landmark && (
                                <>
                                    <br />
                                    Landmark:{" "}
                                    {address.landmark}
                                </>
                            )}

                            <br />

                            {safe(address.area)}
                            {address.area && ", "}
                            {safe(address.city)}

                            <br />

                            {safe(address.state)}
                            {address.state && " - "}
                            {safe(address.postalCode)}
                        </div>

                        <div className="od-contact">
                            {(customer.phone ||
                                order.phone) && (
                                    <span>
                                        <IoCallOutline />
                                        {safe(
                                            customer.phone ||
                                            order.phone
                                        )}
                                    </span>
                                )}

                            {(customer.email ||
                                order.email) && (
                                    <span>
                                        <HiOutlineMail />
                                        {safe(
                                            customer.email ||
                                            order.email
                                        )}
                                    </span>
                                )}
                        </div>
                    </div>
                </Section>

                {/* PAYMENT SUMMARY */}

                <Section
                    icon={<FaReceipt />}
                    title="Payment Summary"
                    subtitle="Order total"
                >
                    <div className="od-summary glow-card">
                        <div>
                            <span>
                                Subtotal
                            </span>

                            <strong>
                                {money(
                                    pricing.subtotal
                                )}
                            </strong>
                        </div>

                        {Number(
                            pricing.shippingCharge ||
                            0
                        ) > 0 && (
                                <div>
                                    <span>
                                        Shipping
                                    </span>

                                    <strong>
                                        {money(
                                            pricing.shippingCharge
                                        )}
                                    </strong>
                                </div>
                            )}

                        {Number(
                            pricing.tax || 0
                        ) > 0 && (
                                <div>
                                    <span>
                                        Tax
                                    </span>

                                    <strong>
                                        {money(pricing.tax)}
                                    </strong>
                                </div>
                            )}

                        {Number(
                            pricing.couponDiscount ||
                            0
                        ) > 0 && (
                                <div className="od-discount">
                                    <span>
                                        Discount
                                    </span>

                                    <strong>
                                        -{" "}
                                        {money(
                                            pricing.couponDiscount
                                        )}
                                    </strong>
                                </div>
                            )}

                        <div className="od-total">
                            <span>
                                Total
                            </span>

                            <strong>
                                {money(pricing.total)}
                            </strong>
                        </div>

                        <div className="od-payment-method">
                            <FaCreditCard />

                            <span>
                                Paid via{" "}
                                <strong>
                                    {safe(
                                        payment.method,
                                        "Payment method"
                                    )}
                                </strong>
                            </span>

                            {payment.status && (
                                <em>
                                    {payment.status}
                                </em>
                            )}
                        </div>
                    </div>
                </Section>

                {/* SHIPPING INFO */}

                {shipping.trackingNumber && (
                    <div className="od-shipping-mini glow-card">
                        <div className="od-shipping-icon">
                            <FaTruck />
                        </div>

                        <div>
                            <small>
                                SHIPMENT
                            </small>

                            <strong>
                                {shipping.trackingNumber}
                            </strong>

                            {courier?.name && (
                                <span>
                                    {courier.name}
                                </span>
                            )}
                        </div>

                        {shipping.trackingUrl && (
                            <a
                                href={
                                    shipping.trackingUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                Track
                                <FaExternalLinkAlt />
                            </a>
                        )}
                    </div>
                )}

                {/* BOTTOM ACTION */}

                <div className="od-bottom">
                    <button
                        type="button"
                        className="od-secondary-btn"
                        onClick={() =>
                            navigate(
                                "/account/orders"
                            )
                        }
                    >
                        <FaChevronLeft />
                        Back to Orders
                    </button>

                    {shipping.trackingUrl && (
                        <a
                            href={
                                shipping.trackingUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="od-primary-btn"
                        >
                            <FaTruck />
                            Track Order
                            <FaExternalLinkAlt />
                        </a>
                    )}
                </div>
            </div>

            <style>{styles}</style>
        </AccountShell>
    );
}

const styles = `
  :root {
    --od-primary: #4f46e5;
    --od-purple: #7c3aed;
    --od-cyan: #7c3aed;
    --od-green: #10b981;
    --od-red: #ef4444;
    --od-orange: #f59e0b;
    --od-bg: #f7f8fc;
    --od-text: #111827;
    --od-muted: #8b95a7;
    --od-border: rgba(99,102,241,.13);
  }

  .od-page {
    position: relative;
    isolation: isolate;
    width: 100%;
    max-width: 1050px;
    margin: 0 auto;
    padding: 8px 0 60px;
    box-sizing: border-box;
  }

  .od-ambient {
    position: fixed;
    z-index: -1;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(90px);
    opacity: .15;
  }

  .od-ambient-one {
    top: 10%;
    right: -130px;
    background: #4f46e5;
  }

  .od-ambient-two {
    bottom: 5%;
    left: -150px;
    background: #7c3aed;
  }

  .glow-card {
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease;
  }

  .glow-card:hover {
    transform: translateY(-2px);
    border-color: rgba(99,102,241,.30) !important;
    box-shadow:
      0 12px 32px rgba(99,102,241,.10),
      0 0 25px rgba(99,102,241,.07);
  }

  .od-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .od-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 0;
    background: transparent;
    color: #4338ca;
    padding: 7px 0;
    cursor: pointer;
    font-size: clamp(11px, .95vw, 14px);
    font-weight: 850;
  }

  .od-back:hover {
    transform: translateX(-2px);
  }

  .od-topbar > span {
    color: #98a2b3;
    font-size: clamp(9px, .78vw, 12px);
  }

  .od-hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    overflow: hidden;
    padding: 20px;
    border: 1px solid rgba(99,102,241,.20);
    border-radius: 21px;
    background:
      radial-gradient(
        circle at 90% 10%,
        rgba(99,102,241,.18),
        transparent 30%
      ),
      linear-gradient(
        135deg,
        #ffffff,
        #f7f7ff
      );
    box-shadow:
      0 14px 40px rgba(15,23,42,.055),
      0 0 35px rgba(99,102,241,.07);
  }

  .od-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      120deg,
      rgba(99,102,241,.45),
      transparent 40%,
      rgba(139,92,246,.35)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .od-hero-main {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .od-hero-icon {
    width: 53px;
    height: 53px;
    flex: 0 0 53px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: linear-gradient(
      145deg,
      #eef2ff,
      #e9e7ff
    );
    color: #4f46e5;
    font-size: clamp(17px, 1.8vw, 22px);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.12),
      0 0 25px rgba(99,102,241,.17);
  }

  .od-eyebrow,
  .od-mini-label {
    display: block;
    color: #4f46e5;
    font-size: clamp(7px, .65vw, 10px);
    font-weight: 950;
    letter-spacing: 1.4px;
  }

  .od-hero h1 {
    margin: 3px 0 0;
    color: #111827;
    font-size: clamp(20px, 2.2vw, 28px);
    letter-spacing: -.5px;
  }

  .od-hero p {
    margin: 5px 0 0;
    color: #98a2b3;
    font-size: clamp(9px, .78vw, 12px);
  }

  .od-status {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: clamp(9px, .78vw, 12px);
    font-weight: 900;
  }

  .od-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
  }

  .od-status.success {
    color: #047857;
    background: rgba(16,185,129,.09);
    border: 1px solid rgba(16,185,129,.16);
  }

  .od-status.danger {
    color: #dc2626;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.15);
  }

  .od-status.warning {
    color: #b45309;
    background: rgba(245,158,11,.09);
    border: 1px solid rgba(245,158,11,.15);
  }

  .od-status.info {
    color: #2563eb;
    background: rgba(59,130,246,.09);
    border: 1px solid rgba(59,130,246,.15);
  }

  .od-status.purple {
    color: #7c3aed;
    background: rgba(139,92,246,.09);
    border: 1px solid rgba(139,92,246,.15);
  }

  .od-status.neutral {
    color: #4b5563;
    background: #f3f4f6;
  }

  .od-section {
    margin-top: 20px;
  }

  .od-section-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
  }

  .od-section-icon {
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #f1efff;
    color: #4f46e5;
    font-size: clamp(11px, .95vw, 14px);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.06),
      0 0 15px rgba(99,102,241,.08);
  }

  .od-section-heading h2 {
    margin: 0;
    color: #111827;
    font-size: clamp(13px, 1.15vw, 16px);
    font-weight: 880;
  }

  .od-section-heading p {
    margin: 2px 0 0;
    color: #98a2b3;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-timeline-card {
    position: relative;
    padding: 18px;
    border: 1px solid rgba(99,102,241,.15);
    border-radius: 18px;
    background: rgba(255,255,255,.90);
    box-shadow:
      0 8px 30px rgba(15,23,42,.045),
      0 0 25px rgba(99,102,241,.04);
    overflow: hidden;
  }

  .od-timeline-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 100% 0,
        rgba(99,102,241,.08),
        transparent 30%
      );
  }

  .od-timeline-header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 23px;
  }

  .od-timeline-header h3 {
    margin: 3px 0 0;
    color: #111827;
    font-size: clamp(14px, 1.25vw, 17px);
  }

  .od-timeline-header p {
    margin: 3px 0 0;
    color: #98a2b3;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-progress-track {
    height: 4px;
    margin: 0 7% 0;
    overflow: hidden;
    border-radius: 999px;
    background: #e9eaf1;
  }

  .od-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      #4f46e5,
      #7c3aed,
      #7c3aed
    );
    box-shadow:
      0 0 10px rgba(99,102,241,.7),
      0 0 22px rgba(139,92,246,.35);
    transition: width .7s ease;
  }

  .od-step-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: -9px;
  }

  .od-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    color: #a1a9b7;
    font-size: clamp(8px, .72vw, 11px);
    font-weight: 700;
  }

  .od-step-dot {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border: 3px solid white;
    border-radius: 50%;
    background: #e8eaf1;
    color: white;
    font-size: clamp(7px, .65vw, 10px);
    box-shadow: 0 0 0 1px #dfe3eb;
  }

  .od-step.active {
    color: #4338ca;
  }

  .od-step.active .od-step-dot {
    background: linear-gradient(
      145deg,
      #4f46e5,
      #7c3aed
    );
    box-shadow:
      0 0 0 1px rgba(99,102,241,.4),
      0 0 14px rgba(99,102,241,.45);
  }

  .od-step.current .od-step-dot {
    animation: od-pulse 2s infinite;
  }

  .od-history {
    position: relative;
    margin-top: 23px;
    padding-top: 16px;
    border-top: 1px solid #edf0f5;
  }

  .od-history-item {
    position: relative;
    display: flex;
    gap: 11px;
    padding-bottom: 13px;
  }

  .od-history-item:last-child {
    padding-bottom: 0;
  }

  .od-history-item:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 21px;
    bottom: 0;
    width: 2px;
    background: #e7e9f0;
  }

  .od-history-dot {
    position: relative;
    z-index: 1;
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #eef0f6;
    color: #98a2b3;
    font-size: clamp(7px, .65vw, 10px);
  }

  .od-history-dot.success {
    background: #dff8ee;
    color: #059669;
  }

  .od-history-dot.info {
    background: #e5efff;
    color: #2563eb;
  }

  .od-history-dot.warning {
    background: #fff3dc;
    color: #d97706;
  }

  .od-history-dot.danger {
    background: #ffe5e5;
    color: #dc2626;
  }

  .od-history-dot.purple {
    background: #eee8ff;
    color: #7c3aed;
  }

  .od-history-body {
    flex: 1;
    min-width: 0;
  }

  .od-history-top {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .od-history-top strong {
    color: #111827;
    font-size: clamp(10px, .85vw, 13px);
  }

  .od-history-top time {
    margin-left: auto;
    color: #a1a9b7;
    font-size: clamp(7px, .65vw, 10px);
  }

  .od-current {
    padding: 2px 5px;
    border-radius: 5px;
    color: #4f46e5;
    background: #eeecff;
    font-size: clamp(6px, .58vw, 9px);
    font-weight: 900;
    text-transform: uppercase;
  }

  .od-history-body p {
    margin: 3px 0 0;
    color: #7d8798;
    font-size: clamp(8px, .72vw, 11px);
    line-height: 1.5;
  }

  .od-special-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 13px;
    background: #fff8f8;
    color: #dc2626;
    border: 1px solid rgba(239,68,68,.12);
  }

  .od-special-status.return {
    color: #7c3aed;
    background: #faf7ff;
    border-color: rgba(139,92,246,.12);
  }

  .od-special-status > svg {
    font-size: clamp(17px, 1.8vw, 22px);
  }

  .od-special-status strong,
  .od-special-status span {
    display: block;
  }

  .od-special-status strong {
    font-size: clamp(11px, .95vw, 14px);
  }

  .od-special-status span {
    margin-top: 3px;
    color: #8b95a7;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-track {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 15px;
    padding: 13px;
    border: 1px solid rgba(99,102,241,.22);
    border-radius: 15px;
    background: linear-gradient(
      135deg,
      #f1efff,
      #faf9ff
    );
    color: #4f46e5;
    text-decoration: none;
  }

  .od-track-icon {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: white;
    color: #4f46e5;
    box-shadow:
      0 0 0 1px rgba(99,102,241,.08),
      0 0 17px rgba(99,102,241,.15);
  }

  .od-track > div:nth-child(2) {
    flex: 1;
    min-width: 0;
  }

  .od-track small {
    display: block;
    color: #8b95a7;
    font-size: clamp(6px, .58vw, 9px);
    font-weight: 900;
    letter-spacing: 1px;
  }

  .od-track strong {
    display: block;
    margin-top: 2px;
    color: #312e81;
    font-size: clamp(11px, .95vw, 14px);
  }

  .od-track span {
    display: block;
    margin-top: 2px;
    color: #4f46e5;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-money {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
  }

  .od-money svg {
    font-size: .82em;
    flex: 0 0 auto;
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  .od-products {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .od-product {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border: 1px solid rgba(99,102,241,.09);
    border-radius: 14px;
    background: rgba(255,255,255,.90);
    color: inherit;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }

  .od-product.clickable {
    cursor: pointer;
    transition:
      transform .22s ease,
      border-color .22s ease,
      box-shadow .22s ease,
      background .22s ease;
  }

  .od-product.clickable:hover {
    transform: translateY(-2px);
    border-color: rgba(99,102,241,.28);
    background: #fff;
    box-shadow:
      0 12px 28px rgba(99,102,241,.10),
      0 0 24px rgba(139,92,246,.08);
  }

  .od-product.clickable:active {
    transform: translateY(0);
  }

  .od-product.clickable:focus-visible {
    outline: 3px solid rgba(99,102,241,.22);
    outline-offset: 2px;
  }

  .od-product:disabled {
    opacity: 1;
    cursor: default;
  }

  .od-product-arrow {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #f1efff;
    color: #4f46e5;
    font-size: clamp(9px, .78vw, 12px);
    transition:
      transform .22s ease,
      background .22s ease;
  }

  .od-product.clickable:hover
  .od-product-arrow {
    transform: translateX(3px);
    background: #e8e7ff;
  }

  .od-product-image {
    width: 66px;
    height: 66px;
    flex: 0 0 66px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 11px;
    background: #f1f2f7;
    color: #9ca3af;
  }

  .od-product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .3s ease;
  }

  .od-product.clickable:hover
  .od-product-image img {
    transform: scale(1.06);
  }

  .od-product-info {
    flex: 1;
    min-width: 0;
  }

  .od-product-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .od-product-title h3 {
    margin: 0;
    color: #111827;
    font-size: clamp(11px, .95vw, 14px);
    line-height: 1.4;
  }

  .od-product-title strong {
    flex: 0 0 auto;
    color: #111827;
    font-size: clamp(11px, .95vw, 14px);
  }

  .od-product-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
  }

  .od-product-meta span {
    padding: 3px 6px;
    border-radius: 5px;
    background: #f8f9fb;
    border: 1px solid #edf0f5;
    color: #667085;
    font-size: clamp(7px, .65vw, 10px);
  }

  .od-delivery {
    padding: 15px;
    border: 1px solid rgba(99,102,241,.09);
    border-radius: 16px;
    background: white;
  }

  .od-delivery-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .od-address-icon {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #f1efff;
    color: #4f46e5;
  }

  .od-delivery-head strong,
  .od-delivery-head span {
    display: block;
  }

  .od-delivery-head strong {
    color: #111827;
    font-size: clamp(10px, .85vw, 13px);
  }

  .od-delivery-head span {
    margin-top: 2px;
    color: #98a2b3;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-address {
    margin-top: 12px;
    padding: 11px;
    border-radius: 9px;
    background: #fafbfc;
    color: #667085;
    font-size: clamp(8px, .72vw, 11px);
    line-height: 1.65;
  }

  .od-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: 10px;
  }

  .od-contact span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #667085;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-contact svg {
    color: #4f46e5;
  }

  .od-summary {
    padding: 15px;
    border: 1px solid rgba(99,102,241,.09);
    border-radius: 16px;
    background: white;
  }

  .od-summary > div:not(.od-total):not(.od-payment-method) {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 5px 0;
  }

  .od-summary span {
    color: #7d8798;
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-summary strong {
    color: #111827;
    font-size: clamp(9px, .78vw, 12px);
  }

  .od-discount span,
  .od-discount strong {
    color: #059669 !important;
  }

  .od-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 7px;
    padding-top: 12px;
    border-top: 1px solid #edf0f5;
  }

  .od-total span {
    color: #111827;
    font-size: clamp(10px, .85vw, 13px);
    font-weight: 800;
  }

  .od-total strong {
    color: #4f46e5;
    font-size: clamp(15px, 1.5vw, 19px);
  }

  .od-payment-method {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 12px;
    padding: 9px;
    border-radius: 8px;
    background: #f8f7ff;
    color: #4f46e5;
  }

  .od-payment-method span {
    flex: 1;
    color: #7d8798;
    font-size: clamp(7px, .65vw, 10px);
  }

  .od-payment-method span strong {
    font-size: clamp(8px, .72vw, 11px);
  }

  .od-payment-method em {
    color: #059669;
    font-size: clamp(7px, .65vw, 10px);
    font-style: normal;
    font-weight: 800;
    text-transform: capitalize;
  }

  .od-shipping-mini {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
    padding: 11px;
    border: 1px solid rgba(99,102,241,.10);
    border-radius: 13px;
    background: white;
  }

  .od-shipping-icon {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #eef2ff;
    color: #4f46e5;
  }

  .od-shipping-mini > div:nth-child(2) {
    flex: 1;
  }

  .od-shipping-mini small,
  .od-shipping-mini strong,
  .od-shipping-mini span {
    display: block;
  }

  .od-shipping-mini small {
    color: #98a2b3;
    font-size: clamp(6px, .58vw, 9px);
    font-weight: 900;
    letter-spacing: .8px;
  }

  .od-shipping-mini strong {
    margin-top: 2px;
    color: #111827;
    font-size: clamp(9px, .78vw, 12px);
  }

  .od-shipping-mini span {
    margin-top: 2px;
    color: #98a2b3;
    font-size: clamp(7px, .65vw, 10px);
  }

  .od-shipping-mini a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #4f46e5;
    text-decoration: none;
    font-size: clamp(8px, .72vw, 11px);
    font-weight: 800;
  }

  .od-bottom {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 25px;
  }

  .od-primary-btn,
  .od-secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 10px;
    font-size: clamp(9px, .78vw, 12px);
    font-weight: 850;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
  }

  .od-primary-btn {
    border: 0;
    color: white;
    background: linear-gradient(
      135deg,
      #4f46e5,
      #7c3aed
    );
    box-shadow:
      0 8px 22px rgba(99,102,241,.22),
      0 0 18px rgba(99,102,241,.12);
  }

  .od-secondary-btn {
    border: 1px solid #e4e7ef;
    color: #667085;
    background: white;
  }

  .od-primary-btn:hover,
  .od-secondary-btn:hover {
    transform: translateY(-1px);
  }

  .od-loading,
  .od-empty {
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .od-loading h3,
  .od-empty h2 {
    margin: 14px 0 4px;
    color: #111827;
  }

  .od-loading p,
  .od-empty p {
    margin: 0;
    color: #98a2b3;
    font-size: clamp(9px, .78vw, 12px);
  }

  .od-empty > svg {
    font-size: 34px;
    color: #4f46e5;
  }

  .od-actions {
    display: flex;
    gap: 8px;
    margin-top: 18px;
  }

  .od-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e8eaf4;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: od-spin .8s linear infinite;
  }

  .od-spin {
    animation: od-spin .8s linear infinite;
  }

  @keyframes od-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes od-pulse {
    0%, 100% {
      box-shadow:
        0 0 0 1px rgba(99,102,241,.4),
        0 0 12px rgba(99,102,241,.35);
    }

    50% {
      box-shadow:
        0 0 0 4px rgba(99,102,241,.10),
        0 0 25px rgba(99,102,241,.65);
    }
  }

  @media (max-width: 700px) {
    .od-page {
      padding-bottom: 35px;
    }

    .od-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 16px;
    }

    .od-status {
      align-self: flex-start;
    }

    .od-timeline-card {
      padding: 14px;
    }

    .od-timeline-header {
      align-items: flex-start;
      flex-direction: column;
      margin-bottom: 20px;
    }

    .od-progress-track {
      margin-left: 5%;
      margin-right: 5%;
    }

    .od-step-row {
      gap: 2px;
    }

    .od-step {
      font-size: clamp(7px, .65vw, 10px);
    }

    .od-history-top {
      flex-wrap: wrap;
    }

    .od-history-top time {
      width: 100%;
      margin-left: 0;
    }

    .od-product {
      padding: 9px;
      gap: 9px;
    }

    .od-product-image {
      width: 58px;
      height: 58px;
      flex-basis: 58px;
    }

    .od-product-title {
      display: block;
    }

    .od-product-title strong {
      display: block;
      margin-top: 4px;
    }

    .od-product-arrow {
      width: 24px;
      height: 24px;
      flex-basis: 24px;
    }

    .od-bottom {
      flex-direction: column;
    }

    .od-primary-btn,
    .od-secondary-btn {
      width: 100%;
    }
  }

  /* Responsive typography */
  @media (max-width: 768px) {
    .od-page {
      padding: 6px 0 42px;
    }

    .od-hero {
      padding: 16px;
      gap: 12px;
      border-radius: 17px;
    }

    .od-hero-main {
      gap: 10px;
    }

    .od-hero-icon {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
      border-radius: 13px;
    }

    .od-section {
      margin-top: 16px;
    }

    .od-section-heading {
      gap: 8px;
      margin-bottom: 8px;
    }

    .od-section-icon {
      width: 28px;
      height: 28px;
      flex-basis: 28px;
    }

    .od-timeline-card,
    .od-delivery,
    .od-summary {
      padding: 14px;
    }

    .od-timeline-header {
      gap: 10px;
      margin-bottom: 20px;
    }

    .od-step-row {
      gap: 4px;
    }

    .od-product {
      gap: 10px;
      padding: 9px;
    }

    .od-product-image {
      width: 58px;
      height: 58px;
      flex-basis: 58px;
    }

    .od-product-title {
      gap: 7px;
    }

    .od-product-title h3 {
      overflow-wrap: anywhere;
    }

    .od-product-arrow {
      width: 26px;
      height: 26px;
      flex-basis: 26px;
    }

    .od-bottom {
      flex-direction: column;
    }

    .od-primary-btn,
    .od-secondary-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 420px) {
    .od-hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .od-status {
      align-self: flex-start;
    }

    .od-hero h1 {
      font-size: clamp(19px, 6vw, 23px);
    }

    .od-product-title {
      flex-direction: column;
      gap: 3px;
    }

    .od-product-meta {
      gap: 4px;
    }

    .od-history-top {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .od-history-top time {
      width: 100%;
      margin-left: 0;
    }
  }

`;

