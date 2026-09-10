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


function OrderDetailsSkeleton() {
    return (
        <div className="od-skeleton-page" aria-label="Loading order details" aria-busy="true">
            <div className="od-skeleton-hero od-skeleton-shimmer">
                <div className="od-skeleton-icon" />
                <div className="od-skeleton-hero-copy">
                    <span className="od-skeleton-line xs" />
                    <span className="od-skeleton-line title" />
                    <span className="od-skeleton-line sm" />
                </div>
                <span className="od-skeleton-pill" />
            </div>

            <div className="od-skeleton-section">
                <div className="od-skeleton-heading">
                    <span className="od-skeleton-heading-icon od-skeleton-shimmer" />
                    <div>
                        <span className="od-skeleton-line heading" />
                        <span className="od-skeleton-line xs" />
                    </div>
                </div>

                <div className="od-skeleton-card od-skeleton-shimmer">
                    <div className="od-skeleton-card-top">
                        <div>
                            <span className="od-skeleton-line sm" />
                            <span className="od-skeleton-line medium" />
                        </div>
                        <span className="od-skeleton-pill" />
                    </div>
                    <span className="od-skeleton-progress" />
                    <div className="od-skeleton-steps">
                        <span /><span /><span /><span />
                    </div>
                </div>
            </div>

            <div className="od-skeleton-section">
                <div className="od-skeleton-heading">
                    <span className="od-skeleton-heading-icon od-skeleton-shimmer" />
                    <div>
                        <span className="od-skeleton-line heading" />
                        <span className="od-skeleton-line xs" />
                    </div>
                </div>

                <div className="od-skeleton-products">
                    {[1, 2].map((item) => (
                        <div className="od-skeleton-product od-skeleton-shimmer" key={item}>
                            <span className="od-skeleton-product-image" />
                            <div className="od-skeleton-product-copy">
                                <span className="od-skeleton-line medium" />
                                <span className="od-skeleton-line sm" />
                                <span className="od-skeleton-line xs" />
                            </div>
                            <span className="od-skeleton-arrow" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="od-skeleton-section">
                <div className="od-skeleton-heading">
                    <span className="od-skeleton-heading-icon od-skeleton-shimmer" />
                    <div>
                        <span className="od-skeleton-line heading" />
                        <span className="od-skeleton-line xs" />
                    </div>
                </div>
                <div className="od-skeleton-address od-skeleton-shimmer">
                    <span className="od-skeleton-avatar" />
                    <div>
                        <span className="od-skeleton-line medium" />
                        <span className="od-skeleton-line wide" />
                        <span className="od-skeleton-line sm" />
                    </div>
                </div>
            </div>

            <div className="od-skeleton-section">
                <div className="od-skeleton-heading">
                    <span className="od-skeleton-heading-icon od-skeleton-shimmer" />
                    <div>
                        <span className="od-skeleton-line heading" />
                        <span className="od-skeleton-line xs" />
                    </div>
                </div>
                <div className="od-skeleton-summary od-skeleton-shimmer">
                    <span className="od-skeleton-line wide" />
                    <span className="od-skeleton-line medium" />
                    <span className="od-skeleton-divider" />
                    <span className="od-skeleton-line total" />
                </div>
            </div>
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
                <OrderDetailsSkeleton />
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
    --od-primary-dark: #3730a3;
    --od-purple: #7c3aed;
    --od-purple-soft: #ede9fe;
    --od-bg: #f6f7ff;
    --od-surface: #ffffff;
    --od-text: #17172f;
    --od-muted: #74748c;
    --od-border: rgba(79,70,229,.12);
    --od-shadow: 0 10px 30px rgba(44,38,110,.08);
  }

  .od-page {
    position: relative;
    isolation: isolate;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 10px 14px 70px;
    color: var(--od-text);
    box-sizing: border-box;
    overflow: hidden;
  }

  .od-page::before {
    content: "";
    position: fixed;
    z-index: -2;
    inset: 0;
    background:
      radial-gradient(circle at 10% 0%, rgba(124,58,237,.08), transparent 28%),
      radial-gradient(circle at 100% 20%, rgba(79,70,229,.10), transparent 30%),
      var(--od-bg);
    pointer-events: none;
  }

  .od-ambient {
    position: fixed;
    z-index: -1;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);
    opacity: .16;
  }

  .od-ambient-one { top: 8%; right: -110px; background: #6366f1; }
  .od-ambient-two { bottom: 8%; left: -120px; background: #8b5cf6; }

  .glow-card {
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }

  .glow-card:hover {
    transform: translateY(-2px);
    border-color: rgba(79,70,229,.25) !important;
    box-shadow: 0 14px 34px rgba(55,48,163,.10);
  }

  .od-hero {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px;
    border: 1px solid rgba(99,102,241,.16);
    border-radius: 24px;
    background:
      radial-gradient(circle at 90% 0%, rgba(139,92,246,.24), transparent 34%),
      linear-gradient(135deg, #ffffff 0%, #f7f5ff 48%, #f0edff 100%);
    box-shadow: var(--od-shadow);
  }

  .od-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(120deg, rgba(79,70,229,.35), transparent 45%, rgba(124,58,237,.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .od-hero-main {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .od-hero-icon {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: #fff;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    font-size: 20px;
    box-shadow: 0 10px 24px rgba(79,70,229,.25);
  }

  .od-eyebrow,
  .od-mini-label {
    display: block;
    color: var(--od-primary);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
  }

  .od-hero h1 {
    margin: 4px 0 0;
    color: var(--od-text);
    font-size: 26px;
    line-height: 1.15;
    letter-spacing: -.5px;
    font-weight: 850;
  }

  .od-hero p {
    margin: 5px 0 0;
    color: var(--od-muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .od-status {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 13px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 800;
    background: #fff;
    box-shadow: 0 4px 14px rgba(55,48,163,.08);
  }

  .od-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
  }

  .od-status.success { color: #047857; background: #ecfdf5; border: 1px solid #bbf7d0; }
  .od-status.danger { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }
  .od-status.warning { color: #b45309; background: #fffbeb; border: 1px solid #fde68a; }
  .od-status.info { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }
  .od-status.purple { color: #7c3aed; background: #faf5ff; border: 1px solid #ddd6fe; }
  .od-status.neutral { color: #4b5563; background: #f3f4f6; border: 1px solid #e5e7eb; }

  .od-section { margin-top: 22px; }

  .od-section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 11px;
  }

  .od-section-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    font-size: 15px;
    box-shadow: 0 7px 16px rgba(79,70,229,.18);
  }

  .od-section-heading h2 {
    margin: 0;
    color: var(--od-text);
    font-size: 19px;
    font-weight: 850;
  }

  .od-section-heading p {
    margin: 2px 0 0;
    color: var(--od-muted);
    font-size: 13px;
  }

  .od-timeline-card,
  .od-delivery,
  .od-summary {
    border: 1px solid var(--od-border);
    border-radius: 20px;
    background: rgba(255,255,255,.92);
    box-shadow: var(--od-shadow);
    backdrop-filter: blur(12px);
  }

  .od-timeline-card {
    position: relative;
    padding: 20px;
    overflow: hidden;
  }

  .od-timeline-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 100% 0, rgba(124,58,237,.09), transparent 30%);
  }

  .od-timeline-header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 24px;
  }

  .od-timeline-header h3 {
    margin: 4px 0 0;
    color: var(--od-text);
    font-size: 18px;
  }

  .od-timeline-header p {
    margin: 4px 0 0;
    color: var(--od-muted);
    font-size: 13px;
  }

  .od-progress-track {
    height: 7px;
    margin: 0 7%;
    overflow: hidden;
    border-radius: 999px;
    background: #e9e7f7;
  }

  .od-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #4f46e5, #6366f1, #7c3aed);
    box-shadow: 0 0 14px rgba(99,102,241,.45);
    transition: width .7s ease;
  }

  .od-step-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: -11px;
  }

  .od-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #a1a1b5;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
  }

  .od-step-dot {
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    border: 4px solid #fff;
    border-radius: 50%;
    background: #e5e4ef;
    color: #fff;
    font-size: 10px;
    box-shadow: 0 0 0 1px #dddbea;
  }

  .od-step.active { color: #4338ca; }
  .od-step.active .od-step-dot {
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    box-shadow: 0 0 0 1px rgba(99,102,241,.35), 0 0 16px rgba(99,102,241,.35);
  }

  .od-step.current .od-step-dot { animation: od-pulse 2s infinite; }

  .od-history {
    position: relative;
    margin-top: 23px;
    padding-top: 17px;
    border-top: 1px solid #eeeef5;
  }

  .od-history-item {
    position: relative;
    display: flex;
    gap: 11px;
    padding-bottom: 14px;
  }

  .od-history-item:last-child { padding-bottom: 0; }

  .od-history-item:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 21px;
    bottom: 0;
    width: 2px;
    background: #e5e3f0;
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
    background: #eeeef5;
    color: #9898ad;
    font-size: 9px;
  }

  .od-history-dot.success { background: #dcfce7; color: #059669; }
  .od-history-dot.info { background: #e0e7ff; color: #4338ca; }
  .od-history-dot.warning { background: #fef3c7; color: #d97706; }
  .od-history-dot.danger { background: #fee2e2; color: #dc2626; }
  .od-history-dot.purple { background: #ede9fe; color: #7c3aed; }

  .od-history-body { flex: 1; min-width: 0; }

  .od-history-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .od-history-top strong { color: var(--od-text); font-size: 14px; }
  .od-history-top time { margin-left: auto; color: #a1a1b5; font-size: 12px; }

  .od-current {
    padding: 3px 7px;
    border-radius: 999px;
    color: #4f46e5;
    background: #eef2ff;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .od-history-body p {
    margin: 4px 0 0;
    color: var(--od-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .od-special-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border-radius: 15px;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fee2e2;
  }

  .od-special-status.return {
    color: #7c3aed;
    background: #faf5ff;
    border-color: #ede9fe;
  }

  .od-special-status strong { display: block; font-size: 15px; }
  .od-special-status span { display: block; margin-top: 3px; color: var(--od-muted); font-size: 13px; }

  .od-track {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    padding: 14px;
    border: 1px solid #ddd6fe;
    border-radius: 17px;
    background: linear-gradient(135deg, #eef2ff, #faf5ff);
    color: #4f46e5;
    text-decoration: none;
    box-shadow: 0 8px 22px rgba(79,70,229,.07);
  }

  .od-track-icon,
  .od-address-icon,
  .od-shipping-icon {
    display: grid;
    place-items: center;
    color: #fff;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
  }

  .od-track-icon { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 13px; }
  .od-track > div:nth-child(2) { flex: 1; min-width: 0; }
  .od-track small { display: block; color: #7c73b7; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
  .od-track strong { display: block; margin-top: 2px; color: #312e81; font-size: 15px; }
  .od-track span { display: block; margin-top: 2px; color: #6366f1; font-size: 12px; }

  .od-money { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .od-money svg { font-size: .85em; flex: 0 0 auto; }

  .od-products { display: flex; flex-direction: column; gap: 10px; }

  .od-product {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 11px;
    border: 1px solid var(--od-border);
    border-radius: 17px;
    background: rgba(255,255,255,.95);
    color: inherit;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }

  .od-product.clickable {
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }

  .od-product.clickable:hover {
    transform: translateY(-2px);
    border-color: rgba(79,70,229,.28);
    box-shadow: 0 12px 28px rgba(79,70,229,.10);
  }

  .od-product.clickable:active { transform: scale(.99); }
  .od-product.clickable:focus-visible { outline: 3px solid rgba(99,102,241,.22); outline-offset: 2px; }
  .od-product:disabled { opacity: 1; cursor: default; }

  .od-product-image {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 14px;
    background: linear-gradient(145deg, #f1efff, #f7f7ff);
    color: #a5b4fc;
  }

  .od-product-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
  .od-product.clickable:hover .od-product-image img { transform: scale(1.05); }

  .od-product-info { flex: 1; min-width: 0; }

  .od-product-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .od-product-title h3 {
    margin: 0;
    color: var(--od-text);
    font-size: 15px;
    line-height: 1.4;
    font-weight: 750;
  }

  .od-product-title strong {
    flex: 0 0 auto;
    color: #312e81;
    font-size: 15px;
    font-weight: 850;
  }

  .od-product-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
  }

  .od-product-meta span {
    padding: 4px 7px;
    border-radius: 7px;
    background: #f8f7ff;
    border: 1px solid #ede9fe;
    color: #68688a;
    font-size: 11px;
  }

  .od-product-arrow {
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #eef2ff;
    color: #4f46e5;
    font-size: 12px;
  }

  .od-delivery { padding: 17px; }

  .od-delivery-head { display: flex; align-items: center; gap: 11px; }

  .od-address-icon { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 12px; }

  .od-delivery-head strong,
  .od-delivery-head span { display: block; }

  .od-delivery-head strong { color: var(--od-text); font-size: 15px; }
  .od-delivery-head span { margin-top: 2px; color: var(--od-muted); font-size: 12px; }

  .od-address {
    margin-top: 13px;
    padding: 13px;
    border-radius: 12px;
    background: #fafaff;
    border: 1px solid #f0eff8;
    color: #64647d;
    font-size: 13px;
    line-height: 1.7;
  }

  .od-contact { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 11px; }
  .od-contact span { display: inline-flex; align-items: center; gap: 6px; color: #66667e; font-size: 12px; }
  .od-contact svg { color: #6366f1; }

  .od-summary { padding: 17px; }

  .od-summary > div:not(.od-total):not(.od-payment-method) {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
  }

  .od-summary span { color: #74748c; font-size: 13px; }
  .od-summary strong { color: var(--od-text); font-size: 13px; }
  .od-discount span, .od-discount strong { color: #059669 !important; }

  .od-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 14px;
    border-top: 1px solid #ecebf4;
  }

  .od-total span { color: var(--od-text); font-size: 16px; font-weight: 850; }
  .od-total strong { color: #4f46e5; font-size: 20px; font-weight: 900; }

  .od-payment-method {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 13px;
    padding: 10px 11px;
    border-radius: 11px;
    background: linear-gradient(135deg, #f5f3ff, #eef2ff);
    color: #4f46e5;
  }

  .od-payment-method span { flex: 1; color: #74748c; font-size: 12px; }
  .od-payment-method span strong { color: #3730a3; font-size: 12px; }
  .od-payment-method em { color: #059669; font-size: 11px; font-style: normal; font-weight: 850; text-transform: capitalize; }

  .od-shipping-mini {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 15px;
    padding: 12px;
    border: 1px solid var(--od-border);
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 7px 20px rgba(44,38,110,.06);
  }

  .od-shipping-icon { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 11px; }
  .od-shipping-mini > div:nth-child(2) { flex: 1; min-width: 0; }
  .od-shipping-mini small, .od-shipping-mini strong, .od-shipping-mini span { display: block; }
  .od-shipping-mini small { color: #9292aa; font-size: 10px; font-weight: 900; letter-spacing: .8px; }
  .od-shipping-mini strong { margin-top: 2px; color: var(--od-text); font-size: 13px; }
  .od-shipping-mini span { margin-top: 2px; color: var(--od-muted); font-size: 11px; }
  .od-shipping-mini a { display: inline-flex; align-items: center; gap: 5px; color: #4f46e5; text-decoration: none; font-size: 12px; font-weight: 850; }

  .od-bottom {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 10px;
    margin-top: 26px;
  }

  .od-primary-btn,
  .od-secondary-btn {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 850;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .od-primary-btn {
    border: 0;
    color: white;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    box-shadow: 0 10px 24px rgba(79,70,229,.24);
  }

  .od-secondary-btn {
    border: 1px solid #e1dff0;
    color: #4b4b68;
    background: #fff;
  }

  .od-primary-btn:hover,
  .od-secondary-btn:hover { transform: translateY(-2px); }


  /* Professional loading skeleton */
  .od-skeleton-page {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 10px 14px 70px;
    box-sizing: border-box;
    color: var(--od-text);
  }

  .od-skeleton-shimmer {
    position: relative;
    overflow: hidden;
    background: #ececf5;
  }

  .od-skeleton-shimmer::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.62),
      transparent
    );
    animation: od-skeleton-shimmer 1.45s ease-in-out infinite;
  }

  .od-skeleton-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 98px;
    padding: 20px;
    border: 1px solid rgba(99,102,241,.12);
    border-radius: 24px;
    background: #f3f2fb;
    box-shadow: var(--od-shadow);
    box-sizing: border-box;
  }

  .od-skeleton-icon {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    border-radius: 18px;
    background: #deddf0;
  }

  .od-skeleton-hero-copy {
    flex: 1;
    min-width: 0;
  }

  .od-skeleton-line {
    display: block;
    height: 11px;
    margin-top: 7px;
    border-radius: 999px;
    background: #deddea;
  }

  .od-skeleton-line:first-child { margin-top: 0; }
  .od-skeleton-line.xs { width: 58px; height: 8px; }
  .od-skeleton-line.sm { width: 130px; }
  .od-skeleton-line.medium { width: 58%; }
  .od-skeleton-line.wide { width: 82%; }
  .od-skeleton-line.title { width: min(220px, 72%); height: 18px; margin-top: 8px; }
  .od-skeleton-line.heading { width: 125px; height: 14px; margin-top: 0; }
  .od-skeleton-line.total { width: 105px; height: 18px; margin-top: 0; }

  .od-skeleton-pill {
    width: 82px;
    height: 30px;
    flex: 0 0 82px;
    border-radius: 999px;
    background: #deddf0;
  }

  .od-skeleton-section { margin-top: 22px; }

  .od-skeleton-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 11px;
  }

  .od-skeleton-heading-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 12px;
  }

  .od-skeleton-card,
  .od-skeleton-address,
  .od-skeleton-summary {
    border: 1px solid var(--od-border);
    border-radius: 20px;
    background: #f7f7fb;
    box-shadow: var(--od-shadow);
    box-sizing: border-box;
  }

  .od-skeleton-card {
    padding: 20px;
    min-height: 190px;
  }

  .od-skeleton-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .od-skeleton-progress {
    display: block;
    width: 86%;
    height: 7px;
    margin: 34px auto 0;
    border-radius: 999px;
    background: #deddea;
  }

  .od-skeleton-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin-top: -11px;
  }

  .od-skeleton-steps span {
    width: 27px;
    height: 27px;
    margin: 0 auto;
    border: 4px solid #f7f7fb;
    border-radius: 50%;
    background: #deddea;
    box-shadow: 0 0 0 1px #d9d8e7;
  }

  .od-skeleton-products {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .od-skeleton-product {
    display: flex;
    align-items: center;
    gap: 13px;
    min-height: 96px;
    padding: 11px;
    border: 1px solid var(--od-border);
    border-radius: 17px;
    background: #f7f7fb;
    box-sizing: border-box;
  }

  .od-skeleton-product-image {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
    border-radius: 14px;
    background: #deddea;
  }

  .od-skeleton-product-copy {
    flex: 1;
    min-width: 0;
  }

  .od-skeleton-arrow {
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    border-radius: 9px;
    background: #deddea;
  }

  .od-skeleton-address {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px;
    min-height: 112px;
  }

  .od-skeleton-avatar {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border-radius: 12px;
    background: #deddea;
  }

  .od-skeleton-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 18px;
    min-height: 125px;
  }

  .od-skeleton-divider {
    display: block;
    width: 100%;
    height: 1px;
    margin: 5px 0;
    background: #deddea;
  }

  @keyframes od-skeleton-shimmer {
    100% { transform: translateX(100%); }
  }

  .od-loading,
  .od-empty {
    min-height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
  }

  .od-loading h3, .od-empty h2 { margin: 15px 0 5px; color: var(--od-text); }
  .od-loading p, .od-empty p { margin: 0; color: var(--od-muted); font-size: 14px; }
  .od-empty > svg { padding: 16px; border-radius: 20px; color: #fff; background: linear-gradient(145deg, #4f46e5, #7c3aed); font-size: 30px; }
  .od-actions { display: flex; gap: 9px; margin-top: 20px; }

  .od-spinner {
    width: 38px;
    height: 38px;
    border: 4px solid #e7e5f5;
    border-top-color: #4f46e5;
    border-right-color: #7c3aed;
    border-radius: 50%;
    animation: od-spin .8s linear infinite;
  }

  .od-spin { animation: od-spin .8s linear infinite; }

  @keyframes od-spin { to { transform: rotate(360deg); } }

  @keyframes od-pulse {
    0%, 100% { box-shadow: 0 0 0 1px rgba(99,102,241,.4), 0 0 12px rgba(99,102,241,.35); }
    50% { box-shadow: 0 0 0 5px rgba(99,102,241,.10), 0 0 25px rgba(139,92,246,.55); }
  }

  @media (max-width: 700px) {
    .od-skeleton-page { padding: 7px 10px 42px; }
    .od-skeleton-hero {
      align-items: flex-start;
      flex-wrap: wrap;
      padding: 17px;
      border-radius: 20px;
    }
    .od-skeleton-icon { width: 48px; height: 48px; flex-basis: 48px; border-radius: 15px; }
    .od-skeleton-hero-copy { width: calc(100% - 62px); flex-basis: calc(100% - 62px); }
    .od-skeleton-hero > .od-skeleton-pill { margin-left: 62px; }
    .od-skeleton-card,
    .od-skeleton-address,
    .od-skeleton-summary { padding: 15px; border-radius: 17px; }
    .od-skeleton-product { gap: 10px; padding: 9px; }
    .od-skeleton-product-image { width: 62px; height: 62px; flex-basis: 62px; }
    .od-skeleton-line.medium { width: 68%; }
  }

  @media (max-width: 420px) {
    .od-skeleton-page { padding-left: 8px; padding-right: 8px; }
    .od-skeleton-hero { padding: 15px; }
    .od-skeleton-product-image { width: 56px; height: 56px; flex-basis: 56px; }
    .od-skeleton-product { min-height: 80px; }
    .od-skeleton-line.title { width: 150px; }
    .od-skeleton-card { min-height: 175px; }
  }

  @media (max-width: 700px) {
    .od-page { padding: 7px 10px 42px; }

    .od-hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 17px;
      border-radius: 20px;
    }

    .od-hero-main { width: 100%; }
    .od-hero-icon { width: 48px; height: 48px; flex-basis: 48px; border-radius: 15px; }
    .od-hero h1 { font-size: 22px; }
    .od-status { align-self: flex-start; }

    .od-section { margin-top: 18px; }
    .od-section-heading h2 { font-size: 17px; }

    .od-timeline-card,
    .od-delivery,
    .od-summary { padding: 15px; border-radius: 17px; }

    .od-timeline-header { flex-direction: column; margin-bottom: 21px; }

    .od-progress-track { margin-left: 4%; margin-right: 4%; }
    .od-step { font-size: 10px; }
    .od-step-dot { width: 25px; height: 25px; }

    .od-history-top { flex-wrap: wrap; }
    .od-history-top time { width: 100%; margin-left: 0; }

    .od-product { gap: 10px; padding: 9px; }
    .od-product-image { width: 62px; height: 62px; flex-basis: 62px; }
    .od-product-title { display: block; }
    .od-product-title strong { display: block; margin-top: 5px; }
    .od-product-arrow { width: 27px; height: 27px; flex-basis: 27px; }

    .od-bottom { grid-template-columns: 1fr; }
    .od-primary-btn, .od-secondary-btn { width: 100%; }
  }

  @media (max-width: 420px) {
    .od-page { padding-left: 8px; padding-right: 8px; }
    .od-hero { padding: 15px; }
    .od-hero-main { gap: 10px; }
    .od-hero h1 { font-size: 20px; }
    .od-hero p { font-size: 12px; }

    .od-section-heading { gap: 8px; }
    .od-section-icon { width: 32px; height: 32px; flex-basis: 32px; }

    .od-product-title h3 { font-size: 14px; }
    .od-product-meta span { font-size: 10px; }

    .od-contact { flex-direction: column; gap: 7px; }
    .od-payment-method { flex-wrap: wrap; }

    .od-actions { width: 100%; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow-card,
    .od-product.clickable,
    .od-primary-btn,
    .od-secondary-btn,
    .od-progress-fill { transition: none; }

    .od-spinner,
    .od-spin,
    .od-step.current .od-step-dot { animation: none; }
  }
`;