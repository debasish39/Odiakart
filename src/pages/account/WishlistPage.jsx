import React, { useEffect, useState } from "react";
import {
  FaHeart,
  FaArrowRight,
  FaBoxOpen,
  FaStar,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { AccountShell } from "./AccountShell";

function WishlistSkeleton() {
  return (
    <div className="wl-grid" aria-label="Loading wishlist">
      {Array.from({ length: 6 }).map((_, i) => (
        <article className="wl-card wl-skeleton-card" key={i}>
          <div className="wl-skeleton wl-skeleton-image" />
          <div className="wl-content">
            <div className="wl-skeleton wl-skeleton-chip" />
            <div className="wl-skeleton wl-skeleton-title" />
            <div className="wl-skeleton wl-skeleton-title short" />
            <div className="wl-product-bottom">
              <div className="wl-skeleton wl-skeleton-price" />
              <div className="wl-skeleton wl-skeleton-button" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Please login first.");
          setItems([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/wishlist`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load wishlist");
        }

        const wishlist = Array.isArray(data?.wishlist)
          ? data.wishlist
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        setItems(wishlist);
      } catch (error) {
        console.error("Wishlist error:", error);
        toast.error(error?.message || "Unable to load wishlist");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const getProduct = (item) => {
    if (item?.product && typeof item.product === "object") {
      return item.product;
    }

    if (item?.productId && typeof item.productId === "object") {
      return item.productId;
    }

    return {};
  };

  const getImage = (item) =>
    item?.image ||
    getProduct(item)?.image ||
    getProduct(item)?.thumbnail ||
    getProduct(item)?.media?.[0]?.url ||
    getProduct(item)?.media?.[0]?.secure_url ||
    getProduct(item)?.media?.image ||
    getProduct(item)?.images?.[0] ||
    "https://via.placeholder.com/600x600?text=Product";

  const getName = (item) =>
    item?.title ||
    item?.name ||
    getProduct(item)?.title ||
    getProduct(item)?.name ||
    "Product";

  const getPrice = (item) =>
    Number(item?.price ?? getProduct(item)?.price ?? 0);

  const getProductId = (item) => {
    if (!item) return "";

    // Your wishlist response contains:
    // productId: { id: "6a94..." }
    if (typeof item.productId === "string") {
      return item.productId;
    }

    if (item.productId?._id) {
      return String(item.productId._id);
    }

    if (item.productId?.id) {
      return String(item.productId.id);
    }

    if (item.product?._id) {
      return String(item.product._id);
    }

    if (item.product?.id) {
      return String(item.product.id);
    }

    if (item._id) {
      return String(item._id);
    }

    if (item.id) {
      return String(item.id);
    }

    return "";
  };

  const getRating = (item) => {
    const product = getProduct(item);
    const value =
      item?.rating ??
      item?.averageRating ??
      product?.rating ??
      product?.averageRating ??
      product?.reviewsAverage ??
      product?.ratings?.average ??
      0;
    const rating = Number(value);
    return Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  };

  const getReviewCount = (item) => {
    const product = getProduct(item);
    const value =
      item?.reviewCount ??
      item?.reviewsCount ??
      product?.reviewCount ??
      product?.reviewsCount ??
      (Array.isArray(product?.reviews) ? product.reviews.length : 0);
    const count = Number(value);
    return Number.isFinite(count) ? count : 0;
  };


  const viewProduct = (item) => {
    const productId = getProductId(item);

    if (!productId) {
      toast.error("Product ID is not available.");
      return;
    }

    window.location.href = `/products/${productId}`;
  };


  return (
    <AccountShell title="Wishlist">
      <div className="wl-page">
        <div className="wl-orb wl-orb-one" />
        <div className="wl-orb wl-orb-two" />

        <header className="wl-hero mt-15">
          <div className="wl-hero-main">
            <div className="wl-hero-icon">
              <FaHeart />
            </div>

            <div className="wl-heading">
              <span className="wl-eyebrow">YOUR SAVED ITEMS</span>
              <h1>Wishlist</h1>
              <p>
                {loading
                  ? "Loading your favorites..."
                  : items.length
                  ? `${items.length} product${items.length === 1 ? "" : "s"} saved for later`
                  : "Products you love, all in one place."}
              </p>
            </div>
          </div>

          {!loading && items.length > 0 && (
            <div className="wl-count-wrap">
              <span className="wl-count-label">SAVED</span>
              <span className="wl-count">{items.length}</span>
            </div>
          )}
        </header>

        {loading ? (
          <WishlistSkeleton />
        ) : !items.length ? (
          <section className="wl-empty">
            <div className="wl-empty-illustration">
              <div className="wl-empty-circle">
                <FaHeart />
              </div>
              <span className="wl-empty-spark spark-one" />
              <span className="wl-empty-spark spark-two" />
              <span className="wl-empty-spark spark-three" />
            </div>

            <span className="wl-eyebrow">NOTHING SAVED YET</span>
            <h2>Your wishlist is empty</h2>
            <p>
              Keep track of products you love. Tap the heart on any product
              and it will appear here.
            </p>

            <button
              type="button"
              className="wl-shop-btn"
              onClick={() => (window.location.href = "/products")}
            >
              <FaBoxOpen />
              Discover products
              <FaArrowRight />
            </button>
          </section>
        ) : (
          <>
            <div className="wl-toolbar">
              <div>
                <strong>My favorites</strong>
                <span>Items you've saved for later</span>
              </div>
              <div className="wl-toolbar-pill">
                <FaHeart />
                {items.length} saved
              </div>
            </div>

            <div className="wl-grid">
              {items.map((item, index) => {
                const name = getName(item);
                const image = getImage(item);
                const price = getPrice(item);
                const product = getProduct(item);
                const productId = getProductId(item);
                const rating = getRating(item);
                const reviewCount = getReviewCount(item);

                return (
                  <article className="wl-card" key={item?._id || index}>
                    <div className="wl-image-wrap">
                      <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://via.placeholder.com/600x600?text=Product";
                        }}
                      />

                      <div className="wl-image-gradient" />

                      <button
                        type="button"
                        className="wl-heart"
                        aria-label={`Remove ${name} from wishlist`}
                        title="Remove from wishlist"
                      >
                        <FaHeart />
                      </button>

                      <span className="wl-saved-badge">
                        <FaHeart /> Saved
                      </span>
                    </div>

                    <div className="wl-content">
                      <div className="wl-product-meta">
                        {product?.brand && <span>{product.brand}</span>}
                        <span>WISHLIST</span>
                      </div>

                      <h3 title={name}>{name}</h3>

                      <div className="wl-rating" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
                        <span className="wl-stars">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <FaStar
                              key={starIndex}
                              className={starIndex + 1 <= Math.round(rating) ? "filled" : ""}
                            />
                          ))}
                        </span>
                        <strong>{rating > 0 ? rating.toFixed(1) : "New"}</strong>
                        <span>({reviewCount})</span>
                      </div>

                      <div className="wl-product-bottom">
                        <div className="wl-price">
                          <span>₹</span>
                          {price.toLocaleString("en-IN")}
                        </div>

                        <button
                          type="button"
                          className="wl-btn"
                          onClick={() => viewProduct(item)}
                          disabled={!productId}
                          title="View product"
                        >
                          <FaEye />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{styles}</style>
    </AccountShell>
  );
}

const styles = `
  .wl-page {
    --wl-primary: #4f46e5;
    --wl-primary-dark: #3730a3;
    --wl-purple: #7c3aed;
    --wl-purple-light: #a78bfa;
    --wl-bg: #f7f7ff;
    --wl-surface: #ffffff;
    --wl-text: #17172f;
    --wl-muted: #74748c;
    --wl-border: rgba(79,70,229,.12);

    position: relative;
    isolation: isolate;
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding: 12px 20px 48px;
    box-sizing: border-box;
    color: var(--wl-text);
  }

  .wl-page::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -3;
    pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(124,58,237,.10), transparent 28%),
      radial-gradient(circle at 100% 12%, rgba(79,70,229,.10), transparent 30%),
      linear-gradient(180deg, #fafaff 0%, #f6f6ff 100%);
  }

  .wl-orb {
    position: fixed;
    z-index: -2;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    filter: blur(90px);
    opacity: .13;
    pointer-events: none;
  }

  .wl-orb-one { top: 12%; right: -150px; background: #6366f1; }
  .wl-orb-two { bottom: 5%; left: -150px; background: #8b5cf6; }

  .wl-hero {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    min-height: 132px;
    margin-bottom: 18px;
    padding: 26px 28px;
    border: 1px solid rgba(99,102,241,.14);
    border-radius: 28px;
    background:
      radial-gradient(circle at 100% 0%, rgba(139,92,246,.20), transparent 34%),
      radial-gradient(circle at 15% 100%, rgba(79,70,229,.08), transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #faf9ff 52%, #f0edff 100%);
    box-shadow: 0 18px 50px rgba(44,38,110,.09);
    box-sizing: border-box;
  }

  .wl-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(120deg, rgba(79,70,229,.25), transparent 48%, rgba(124,58,237,.2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .wl-hero-main {
    display: flex;
    align-items: center;
    gap: 15px;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .wl-hero-icon {
    width: 64px;
    height: 64px;
    flex: 0 0 64px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    color: #fff;
    font-size: 23px;
    background: linear-gradient(145deg, var(--wl-primary), var(--wl-purple));
    box-shadow: 0 14px 30px rgba(79,70,229,.25);
  }

  .wl-heading { min-width: 0; }

  .wl-eyebrow {
    display: block;
    color: var(--wl-primary);
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 1.25px;
  }

  .wl-header h1,
  .wl-hero h1 {
    margin: 7px 0 5px;
    color: var(--wl-text);
    font-size: 32px;
    line-height: 1.05;
    letter-spacing: -.9px;
    font-weight: 900;
  }

  .wl-hero p {
    margin: 0;
    color: var(--wl-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .wl-count-wrap {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 9px 7px 12px;
    border: 1px solid #d9d5ff;
    border-radius: 999px;
    background: rgba(255,255,255,.78);
    box-shadow: 0 5px 15px rgba(55,48,163,.07);
  }

  .wl-count-label {
    color: #8580aa;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .9px;
  }

  .wl-count {
    min-width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    padding: 0 8px;
    border-radius: 50%;
    color: #fff;
    background: linear-gradient(145deg, var(--wl-primary), var(--wl-purple));
    font-size: 11px;
    font-weight: 900;
    box-shadow: 0 5px 13px rgba(79,70,229,.25);
  }

  .wl-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 2px 10px;
  }

  .wl-toolbar strong,
  .wl-toolbar span {
    display: block;
  }

  .wl-toolbar strong {
    font-size: 14px;
    font-weight: 850;
  }

  .wl-toolbar > div:first-child span {
    margin-top: 2px;
    color: var(--wl-muted);
    font-size: 11px;
  }

  .wl-toolbar-pill {
    display: inline-flex !important;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid #e4e2f4;
    border-radius: 999px;
    color: #55547a;
    background: rgba(255,255,255,.78);
    font-size: 11px !important;
    font-weight: 750;
    white-space: nowrap;
  }

  .wl-toolbar-pill svg {
    color: #dc2626;
    font-size: 10px;
  }

  .wl-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .wl-card {
    position: relative;
    overflow: hidden;
    height: fit-content;
    align-self: start;
    border: 1px solid var(--wl-border);
    border-radius: 18px;
    background: rgba(255,255,255,.98);
    box-shadow: 0 10px 30px rgba(44,38,110,.07);
    transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
  }

  .wl-card:hover {
    transform: translateY(-5px);
    border-color: rgba(79,70,229,.23);
    box-shadow: 0 18px 38px rgba(55,48,163,.12);
  }

  .wl-image-wrap {
    position: relative;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
    max-height: 250px;
    background: linear-gradient(145deg, #f0efff, #f8f8ff);
  }

  .wl-image-wrap img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform .4s cubic-bezier(.2,.8,.2,1);
  }

  .wl-card:hover .wl-image-wrap img {
    transform: scale(1.055);
  }

  .wl-image-gradient {
    position: absolute;
    inset: auto 0 0;
    height: 34%;
    pointer-events: none;
    background: linear-gradient(transparent, rgba(20,18,50,.12));
  }

  .wl-heart {
    position: absolute;
    top: 11px;
    right: 11px;
    width: 39px;
    height: 39px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.8);
    border-radius: 50%;
    color: #dc2626;
    background: rgba(255,255,255,.93);
    box-shadow: 0 7px 18px rgba(31,27,74,.13);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: transform .18s ease, background .18s ease;
  }

  .wl-heart:hover {
    transform: scale(1.08);
    background: #fff;
  }

  .wl-heart:active {
    transform: scale(.94);
  }

  .wl-saved-badge {
    position: absolute;
    left: 13px;
    bottom: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: 1px solid rgba(255,255,255,.7);
    border-radius: 999px;
    color: #fff;
    background: rgba(35,31,78,.68);
    backdrop-filter: blur(9px);
    font-size: 9px;
    font-weight: 850;
  }

  .wl-saved-badge svg {
    color: #fca5a5;
    font-size: 8px;
  }

  .wl-content {
    padding: 13px 14px 14px;
  }

  .wl-product-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 17px;
    overflow: hidden;
  }

  .wl-product-meta span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 4px 6px;
    border-radius: 6px;
    color: #67638d;
    background: #f6f4ff;
    border: 1px solid #ece9fc;
    font-size: 8px;
    font-weight: 850;
    letter-spacing: .5px;
  }

  .wl-content h3 {
    min-height: 38px;
    margin: 7px 0 0;
    overflow: hidden;
    color: var(--wl-text);
    font-size: 14px;
    line-height: 1.3;
    font-weight: 850;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .wl-rating {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 7px;
    min-height: 17px;
    color: #85839a;
    font-size: 11px;
    font-weight: 650;
  }

  .wl-stars {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: #d8d5e5;
  }

  .wl-stars svg {
    font-size: 11px;
  }

  .wl-stars svg.filled {
    color: #f59e0b;
  }

  .wl-rating strong {
    color: #4b4866;
    font-size: 11px;
  }

  .wl-product-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }

  .wl-price {
    flex: 1;
    min-width: 0;
    color: #312e81;
    font-size: 18px;
    line-height: 1;
    font-weight: 950;
    white-space: nowrap;
  }

  .wl-price span {
    margin-right: 1px;
    font-size: 13px;
    font-weight: 850;
  }

  .wl-btn {
    min-height: 38px;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 88px;
    padding: 0 12px;
    border: 0;
    border-radius: 11px;
    color: #fff;
    background: linear-gradient(135deg, var(--wl-primary), var(--wl-purple));
    box-shadow: 0 7px 17px rgba(79,70,229,.22);
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .wl-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(79,70,229,.29);
  }

  .wl-btn:active { transform: scale(.97); }

  .wl-btn svg { font-size: 11px; }

  .wl-empty {
    min-height: 500px;
    padding: 44px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid var(--wl-border);
    border-radius: 26px;
    background: rgba(255,255,255,.9);
    box-shadow: 0 14px 38px rgba(44,38,110,.07);
  }

  .wl-empty-illustration {
    position: relative;
    width: 108px;
    height: 92px;
    margin-bottom: 14px;
  }

  .wl-empty-circle {
    width: 76px;
    height: 76px;
    position: absolute;
    left: 16px;
    top: 7px;
    display: grid;
    place-items: center;
    border-radius: 25px;
    color: #fff;
    background: linear-gradient(145deg, var(--wl-primary), var(--wl-purple));
    box-shadow: 0 15px 32px rgba(79,70,229,.25);
    font-size: 29px;
    transform: rotate(-4deg);
  }

  .wl-empty-spark {
    position: absolute;
    display: block;
    border-radius: 50%;
    background: #a78bfa;
  }

  .spark-one { width: 8px; height: 8px; right: 5px; top: 17px; }
  .spark-two { width: 5px; height: 5px; left: 2px; top: 35px; }
  .spark-three { width: 6px; height: 6px; right: 17px; bottom: 5px; }

  .wl-empty h2 {
    margin: 8px 0 7px;
    color: var(--wl-text);
    font-size: 24px;
    letter-spacing: -.4px;
    font-weight: 900;
  }

  .wl-empty p {
    max-width: 450px;
    margin: 0;
    color: var(--wl-muted);
    font-size: 14px;
    line-height: 1.65;
  }

  .wl-shop-btn {
    min-height: 46px;
    margin-top: 22px;
    padding: 0 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 0;
    border-radius: 11px;
    color: #fff;
    background: linear-gradient(135deg, var(--wl-primary), var(--wl-purple));
    box-shadow: 0 10px 23px rgba(79,70,229,.23);
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .wl-shop-btn svg:last-child { font-size: 10px; }

  .wl-skeleton-card {
    pointer-events: none;
  }

  .wl-skeleton {
    position: relative;
    overflow: hidden;
    background: linear-gradient(
      90deg,
      #ececf6 20%,
      #f9f9ff 50%,
      #ececf6 80%
    );
    background-size: 220% 100%;
    animation: wl-shimmer 1.35s ease-in-out infinite;
  }

  .wl-skeleton-image {
    width: 100%;
    aspect-ratio: 1 / 1;
  }

  .wl-skeleton-chip {
    width: 58px;
    height: 15px;
    border-radius: 6px;
  }

  .wl-skeleton-title {
    width: 91%;
    height: 14px;
    margin-top: 11px;
    border-radius: 6px;
  }

  .wl-skeleton-title.short {
    width: 64%;
    margin-top: 7px;
  }

  .wl-skeleton-price {
    width: 65px;
    height: 20px;
    border-radius: 6px;
  }

  .wl-skeleton-button {
    width: 91px;
    height: 40px;
    border-radius: 11px;
  }

  .wl-skeleton-card .wl-product-bottom {
    margin-top: 13px;
  }

  .wl-btn:disabled {
    opacity: .72;
    cursor: not-allowed;
    transform: none !important;
  }

  @keyframes wl-shimmer {
    0% { background-position: 220% 0; }
    100% { background-position: -220% 0; }
  }


  @media (max-width: 760px) {
    .wl-page {
      padding: 10px 12px 45px;
    }

    .wl-hero {
      min-height: auto;
      padding: 18px;
      border-radius: 20px;
    }

    .wl-hero-icon {
      width: 50px;
      height: 50px;
      flex-basis: 50px;
      border-radius: 15px;
    }

    .wl-hero h1 {
      font-size: 24px;
    }

    .wl-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .wl-card {
      min-height: 0;
      border-radius: 14px;
    }

    .wl-image-wrap {
      aspect-ratio: 1 / 1;
      height: auto;
    }

    .wl-content {
      padding: 10px;
    }

    .wl-content h3 {
      min-height: 34px;
      font-size: 12px;
    }

    .wl-price {
      font-size: 16px;
    }

    .wl-price span {
      font-size: 11px;
    }

    .wl-product-bottom {
      align-items: stretch;
      flex-direction: column;
      gap: 10px;
    }

    .wl-btn {
      width: 100%;
      min-height: 36px;
    }
  }

  @media (max-width: 500px) {
    .wl-header h1,
    .wl-hero h1 {
      font-size: 22px;
    }

    .wl-hero p {
      font-size: 11px;
    }

    .wl-count-wrap {
      padding: 5px 6px 5px 9px;
    }

    .wl-count-label {
      display: none;
    }

    .wl-count {
      width: 28px;
      min-width: 28px;
      height: 28px;
    }

    .wl-toolbar {
      margin-bottom: 10px;
    }

    .wl-toolbar strong {
      font-size: 14px;
    }

    .wl-toolbar > div:first-child span {
      font-size: 10px;
    }

    .wl-toolbar-pill {
      padding: 6px 8px;
      font-size: 10px !important;
    }

    .wl-image-wrap {
      aspect-ratio: 1 / 1;
      height: auto;
    }

    .wl-saved-badge {
      left: 7px;
      bottom: 7px;
      padding: 5px 7px;
      font-size: 8px;
    }

    .wl-heart {
      top: 8px;
      right: 8px;
      width: 33px;
      height: 33px;
      font-size: 11px;
    }

    .wl-product-meta span {
      font-size: 7px;
    }

    .wl-empty {
      min-height: 430px;
      border-radius: 20px;
    }
  }

  @media (max-width: 350px) {
    .wl-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wl-card,
    .wl-image-wrap img,
    .wl-heart,
    .wl-btn {
      transition: none;
    }

    .wl-skeleton {
      animation: none;
    }
  }
`;
