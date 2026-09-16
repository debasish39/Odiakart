import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaStar,
  FaAward,
  FaEye,
} from "react-icons/fa";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;

const CACHE_KEY = "odikart_top_rated_products";
const CACHE_TIME_KEY = "odikart_top_rated_products_cache_time";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedTopRated = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

    if (!cached || !cachedTime) return null;

    if (Date.now() - Number(cachedTime) > CACHE_DURATION) {
      return null;
    }

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const saveTopRatedCache = (products) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(products));
    sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors (private mode / quota / unavailable storage).
  }
};

export default function TopRatedProducts() {
  const navigate = useNavigate();

  const cachedProducts = getCachedTopRated();

  const [products, setProducts] = useState(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [error, setError] = useState("");
  const [activeIndexes, setActiveIndexes] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  /* =====================================================
     FETCH TOP RATED
  ===================================================== */

  const fetchTopRated = useCallback(async ({ showLoader = false } = {}) => {
    const url = `${BACKEND_URL}/api/products/top-rated`;

    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || `HTTP ${response.status}`
        );
      }

      const list = Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(list);
      saveTopRatedCache(list);
    } catch (error) {
      console.error("Top Rated Products fetch error:", error);

      // Only show an error when there is no cached/visible data.
      if (!cachedProducts?.length) {
        setError(
          error?.message ||
            "Failed to load top rated products"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [cachedProducts?.length]);

  const changeImage = (
    event,
    productId,
    imageCount,
    direction
  ) => {
    event.stopPropagation();

    if (imageCount <= 1) return;

    setActiveIndexes((previous) => {
      const current = previous[productId] || 0;

      return {
        ...previous,
        [productId]:
          (current + direction + imageCount) %
          imageCount,
      };
    });
  };

  const goToImage = (
    event,
    productId,
    index
  ) => {
    event.stopPropagation();

    setActiveIndexes((previous) => ({
      ...previous,
      [productId]: index,
    }));
  };

  const autoSwipe = useCallback((productId, imageCount) => {
    if (imageCount <= 1) return;

    setActiveIndexes((previous) => {
      const current = previous[productId] || 0;

      return {
        ...previous,
        [productId]:
          (current + 1) % imageCount,
      };
    });
  }, []);

  useEffect(() => {
    if (!hoveredCard) return;

    const product = products.find(
      (item) => item._id === hoveredCard
    );

    if (!product) return;

    const images = getImages(product);

    if (images.length <= 1) return;

    const timer = setInterval(() => {
      autoSwipe(product._id, images.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [hoveredCard, products, autoSwipe]);

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    // Cached data is rendered immediately. Refresh silently in the background.
    fetchTopRated({ showLoader: !cachedProducts?.length });
  }, [fetchTopRated, cachedProducts?.length]);

  /* =====================================================
     IMAGE
  ===================================================== */

  const getImages = (product) => {
    const images = [
      product?.media?.thumbnail,
      ...(Array.isArray(product?.media?.images)
        ? product.media.images
        : []),
      ...(Array.isArray(product?.variants)
        ? product.variants.flatMap((variant) =>
            Array.isArray(variant?.images)
              ? variant.images
              : []
          )
        : []),
    ].filter(Boolean);

    const uniqueImages = [...new Set(images)];

    return uniqueImages.length
      ? uniqueImages
      : [
          "https://via.placeholder.com/500x500?text=Product",
        ];
  };

  /* =====================================================
     ACTIVE VARIANT
  ===================================================== */

  const getVariant = (product) => {
    if (
      !Array.isArray(product?.variants) ||
      product.variants.length === 0
    ) {
      return null;
    }

    return (
      product.variants.find(
        (variant) =>
          variant?.isActive !== false
      ) ||
      product.variants[0]
    );
  };

  /* =====================================================
     PRICE
  ===================================================== */

  const getPrice = (product) => {
    const variant = getVariant(product);

    return Number(
      variant?.price || 0
    );
  };

  /* =====================================================
     ORIGINAL PRICE
  ===================================================== */

  const getOriginalPrice = (product) => {
    const variant = getVariant(product);

    return Number(
      variant?.originalPrice ||
        variant?.price ||
        0
    );
  };

  /* =====================================================
     OPEN PRODUCT
  ===================================================== */

  const openProduct = (product) => {

    if (!product?._id) {

      return;
    }

    navigate(
      `/products/${product._id}`
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

if (loading) {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-1.5 py-8 sm:px-4">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl"
      />

      {/* HEADER */}
      <div className="relative z-10 mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="popular-skeleton-shimmer mb-3 h-6 w-32 rounded-full" />

          <div className="popular-skeleton-shimmer h-7 w-48 rounded-lg sm:h-8 sm:w-60" />

          <div className="popular-skeleton-shimmer mt-3 h-4 w-60 rounded-md sm:w-72" />
        </div>

        <div className="popular-skeleton-shimmer hidden h-9 w-20 rounded-full sm:block" />
      </div>

      {/* PRODUCT GRID */}
      <div className="relative z-10 grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="popular-skeleton-card relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:rounded-[22px]"
          >
            {/* Card glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent opacity-70 blur-[1px]"
            />

            {/* IMAGE */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/70 sm:h-56 lg:h-64">
              <div className="popular-skeleton-shimmer absolute inset-0" />

              {/* Fake product image */}
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/50 shadow-[0_0_55px_rgba(99,102,241,0.14)] backdrop-blur-sm sm:h-28 sm:w-28" />

              {/* Popular badge */}
              <div className="popular-skeleton-shimmer absolute left-2.5 top-2.5 h-5 w-20 rounded-full sm:left-3 sm:top-3" />

              {/* Image dots */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-slate-900/10 px-2 py-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className="popular-skeleton-shimmer h-1.5 w-1.5 rounded-full"
                  />
                ))}
              </div>

              {/* Image counter */}
              <div className="popular-skeleton-shimmer absolute bottom-2 right-2 h-5 w-9 rounded-md" />
            </div>

            {/* PRODUCT CONTENT */}
            <div className="relative p-3 sm:p-4">
              {/* Category */}
              <div className="popular-skeleton-shimmer mb-2 h-3 w-20 rounded-full" />

              {/* Title */}
              <div className="min-h-[38px] space-y-2">
                <div className="popular-skeleton-shimmer h-4 w-full rounded-md" />
                <div className="popular-skeleton-shimmer h-4 w-3/4 rounded-md" />
              </div>

              {/* Rating + Views */}
              <div className="mt-3 flex min-h-[18px] items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="popular-skeleton-shimmer h-2.5 w-2.5 rounded-sm"
                    />
                  ))}

                  <div className="popular-skeleton-shimmer ml-1 h-3 w-7 rounded-full" />
                </div>

                <div className="popular-skeleton-shimmer h-3 w-10 rounded-full" />
              </div>

              {/* Price */}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                <div className="popular-skeleton-shimmer h-5 w-20 rounded-md" />
                <div className="popular-skeleton-shimmer h-3 w-14 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SKELETON ANIMATION */}
      <style>{`
        .popular-skeleton-shimmer {
          position: relative;
          overflow: hidden;

          background: linear-gradient(
            110deg,
            #eef2f7 8%,
            #f8fafc 18%,
            #e8edff 30%,
            #f8fafc 42%,
            #eef2f7 58%
          );

          background-size: 250% 100%;

          animation:
            popularSkeletonShimmer 1.8s ease-in-out infinite;

          box-shadow:
            inset 0 0 14px rgba(255, 255, 255, 0.5),
            0 0 12px rgba(99, 102, 241, 0.025);
        }

        .popular-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;

          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 30%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(165, 180, 252, 0.2) 60%,
            transparent 100%
          );

          transform: translateX(-120%);
          animation: popularSkeletonGlow 2.2s ease-in-out infinite;
        }

        @keyframes popularSkeletonShimmer {
          0% {
            background-position: 100% 0;
          }

          50% {
            background-position: 0% 0;
          }

          100% {
            background-position: -100% 0;
          }
        }

        @keyframes popularSkeletonGlow {
          0% {
            transform: translateX(-120%);
          }

          55%,
          100% {
            transform: translateX(120%);
          }
        }

        @media (max-width: 640px) {
          .popular-skeleton-card {
            border-radius: 18px;
          }

          .popular-skeleton-shimmer {
            background-size: 200% 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .popular-skeleton-shimmer,
          .popular-skeleton-shimmer::after {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">

        <div className="
          rounded-2xl
          border
          border-red-100
          bg-red-50
          p-3
          text-center
        ">

          <FaAward
            className="mx-auto text-indigo-400 "
            size={30}
          />

          <h2 className="text-xl font-bold">
            Top Rated Products
          </h2>

          <p className="text-slate-500 mt-2">
            {error}
          </p>

          <button
            onClick={() => fetchTopRated({ showLoader: true })}
            className="
              mt-5
              px-5
              py-2.5
              rounded-xl
              bg-indigo-600
              text-white
              font-semibold
            "
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }

  /* =====================================================
     EMPTY
  ===================================================== */

  if (!products.length) {

    return null;
  }

  return (
    <>
      <style>{`
        .tr-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        .tr-glow {
          position: absolute;
          inset: 0 5% auto;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(
            ellipse,
            rgba(79,70,229,.07),
            transparent 68%
          );
          filter: blur(30px);
          pointer-events: none;
        }

        .tr-line {
          width: 42px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg,#4f46e5,#6366f1);
        }

        .tr-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(79,70,229,.12);
          border-radius: 24px;
          background: rgba(255,255,255,.93);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 28px rgba(15,23,42,.045);
          transition:
            transform .32s cubic-bezier(.34,1.2,.64,1),
            box-shadow .28s ease,
            border-color .25s ease;
        }

        .tr-card::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 45;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
        }

        .tr-card:hover {
          transform: translateY(-7px) scale(1.012);
          border-color: rgba(79,70,229,.24);
          // box-shadow:
          //   0 22px 52px rgba(79,70,229,.12),
          //   0 5px 18px rgba(0,0,0,.05);
        }

        .tr-track {
          display: flex;
          width: 100%;
          height: 100%;
          will-change: transform;
          transition: transform .42s cubic-bezier(.22,1,.36,1);
          touch-action: pan-y;
        }

        .tr-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 50% 15%,
              rgba(79,70,229,.08),
              transparent 52%
            ),
            linear-gradient(145deg,#f8faff,#eef2ff);
        }

        .tr-slide img {
          width: 100%;
          height: 100%;
          padding: 8px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          transition: transform .5s cubic-bezier(.22,1,.36,1);
        }

        .tr-card:hover .tr-slide img {
          transform: scale(1.07);
        }

        .tr-badge {
          position: absolute;
          top: 11px;
          left: 11px;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          background: linear-gradient(135deg,#4f46e5,#6366f1);
          color: white;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
          box-shadow: 0 5px 14px rgba(79,70,229,.24);
        }

        .tr-dots {
          position: absolute;
          left: 50%;
          bottom: 10px;
          z-index: 28;
          display: flex;
          gap: 4px;
          transform: translateX(-50%);
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(255,255,255,.86);
          backdrop-filter: blur(8px);
        }

        .tr-dot {
          width: 5px;
          height: 5px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #cbd5e1;
          cursor: pointer;
          transition: .2s;
        }

        .tr-dot.active {
          width: 14px;
          background: #4f46e5;
        }

        .tr-count {
          position: absolute;
          right: 10px;
          bottom: 10px;
          z-index: 28;
          padding: 3px 7px;
          border-radius: 7px;
          background: rgba(15,14,42,.55);
          color: white;
          font-size: 9px;
          font-weight: 700;
          backdrop-filter: blur(7px);
        }

        .tr-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 36;
          height: 2px;
          overflow: hidden;
          background: rgba(255,255,255,.3);
          pointer-events: none;
        }

        .tr-progress::after {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,.95);
          transform-origin: left;
          animation: trProgress 1.4s linear infinite;
        }

        @keyframes trProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .tr-price {
          background: linear-gradient(135deg,#4338ca,#4f46e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tr-view-all {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(79,70,229,.16);
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          padding: 9px 14px;
          color: #4338ca;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 3px 12px rgba(15,23,42,.05);
          transition: .2s;
        }

        .tr-view-all:hover {
          transform: translateY(-1px);
          background: #eef2ff;
          border-color: rgba(79,70,229,.24);
          box-shadow: 0 8px 20px rgba(79,70,229,.08);
        }

        .tr-products-scroll {
          display: flex;
          gap: 12px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 3px 3px 10px;
          scroll-behavior: smooth;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .tr-products-scroll::-webkit-scrollbar {
          display: none;
        }

        .tr-product-item {
          flex: 0 0 190px;
          width: 190px;
          min-width: 190px;
          scroll-snap-align: start;
        }

        .tr-dot:focus-visible,
        .tr-view-all:focus-visible {
          outline: 2px solid rgba(79,70,229,.45);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .tr-card {
            border-radius: 20px;
          }

          .tr-product-item {
            flex-basis: 165px;
            width: 165px;
            min-width: 165px;
          }

          .tr-card:hover {
            transform: translateY(-3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tr-card,
          .tr-track,
          .tr-slide img {
            transition: none !important;
          }
        }
      `}</style>

      <section className="tr-root mx-auto w-full max-w-7xl px-3 py-8 sm:px-5 lg:px-8">
        <div className="tr-glow" />

        <div className="relative z-10 mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 shadow-sm backdrop-blur">
              <FaAward size={10} />
              Best reviewed
            </div>

            <div className="flex items-center gap-3">
              <div className="tr-line hidden sm:block" />

              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Top Rated Products
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Top customer ratings, picked for your next purchase.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="tr-view-all group"
          >
            View All
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>

        <div className="tr-products-scroll relative z-10">
          {products.map((product) => {
            const images = getImages(product);
            const activeIdx =
              activeIndexes[product._id] || 0;

            const price = getPrice(product);
            const originalPrice =
              getOriginalPrice(product);

            const rating = Number(
              product?.rating?.average ??
                product?.rating ??
                0
            );

            const reviews = Number(
              product?.numReviews || 0
            );

            const views = Number(
              product?.analytics?.views || 0
            );

            return (
              <article
                key={product._id}
                className="tr-card tr-product-item"
                onMouseEnter={() =>
                  setHoveredCard(product._id)
                }
                onMouseLeave={() =>
                  setHoveredCard((current) =>
                    current === product._id
                      ? null
                      : current
                  )
                }
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    height:
                      "clamp(135px,16vw,175px)",
                  }}
                  onTouchStart={(event) => {
                    event.currentTarget.dataset.touchX =
                      event.touches[0].clientX;

                    setHoveredCard(product._id);
                  }}
                  onTouchEnd={(event) => {
                    const start = Number(
                      event.currentTarget.dataset.touchX || 0
                    );

                    const end =
                      event.changedTouches[0].clientX;

                    const distance = start - end;

                    if (Math.abs(distance) > 45) {
                      changeImage(
                        event,
                        product._id,
                        images.length,
                        distance > 0 ? 1 : -1
                      );
                    }

                    setHoveredCard((current) =>
                      current === product._id
                        ? null
                        : current
                    );
                  }}
                  onTouchCancel={() =>
                    setHoveredCard((current) =>
                      current === product._id
                        ? null
                        : current
                    )
                  }
                >
                  <div
                    className="tr-track"
                    style={{
                      transform: `translateX(-${
                        activeIdx * 100
                      }%)`,
                    }}
                  >
                    {images.map((image, imageIndex) => (
                      <div
                        key={`${image}-${imageIndex}`}
                        className="tr-slide"
                        onClick={() =>
                          openProduct(product)
                        }
                      >
                        <img
                          src={image}
                          alt={`${product?.title || "Product"} image ${
                            imageIndex + 1
                          }`}
                          loading="lazy"
                          draggable="false"
                        />
                      </div>
                    ))}
                  </div>

                  <span className="tr-badge">
                    <FaAward size={9} className="text-white" />
                    Top Rated
                  </span>

                  {hoveredCard === product._id &&
                    images.length > 1 && (
                      <div
                        className="tr-progress"
                        aria-hidden="true"
                      />
                    )}

                  {images.length > 1 && (
                    <>
                      <div className="tr-dots">
                        {images.map((_, imageIndex) => (
                          <button
                            key={imageIndex}
                            type="button"
                            aria-label={`Show image ${
                              imageIndex + 1
                            }`}
                            className={`tr-dot ${
                              activeIdx === imageIndex
                                ? "active"
                                : ""
                            }`}
                            onClick={(event) =>
                              goToImage(
                                event,
                                product._id,
                                imageIndex
                              )
                            }
                          />
                        ))}
                      </div>

                      <div className="tr-count">
                        {activeIdx + 1}/{images.length}
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 sm:p-3">
                  <p className=" truncate text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
                    {product?.category?.name ||
                      "Top Rated"}
                  </p>

                  <h3
                    onClick={() =>
                      openProduct(product)
                    }
                    className="min-h-[38px] cursor-pointer line-clamp-2 text-[12.5px] font-semibold leading-[1.35] text-slate-800 transition-colors hover:text-indigo-600 sm:text-sm"
                  >
                    {product?.title || "Product"}
                  </h3>

                  <div className=" flex min-h-[9px] items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map(
                              (_, starIndex) => (
                                <FaStar
                                  key={starIndex}
                                  size={10}
                                  className={
                                    starIndex <
                                    Math.round(rating)
                                      ? "text-amber-400"
                                      : "text-slate-200"
                                  }
                                />
                              )
                            )}
                          </div>

                          <span className="ml-1 text-[10px] font-bold text-slate-600">
                            {rating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                          New
                        </span>
                      )}

                      <span className="text-[9px] text-slate-400">
                        ({reviews})
                      </span>
                    </div>

                    {views > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                        <FaEye size={9} />
                        {views}
                      </span>
                    )}
                  </div>
<div className="mt-2 flex items-baseline gap-1.5 border-t border-slate-100 pt-2.5">
                    <span className="text-sm font-extrabold sm:text-base">
                      <span className="mr-0.5 text-indigo-600">
                        ₹
                      </span>

                      <span className="tr-price">
                        {price.toLocaleString("en-IN")}
                      </span>
                    </span>

                    {originalPrice > price && (
                      <del className="text-[9px] font-medium text-slate-400">
                        ₹
                        {originalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </del>
                    )}
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}