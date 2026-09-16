import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaStar,
  FaFire,
  FaShoppingBag,
  FaEye,
} from "react-icons/fa";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;


/* =====================================================
   CACHE
===================================================== */

const POPULAR_PRODUCTS_CACHE_KEY =
  "odikart_popular_products";

const POPULAR_PRODUCTS_CACHE_TIME_KEY =
  "odikart_popular_products_cache_time";

const POPULAR_PRODUCTS_CACHE_DURATION =
  5 * 60 * 1000;


/* =====================================================
   CACHE HELPERS
===================================================== */

const getCachedPopularProducts = () => {
  try {
    const cached =
      sessionStorage.getItem(
        POPULAR_PRODUCTS_CACHE_KEY
      );

    const cachedTime =
      sessionStorage.getItem(
        POPULAR_PRODUCTS_CACHE_TIME_KEY
      );

    if (!cached || !cachedTime) {
      return null;
    }

    const age =
      Date.now() - Number(cachedTime);

    if (
      age > POPULAR_PRODUCTS_CACHE_DURATION
    ) {
      return null;
    }

    const parsed =
      JSON.parse(cached);

    return Array.isArray(parsed)
      ? parsed
      : null;

  } catch (error) {
    console.warn(
      "POPULAR PRODUCTS CACHE READ ERROR:",
      error
    );

    return null;
  }
};


const savePopularProductsCache = (
  products
) => {
  try {
    sessionStorage.setItem(
      POPULAR_PRODUCTS_CACHE_KEY,
      JSON.stringify(products)
    );

    sessionStorage.setItem(
      POPULAR_PRODUCTS_CACHE_TIME_KEY,
      String(Date.now())
    );

  } catch (error) {
    console.warn(
      "POPULAR PRODUCTS CACHE SAVE ERROR:",
      error
    );
  }
};


export default function PopularProducts() {
  const navigate = useNavigate();


  /* =====================================================
     INITIAL CACHE
  ===================================================== */

  const cachedProducts =
    getCachedPopularProducts();


  /* =====================================================
     STATE
  ===================================================== */

  const [products, setProducts] =
    useState(
      cachedProducts || []
    );

  const [loading, setLoading] =
    useState(
      !cachedProducts
    );

  const [error, setError] =
    useState("");

  const [activeIndexes, setActiveIndexes] =
    useState({});

  const [hoveredCard, setHoveredCard] =
    useState(null);


  /* =====================================================
     FETCH POPULAR PRODUCTS
  ===================================================== */

  const fetchPopularProducts =
    useCallback(
      async ({
        showLoader = false,
      } = {}) => {

        const url =
          `${BACKEND_URL}/api/products/popular`;

        try {

          /*
           * When cached products exist,
           * refresh silently without showing
           * the skeleton again.
           */

          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const response =
            await fetch(url, {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
            });

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `HTTP ${response.status}`
            );
          }

          const list =
            Array.isArray(
              data?.products
            )
              ? data.products
              : [];

          setProducts(list);

          savePopularProductsCache(list);

        } catch (error) {

          console.error(
            "POPULAR PRODUCTS ERROR:",
            error
          );

          /*
           * Keep cached products visible if
           * the background refresh fails.
           */

          if (!products.length) {
            setError(
              error?.message ||
                "Failed to load popular products"
            );
          }

        } finally {
          setLoading(false);
        }
      },
      []
    );


  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {

    /*
     * No cache:
     *   skeleton + API request
     *
     * Cache:
     *   instant UI + silent refresh
     */

    fetchPopularProducts({
      showLoader:
        !cachedProducts,
    });

  }, []);


  /* =====================================================
     IMAGE
  ===================================================== */

  const getImages = (product) => {
    const images = [
      product?.media?.thumbnail,

      ...(Array.isArray(
        product?.media?.images
      )
        ? product.media.images
        : []),

      ...(Array.isArray(
        product?.variants
      )
        ? product.variants.flatMap(
            (variant) =>
              Array.isArray(
                variant?.images
              )
                ? variant.images
                : []
          )
        : []),
    ].filter(Boolean);

    const uniqueImages =
      [...new Set(images)];

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
      !Array.isArray(
        product?.variants
      ) ||
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
    const variant =
      getVariant(product);

    return Number(
      variant?.price || 0
    );
  };


  /* =====================================================
     ORIGINAL PRICE
  ===================================================== */

  const getOriginalPrice = (
    product
  ) => {
    const variant =
      getVariant(product);

    return Number(
      variant?.originalPrice ||
        variant?.price ||
        0
    );
  };


  /* =====================================================
     OPEN PRODUCT
  ===================================================== */

  const openProduct = (
    product
  ) => {

    if (!product?._id) {
      return;
    }

    navigate(
      `/products/${product._id}`
    );
  };


  /* =====================================================
     CHANGE IMAGE
  ===================================================== */

  const changeImage = (
    event,
    productId,
    imageCount,
    direction
  ) => {

    event.stopPropagation();

    if (imageCount <= 1) {
      return;
    }

    setActiveIndexes(
      (previous) => {
        const current =
          previous[productId] || 0;

        return {
          ...previous,

          [productId]:
            (
              current +
              direction +
              imageCount
            ) %
            imageCount,
        };
      }
    );
  };


  /* =====================================================
     GO TO IMAGE
  ===================================================== */

  const goToImage = (
    event,
    productId,
    index
  ) => {

    event.stopPropagation();

    setActiveIndexes(
      (previous) => ({
        ...previous,

        [productId]: index,
      })
    );
  };


  /* =====================================================
     AUTO SWIPE
  ===================================================== */

  const autoSwipe =
    useCallback(
      (
        productId,
        imageCount
      ) => {

        if (imageCount <= 1) {
          return;
        }

        setActiveIndexes(
          (previous) => {

            const current =
              previous[
                productId
              ] || 0;

            return {
              ...previous,

              [productId]:
                (
                  current + 1
                ) %
                imageCount,
            };
          }
        );
      },
      []
    );


  /* =====================================================
     AUTO SWIPE TIMER
  ===================================================== */

  useEffect(() => {

    if (!hoveredCard) {
      return;
    }

    const product =
      products.find(
        (item) =>
          item._id ===
          hoveredCard
      );

    if (!product) {
      return;
    }

    const images =
      getImages(product);

    if (images.length <= 1) {
      return;
    }

    const timer =
      setInterval(() => {
        autoSwipe(
          product._id,
          images.length
        );
      }, 1400);

    return () =>
      clearInterval(timer);

  }, [
    hoveredCard,
    products,
    autoSwipe,
  ]);


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
          {/* Badge */}
          <div className="skeleton-shimmer mb-3 h-6 w-32 rounded-full" />

          {/* Title */}
          <div className="skeleton-shimmer h-7 w-48 rounded-lg sm:h-8 sm:w-60" />

          {/* Description */}
          <div className="skeleton-shimmer mt-3 h-4 w-60 rounded-md sm:w-72" />
        </div>

        {/* View All */}
        <div className="skeleton-shimmer hidden h-9 w-20 rounded-full sm:block" />
      </div>

      {/* PRODUCT GRID */}
      <div className="relative z-10 grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="
              popular-skeleton-card
              relative
              overflow-hidden
              rounded-2xl
              border
              border-slate-200/70
              bg-white/80
              shadow-[0_8px_30px_rgba(15,23,42,0.06)]
              backdrop-blur-sm
              sm:rounded-[22px]
            "
          >
            {/* Card glow */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -inset-px
                rounded-[inherit]
                bg-gradient-to-r
                from-transparent
                via-indigo-200/30
                to-transparent
                opacity-70
                blur-[1px]
              "
            />

            {/* IMAGE */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/70 sm:h-56 lg:h-64">
              {/* Main shimmer */}
              <div className="skeleton-shimmer absolute inset-0" />

              {/* Fake product image glow */}
              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  h-24
                  w-24
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-2xl
                  bg-white/50
                  shadow-[0_0_55px_rgba(99,102,241,0.14)]
                  backdrop-blur-sm
                  sm:h-28
                  sm:w-28
                "
              />

              {/* Fake popular badge */}
              <div className="skeleton-shimmer absolute left-2.5 top-2.5 h-5 w-20 rounded-full sm:left-3 sm:top-3" />

              {/* Fake image dots */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-slate-900/10 px-2 py-1">
                <div className="skeleton-shimmer h-1.5 w-1.5 rounded-full" />
                <div className="skeleton-shimmer h-1.5 w-1.5 rounded-full" />
                <div className="skeleton-shimmer h-1.5 w-1.5 rounded-full" />
              </div>

              {/* Fake image counter */}
              <div className="skeleton-shimmer absolute bottom-2 right-2 h-5 w-9 rounded-md" />
            </div>

            {/* PRODUCT CONTENT */}
            <div className="relative p-3 sm:p-4">
              {/* Category */}
              <div className="skeleton-shimmer mb-2 h-3 w-20 rounded-full" />

              {/* Product title */}
              <div className="min-h-[38px] space-y-2">
                <div className="skeleton-shimmer h-4 w-full rounded-md" />
                <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
              </div>

              {/* Rating + Views */}
              <div className="mt-3 flex min-h-[18px] items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="skeleton-shimmer h-2.5 w-2.5 rounded-sm"
                    />
                  ))}

                  <div className="skeleton-shimmer ml-1 h-3 w-7 rounded-full" />
                </div>

                <div className="skeleton-shimmer h-3 w-10 rounded-full" />
              </div>

              {/* Price */}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                <div className="skeleton-shimmer h-5 w-20 rounded-md" />
                <div className="skeleton-shimmer h-3 w-14 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SHIMMER ANIMATION */}
      <style>{`
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;

          background:
            linear-gradient(
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

        .skeleton-shimmer::after {
          content: "";

          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.3) 30%,
              rgba(255, 255, 255, 0.8) 50%,
              rgba(165, 180, 252, 0.2) 60%,
              transparent 100%
            );

          transform: translateX(-120%);

          animation:
            popularSkeletonGlow 2.2s ease-in-out infinite;
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

          .skeleton-shimmer {
            background-size: 200% 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer,
          .skeleton-shimmer::after {
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
          p-8
          text-center
        ">

          <FaFire
            className="mx-auto text-red-400 mb-3"
            size={30}
          />

          <h2 className="text-xl font-bold">
            Popular Products
          </h2>

          <p className="text-red-500 mt-2">
            {error}
          </p>

          <button
            onClick={() =>
              fetchPopularProducts({
                showLoader: true,
              })
            }
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
        .pp-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        .pp-products-scroll {
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

        .pp-products-scroll::-webkit-scrollbar {
          display: none;
        }

        .pp-product-item {
          flex: 0 0 190px;
          width: 190px;
          min-width: 190px;
          scroll-snap-align: start;
        }

        .pp-glow {
          position: absolute;
          inset: 0 5% auto;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(
            ellipse,
            rgba(99,102,241,.10),
            transparent 68%
          );
          filter: blur(30px);
          pointer-events: none;
        }

        .pp-line {
          width: 42px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg,#4f46e5,#7c3aed);
        }

        .pp-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(99,102,241,.12);
          border-radius: 24px;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 28px rgba(15,23,42,.045);
          transition:
            transform .32s cubic-bezier(.34,1.2,.64,1),
            box-shadow .28s ease,
            border-color .25s ease;
        }

        .pp-card::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 45;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.78);
        }

        .pp-card:hover {
          transform: translateY(-7px) scale(1.012);
          border-color: rgba(99,102,241,.28);
          // box-shadow:
          //   0 22px 52px rgba(79,70,229,.17),
          //   0 5px 18px rgba(0,0,0,.05);
        }

        .pp-track {
          display: flex;
          width: 100%;
          height: 100%;
          will-change: transform;
          transition: transform .42s cubic-bezier(.22,1,.36,1);
          touch-action: pan-y;
        }

        .pp-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 50% 15%,
              rgba(99,102,241,.10),
              transparent 52%
            ),
            linear-gradient(145deg,#f8faff,#f4f6ff);
        }

        .pp-slide img {
          width: 100%;
          height: 100%;
          padding: 8px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          transition: transform .5s cubic-bezier(.22,1,.36,1);
        }

        .pp-card:hover .pp-slide img {
          transform: scale(1.07);
        }

        .pp-badge {
          position: absolute;
          top: 11px;
          left: 11px;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 999px;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          color: white;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
          box-shadow: 0 5px 14px rgba(79,70,229,.28);
        }

        .pp-dots {
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

        .pp-dot {
          width: 5px;
          height: 5px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #cbd5e1;
          cursor: pointer;
          transition: .2s;
        }

        .pp-dot.active {
          width: 14px;
          background: #4f46e5;
        }

        .pp-count {
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

        .pp-progress {
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

        .pp-progress::after {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,.95);
          transform-origin: left;
          animation: ppProgress 1.4s linear infinite;
        }

        @keyframes ppProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .pp-price {
          background: linear-gradient(135deg,#4f46e5,#2563eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pp-view-all {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(99,102,241,.14);
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          padding: 9px 14px;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 3px 12px rgba(15,23,42,.05);
          transition: .2s;
        }

        .pp-view-all:hover {
          transform: translateY(-1px);
          background: #eef2ff;
          border-color: rgba(99,102,241,.25);
          box-shadow: 0 8px 20px rgba(79,70,229,.10);
        }

        .pp-dot:focus-visible,
        .pp-view-all:focus-visible {
          outline: 2px solid rgba(79,70,229,.45);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .pp-products-scroll {
            gap: 9px;
            padding-bottom: 8px;
            scroll-padding-left: 3px;
          }

          .pp-product-item {
            flex: 0 0 165px;
            width: 165px;
            min-width: 165px;
          }

          .pp-card {
            border-radius: 20px;
          }

          .pp-card:hover {
            transform: translateY(-3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pp-card,
          .pp-track,
          .pp-slide img,
            transition: none !important;
          }
        }
      `}</style>

      <section className="pp-root mx-auto w-full max-w-7xl px-3 py-8 sm:px-5 lg:px-8">
        <div className="pp-glow" />

        <div className="relative z-10 mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 shadow-sm backdrop-blur">
              <FaFire size={10} />
              Trending now
            </div>

            <div className="flex items-center gap-3">
              <div className="pp-line hidden sm:block" />

              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Popular Products
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Most loved products from our community.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="pp-view-all group"
          >
            View All
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>

        <div className="pp-products-scroll relative z-10">
          {products.map((product, index) => {
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

            const views = Number(
              product?.views || 0
            );

            const discount =
              originalPrice > price
                ? Math.round(
                    ((originalPrice - price) /
                      originalPrice) *
                      100
                  )
                : 0;

            return (
              <article
                key={product._id}
                className="pp-card pp-product-item"
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
                    className="pp-track"
                    style={{
                      transform: `translateX(-${
                        activeIdx * 100
                      }%)`,
                    }}
                  >
                    {images.map((image, imageIndex) => (
                      <div
                        key={`${image}-${imageIndex}`}
                        className="pp-slide"
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

                  <span className="pp-badge">
                    <FaFire size={8} className="text-white"/>
                    Popular
                  </span>

                  {hoveredCard === product._id &&
                    images.length > 1 && (
                      <div
                        className="pp-progress"
                        aria-hidden="true"
                      />
                    )}

                  {images.length > 1 && (
                    <>
                      <div className="pp-dots">
                        {images.map((_, imageIndex) => (
                          <button
                            key={imageIndex}
                            type="button"
                            aria-label={`Show image ${
                              imageIndex + 1
                            }`}
                            className={`pp-dot ${
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

                      <div className="pp-count">
                        {activeIdx + 1}/{images.length}
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-500">
                    {product?.category?.name ||
                      "Popular"}
                  </p>

                  <h3
                    onClick={() =>
                      openProduct(product)
                    }
                    className="min-h-[38px] cursor-pointer line-clamp-2 text-[12.5px] font-semibold leading-[1.35] text-slate-800 transition-colors hover:text-indigo-600 sm:text-sm"
                  >
                    {product?.title || "Product"}
                  </h3>

                  <div className=" flex min-h-[18px] items-center justify-between gap-2">
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

                          <span className="ml-1 text-[10px] font-semibold text-slate-500">
                            {rating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                          New
                        </span>
                      )}

                      <span className="text-[9px] text-slate-400">
                        ({product?.numReviews || 0})
                      </span>
                    </div>

                    {views > 0 && (
                      <span
                        className="flex items-center gap-1 text-[9px] font-semibold text-slate-400"
                        title={`${views.toLocaleString("en-IN")} users viewed this product`}
                      >
                        <FaEye size={9} />
                        {views.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div className=" flex items-baseline gap-1.5 border-t border-slate-100 ">
                    <span className="text-sm font-extrabold sm:text-base">
                      <span className="mr-0.5 text-indigo-600">
                        ₹
                      </span>

                      <span className="pp-price">
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