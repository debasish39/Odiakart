import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaStar,
  FaMagic,
  FaEye,
} from "react-icons/fa";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;

/* =====================================================
   CACHE
===================================================== */

const CACHE_KEY = "odikart_new_arrivals";
const CACHE_TIME_KEY = "odikart_new_arrivals_cache_time";

// Cache remains valid for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/* =====================================================
   GET CACHED PRODUCTS
===================================================== */

const getCachedNewArrivals = () => {
  try {
    const cached =
      sessionStorage.getItem(CACHE_KEY);

    const cachedTime =
      sessionStorage.getItem(CACHE_TIME_KEY);

    if (!cached || !cachedTime) {
      return null;
    }

    const age =
      Date.now() - Number(cachedTime);

    if (age > CACHE_DURATION) {
      return null;
    }

    const parsed = JSON.parse(cached);

    return Array.isArray(parsed)
      ? parsed
      : null;
  } catch (error) {
    console.warn(
      "Failed to read New Arrivals cache:",
      error
    );

    return null;
  }
};

/* =====================================================
   SAVE PRODUCTS TO CACHE
===================================================== */

const saveNewArrivalsCache = (products) => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(products)
    );

    sessionStorage.setItem(
      CACHE_TIME_KEY,
      String(Date.now())
    );
  } catch (error) {
    // Storage errors should never break the page.
    console.warn(
      "Failed to save New Arrivals cache:",
      error
    );
  }
};

/* =====================================================
   COMPONENT
===================================================== */

export default function NewArrivalProducts() {
  const navigate = useNavigate();

  /* =====================================================
     INITIAL CACHE
  ===================================================== */

  const cachedProducts =
    getCachedNewArrivals();

  /* =====================================================
     STATE
  ===================================================== */

  const [products, setProducts] =
    useState(cachedProducts || []);

  const [loading, setLoading] =
    useState(!cachedProducts);

  const [error, setError] =
    useState("");

  const [activeIndexes, setActiveIndexes] =
    useState({});

  const [hoveredCard, setHoveredCard] =
    useState(null);

  /* =====================================================
     FETCH NEW ARRIVALS
  ===================================================== */

  const fetchNewArrivals = useCallback(
    async ({ showLoader = false } = {}) => {
      const url =
        `${BACKEND_URL}/api/products/new-arrivals`;

      try {
        /*
          Only show skeleton when explicitly requested.

          When cached products already exist,
          the API refresh happens silently.
        */
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

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `HTTP ${response.status}`
          );
        }

        const list =
          Array.isArray(data?.products)
            ? data.products
            : [];

        /*
          Update UI with fresh products.
        */
        setProducts(list);

        /*
          Save fresh response.
        */
        saveNewArrivalsCache(list);
      } catch (error) {
        console.error(
          "New Arrivals fetch error:",
          error
        );

        /*
          IMPORTANT:

          If cached products are already visible,
          don't replace them with an error.

          This keeps the Home page usable even if
          the background API request fails.
        */
        if (!cachedProducts?.length) {
          setError(
            error?.message ||
              "Failed to load new arrivals"
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [cachedProducts?.length]
  );

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    /*
      If cache exists:
      - show cache immediately
      - refresh API silently

      If cache doesn't exist:
      - show skeleton
      - fetch normally
    */

    fetchNewArrivals({
      showLoader:
        !cachedProducts?.length,
    });
  }, [
    fetchNewArrivals,
    cachedProducts?.length,
  ]);

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

  const getOriginalPrice = (product) => {
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

  const openProduct = (product) => {
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
            ) % imageCount,
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

  const autoSwipe = useCallback(
    (productId, imageCount) => {
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
              (current + 1) %
              imageCount,
          };
        }
      );
    },
    []
  );

  /* =====================================================
     HOVER AUTO IMAGE
  ===================================================== */

  useEffect(() => {
    if (!hoveredCard) {
      return;
    }

    const product =
      products.find(
        (item) =>
          item._id === hoveredCard
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
      <section className="max-w-7xl mx-auto px-1.5 sm:px-4 py-8">

        <div
          className="
            flex
            items-center
            justify-between
            mb-6
          "
        >
          <h2
            className="
              text-xl
              sm:text-3xl
              font-bold
              flex
              items-center
              gap-2
            "
          >
            <FaMagic
              className="text-indigo-500"
            />

            New Arrivals
          </h2>
        </div>

        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            gap-1.5
            sm:gap-3
          "
        >
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  h-72
                  rounded-2xl
                  bg-gray-100
                  animate-pulse
                "
              />
            )
          )}
        </div>

      </section>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">

        <div
          className="
            rounded-2xl
            border
            border-red-100
            bg-red-50
            p-8
            text-center
          "
        >

          <FaMagic
            className="
              mx-auto
              text-red-400
              mb-3
            "
            size={30}
          />

          <h2 className="text-xl font-bold">
            New Arrivals
          </h2>

          <p className="text-red-500 mt-2">
            {error}
          </p>

          <button
            onClick={() =>
              fetchNewArrivals({
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

  /* =====================================================
     UI — COMPACT MODERN NEW ARRIVALS
  ===================================================== */

  return (
    <>
      <style>{`

        .na-root {
          position: relative;
          width: 100%;
        }

        .na-scroll {
          display: flex;
          gap: 10px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 3px 3px 8px;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .na-scroll::-webkit-scrollbar {
          display: none;
        }

        .na-item {
          flex: 0 0 178px;
          width: 178px;
          min-width: 178px;
          scroll-snap-align: start;
        }

        .na-card {
          position: relative;
          overflow: hidden;
          height: 100%;
          border: 1px solid rgba(99,102,241,.10);
          border-radius: 17px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 5px 18px rgba(15,23,42,.055);
          cursor: pointer;
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .2s ease;
        }

        .na-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,.22);
        }

        .na-image {
          position: relative;
          height: 142px;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 50% 20%,
              rgba(99,102,241,.08),
              transparent 55%
            ),
            linear-gradient(
              145deg,
              #fafbff,
              #f1f5ff
            );
        }

        .na-track {
          display: flex;
          width: 100%;
          height: 100%;

          transition:
            transform .35s
            cubic-bezier(.22,1,.36,1);

          touch-action: pan-y;
        }

        .na-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .na-slide img {
          width: 100%;
          height: 100%;
          padding: 7px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;

          transition:
            transform .35s ease;
        }

        .na-card:hover
        .na-slide img {
          transform: scale(1.045);
        }

        .na-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 3;

          display: inline-flex;
          align-items: center;
          gap: 4px;

          padding: 4px 7px;

          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              #4f46e5,
              #7c3aed
            );

          color: #fff;

          font-size: 7px;
          font-weight: 800;
          letter-spacing: .05em;

          box-shadow:
            0 4px 11px
            rgba(79,70,229,.2);
        }

        .na-discount {
          position: absolute;
          right: 8px;
          bottom: 8px;
          z-index: 3;

          padding: 3px 6px;

          border-radius: 6px;

          background:
            rgba(16,185,129,.93);

          color: #fff;

          font-size: 7px;
          font-weight: 800;

          backdrop-filter: blur(6px);
        }

        .na-dots {
          position: absolute;
          left: 50%;
          bottom: 7px;
          z-index: 4;

          display: flex;
          gap: 3px;

          transform:
            translateX(-50%);

          padding: 3px 5px;

          border-radius: 999px;

          background:
            rgba(255,255,255,.84);

          backdrop-filter:
            blur(7px);
        }

        .na-dot {
          width: 4px;
          height: 4px;
          padding: 0;

          border: 0;
          border-radius: 999px;

          background: #cbd5e1;

          cursor: pointer;
        }

        .na-dot.active {
          width: 11px;
          background: #4f46e5;
        }

        .na-count {
          position: absolute;
          right: 7px;
          bottom: 7px;
          z-index: 4;

          padding: 2px 5px;

          border-radius: 5px;

          background:
            rgba(15,23,42,.55);

          color: #fff;

          font-size: 7px;
          font-weight: 700;

          backdrop-filter:
            blur(6px);
        }

        .na-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 5;

          height: 2px;
          overflow: hidden;

          background:
            rgba(255,255,255,.35);
        }

        .na-progress::after {
          content: "";

          display: block;

          width: 100%;
          height: 100%;

          background:
            rgba(255,255,255,.95);

          transform-origin: left;

          animation:
            naProgress
            1.4s linear infinite;
        }

        @keyframes naProgress {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        .na-content {
          padding: 9px 10px 10px;
        }

        .na-category {
          margin-bottom: 3px;

          overflow: hidden;

          color: #6366f1;

          font-size: 7px;
          font-weight: 800;

          letter-spacing: .1em;

          text-transform: uppercase;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .na-title {
          min-height: 32px;

          display: -webkit-box;
          overflow: hidden;

          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;

          color: #1e293b;

          font-size: 11px;
          font-weight: 700;

          line-height: 1.38;
        }

        .na-meta {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 5px;

          min-height: 16px;

          margin-top: 5px;
        }

        .na-rating {
          display: flex;

          align-items: center;

          gap: 3px;

          min-width: 0;
        }

        .na-rating-text {
          color: #475569;

          font-size: 8px;
          font-weight: 800;
        }

        .na-reviews {
          color: #94a3b8;

          font-size: 7px;
        }

        .na-just-in {
          padding: 3px 5px;

          border-radius: 999px;

          background: #eef2ff;

          color: #6366f1;

          font-size: 6.5px;
          font-weight: 800;

          white-space: nowrap;
        }

        .na-price-row {
          display: flex;

          align-items: baseline;

          gap: 5px;

          margin-top: 6px;

          padding-top: 6px;

          border-top:
            1px solid #f1f5f9;
        }

        .na-price {
          font-size: 13px;
          font-weight: 900;

          color: #4f46e5;
        }

        .na-original {
          color: #94a3b8;

          font-size: 7px;
          font-weight: 600;
        }

        .na-view-all {
          display: inline-flex;

          align-items: center;

          gap: 3px;

          flex-shrink: 0;

          border:
            1px solid
            rgba(99,102,241,.14);

          border-radius: 999px;

          padding: 7px 10px;

          background:
            rgba(255,255,255,.92);

          color: #4f46e5;

          font-size: 9px;
          font-weight: 800;

          box-shadow:
            0 3px 10px
            rgba(15,23,42,.045);
        }

        .na-view-all:hover {
          background: #eef2ff;
        }

        @media (max-width: 640px) {

          .na-scroll {
            gap: 8px;
          }

          .na-item {
            flex-basis: 155px;
            width: 155px;
            min-width: 155px;
          }

          .na-image {
            height: 124px;
          }

          .na-content {
            padding: 8px 9px 9px;
          }

          .na-card {
            border-radius: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .na-card,
          .na-track,
          .na-slide img {
            transition: none !important;
          }

          .na-progress::after {
            animation: none;
          }
        }

      `}</style>

      <section
        className="
          na-root
          mx-auto
          w-full
          max-w-7xl
          px-3
          py-5
          sm:px-5
          sm:py-6
          lg:px-8
        "
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            relative
            z-10
            mb-3
            flex
            items-center
            justify-between
            gap-3
          "
        >

          <div className="min-w-0">

            <div
              className="
                mb-1
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-indigo-100
                bg-indigo-50
                px-2
                py-0.5
                text-[7px]
                font-extrabold
                uppercase
                tracking-wider
                text-indigo-600
              "
            >
              <FaMagic size={8} />

              Fresh
            </div>

            <h2
              className="
                flex
                items-center
                gap-2
                text-lg
                font-extrabold
                tracking-tight
                text-slate-900
                sm:text-xl
              "
            >

              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-50
                  text-indigo-500
                "
              >
                <FaMagic size={13} />
              </span>

              New Arrivals

            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-500
                sm:text-[10px]
              "
            >
              Fresh products just added.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/products")
            }
            className="na-view-all"
          >
            View All

            <span aria-hidden="true">
              →
            </span>
          </button>

        </div>

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        <div className="na-scroll">

          {products.map(
            (product) => {

              const images =
                getImages(product);

              const activeIdx =
                activeIndexes[
                  product._id
                ] || 0;

              const price =
                getPrice(product);

              const originalPrice =
                getOriginalPrice(
                  product
                );

              const rating =
                Number(
                  product?.rating
                    ?.average ??
                    product?.rating ??
                    0
                );

              const reviews =
                Number(
                  product?.numReviews ||
                    0
                );

              const discount =
                originalPrice > price &&
                originalPrice > 0
                  ? Math.round(
                      (
                        (originalPrice -
                          price) /
                        originalPrice
                      ) * 100
                    )
                  : 0;

              return (
                <article
                  key={product._id}
                  className="na-item"
                >

                  <div
                    className="na-card"

                    onMouseEnter={() =>
                      setHoveredCard(
                        product._id
                      )
                    }

                    onMouseLeave={() =>
                      setHoveredCard(
                        (current) =>
                          current ===
                          product._id
                            ? null
                            : current
                      )
                    }
                  >

                    {/* =================================================
                        IMAGE
                    ================================================= */}

                    <div
                      className="na-image"

                      onTouchStart={(
                        event
                      ) => {

                        event.currentTarget
                          .dataset
                          .touchX =
                          event.touches[0]
                            .clientX;

                        setHoveredCard(
                          product._id
                        );
                      }}

                      onTouchEnd={(
                        event
                      ) => {

                        const start =
                          Number(
                            event
                              .currentTarget
                              .dataset
                              .touchX || 0
                          );

                        const end =
                          event
                            .changedTouches[0]
                            .clientX;

                        const distance =
                          start - end;

                        if (
                          Math.abs(
                            distance
                          ) > 45
                        ) {
                          changeImage(
                            event,
                            product._id,
                            images.length,
                            distance > 0
                              ? 1
                              : -1
                          );
                        }

                        setHoveredCard(
                          (current) =>
                            current ===
                            product._id
                              ? null
                              : current
                        );
                      }}

                      onTouchCancel={() =>
                        setHoveredCard(
                          (current) =>
                            current ===
                            product._id
                              ? null
                              : current
                        )
                      }
                    >

                      {/* =================================================
                          IMAGE TRACK
                      ================================================= */}

                      <div
                        className="na-track"

                        style={{
                          transform:
                            `translateX(-${
                              activeIdx * 100
                            }%)`,
                        }}
                      >

                        {images.map(
                          (
                            image,
                            imageIndex
                          ) => (

                            <div
                              key={`${image}-${imageIndex}`}
                              className="na-slide"

                              onClick={() =>
                                openProduct(
                                  product
                                )
                              }
                            >

                              <img
                                src={image}

                                alt={`
                                  ${
                                    product?.title ||
                                    "Product"
                                  } image ${
                                    imageIndex + 1
                                  }
                                `}

                                loading="lazy"

                                decoding="async"

                                draggable="false"
                              />

                            </div>

                          )
                        )}

                      </div>

                      {/* =================================================
                          NEW BADGE
                      ================================================= */}

                      <span className="na-badge">

                        <FaMagic size={7} />

                        NEW

                      </span>

                      {/* =================================================
                          DISCOUNT
                      ================================================= */}

                      {/*
                      {discount > 0 && (
                        <span className="na-discount">
                          {discount}% OFF
                        </span>
                      )}
                      */}

                      {/* =================================================
                          AUTO-SWIPE PROGRESS
                      ================================================= */}

                      {hoveredCard ===
                        product._id &&
                        images.length > 1 && (
                          <div
                            className="na-progress"
                            aria-hidden="true"
                          />
                        )}

                      {/* =================================================
                          IMAGE DOTS
                      ================================================= */}

                      {images.length > 1 && (
                        <>
                          <div className="na-dots">

                            {images.map(
                              (
                                _,
                                imageIndex
                              ) => (

                                <button
                                  key={
                                    imageIndex
                                  }

                                  type="button"

                                  aria-label={`Show image ${
                                    imageIndex + 1
                                  }`}

                                  className={`
                                    na-dot
                                    ${
                                      activeIdx ===
                                      imageIndex
                                        ? "active"
                                        : ""
                                    }
                                  `}

                                  onClick={(
                                    event
                                  ) =>
                                    goToImage(
                                      event,
                                      product._id,
                                      imageIndex
                                    )
                                  }
                                />

                              )
                            )}

                          </div>

                          {/* IMAGE COUNT */}

                          <div className="na-count">

                            {activeIdx + 1}
                            /
                            {images.length}

                          </div>
                        </>
                      )}

                    </div>

                    {/* =================================================
                        PRODUCT CONTENT
                    ================================================= */}

                    <div className="na-content">

                      {/* CATEGORY */}

                      <p className="na-category">
                        {
                          product
                            ?.category
                            ?.name ||
                          "New Arrival"
                        }
                      </p>

                      {/* TITLE */}

                      <h3
                        className="
                          na-title
                          cursor-pointer
                        "

                        onClick={() =>
                          openProduct(
                            product
                          )
                        }
                      >
                        {
                          product?.title ||
                          "Product"
                        }
                      </h3>

                      {/* =================================================
                          RATING
                      ================================================= */}

                      <div className="na-meta">

                        <div className="na-rating">

                          {rating > 0 ? (
                            <>
                              <FaStar
                                className="
                                  text-amber-400
                                "
                                size={8}
                              />

                              <span className="na-rating-text">
                                {rating.toFixed(
                                  1
                                )}
                              </span>

                              <span className="na-reviews">
                                ({reviews})
                              </span>
                            </>
                          ) : (
                            <span
                              className="
                                rounded
                                bg-slate-50
                                px-1.5
                                py-0.5
                                text-[7px]
                                font-bold
                                text-slate-400
                              "
                            >
                              New
                            </span>
                          )}

                        </div>

                        <span className="na-just-in">
                          JUST IN
                        </span>

                      </div>

                      {/* =================================================
                          PRICE
                      ================================================= */}

                      <div className="na-price-row">

                        <span className="na-price">
                          ₹
                          {price.toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {originalPrice >
                          price && (
                          <del className="na-original">
                            ₹
                            {originalPrice.toLocaleString(
                              "en-IN"
                            )}
                          </del>
                        )}

                      </div>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>
    </>
  );
}