import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaStar,
  FaGem,
  FaEye,
} from "react-icons/fa";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;



/* =====================================================
   CACHE
===================================================== */

const FEATURED_CACHE_KEY =
  "odikart_featured_products";

const FEATURED_CACHE_TIME_KEY =
  "odikart_featured_products_cache_time";

const FEATURED_CACHE_DURATION =
  5 * 60 * 1000;


/* =====================================================
   CACHE HELPERS
===================================================== */

const getCachedFeaturedProducts = () => {
  try {
    const cached =
      sessionStorage.getItem(
        FEATURED_CACHE_KEY
      );

    const cachedTime =
      sessionStorage.getItem(
        FEATURED_CACHE_TIME_KEY
      );

    if (!cached || !cachedTime) {
      return null;
    }

    const parsed =
      JSON.parse(cached);

    return Array.isArray(parsed)
      ? parsed
      : null;

  } catch (error) {
    console.warn(
      "FEATURED CACHE READ ERROR:",
      error
    );

    return null;
  }
};


const saveFeaturedProductsCache = (
  products
) => {
  try {
    sessionStorage.setItem(
      FEATURED_CACHE_KEY,
      JSON.stringify(products)
    );

    sessionStorage.setItem(
      FEATURED_CACHE_TIME_KEY,
      String(Date.now())
    );

  } catch (error) {
    console.warn(
      "FEATURED CACHE SAVE ERROR:",
      error
    );
  }
};


export default function FeaturedProducts() {
  const navigate = useNavigate();

  /*
   * Read the cache during the initial render.
   * This lets Featured Products appear immediately
   * when the user returns from a product page.
   */
  const cachedProducts =
    getCachedFeaturedProducts();


  const [products, setProducts] =
    useState(
      cachedProducts || []
    );

  /*
   * Only show the skeleton when there is
   * no cached content available.
   */
  const [loading, setLoading] =
    useState(
      !cachedProducts
    );

  const [error, setError] =
    useState("");


  /* =====================================================
     FETCH FEATURED PRODUCTS
  ===================================================== */

  const fetchFeaturedProducts =
    useCallback(
      async ({
        showLoader = false,
      } = {}) => {

        const url =
          `${BACKEND_URL}/api/products/featured`;

        try {

          /*
           * Background refresh does not clear
           * the currently visible cached products.
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

          /*
           * Replace visible data with
           * the fresh API response.
           */
          setProducts(list);

          /*
           * Save it for the next Home visit.
           */
          saveFeaturedProductsCache(list);

        } catch (error) {

          console.error(
            "FEATURED PRODUCTS ERROR:",
            error
          );

          /*
           * If cached products are visible,
           * keep them instead of replacing the
           * whole section with an error.
           */
          if (!products.length) {
            setError(
              error?.message ||
                "Failed to load featured products"
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
     *   show skeleton + fetch
     *
     * Cache:
     *   show cached products immediately
     *   + refresh silently in background
     */
    fetchFeaturedProducts({
      showLoader:
        !cachedProducts,
    });

  }, []);


  /* =====================================================
     IMAGE
  ===================================================== */

  const getImage = (product) => {
    return (
      product?.media?.thumbnail ||
      product?.media?.images?.[0] ||
      product?.variants?.[0]?.images?.[0] ||
      "https://via.placeholder.com/400x400?text=Product"
    );
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
      <section className="max-w-7xl mx-auto px-1.5 sm:px-4 py-8">

        <div className="
          flex
          items-center
          justify-between
          mb-6
        ">
          <h2 className="
            text-xl
            sm:text-3xl
            font-bold
            flex
            items-center
            gap-2
          ">
            <FaGem className="text-purple-500" />
            Featured Products
          </h2>
        </div>

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          lg:grid-cols-4
          gap-1.5
          sm:gap-3
        ">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="
                h-72
                rounded-2xl
                bg-gray-100
                animate-pulse
              "
            />
          ))}
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

        <div className="
          rounded-2xl
          border
          border-red-100
          bg-red-50
          p-8
          text-center
        ">

          <FaGem
            className="mx-auto text-red-400 mb-3"
            size={30}
          />

          <h2 className="text-xl font-bold">
            Featured Products
          </h2>

          <p className="text-red-500 mt-2">
            {error}
          </p>

          <button
            onClick={() =>
              fetchFeaturedProducts({
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
     UI
  ===================================================== */

  return (
    <>
      <style>{`
        .fp-root {
          position: relative;
          width: 100%;
        }

        .fp-scroll {
          display: flex;
          gap: 12px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 3px 10px;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .fp-scroll::-webkit-scrollbar {
          display: none;
        }

        .fp-item {
          flex: 0 0 190px;
          width: 190px;
          min-width: 190px;
          scroll-snap-align: start;
        }

        .fp-card {
          position: relative;
          overflow: hidden;
          height: 100%;
          border: 1px solid rgba(124, 58, 237, .10);
          border-radius: 20px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 7px 24px rgba(15,23,42,.055);
          cursor: pointer;
          transition:
            transform .28s cubic-bezier(.34,1.2,.64,1),
            box-shadow .28s ease,
            border-color .2s ease;
        }

        .fp-card:hover {
          transform: translateY(-5px);
          border-color: rgba(124,58,237,.22);
          box-shadow: 0 16px 38px rgba(15,23,42,.10);
        }

        .fp-image-wrap {
          position: relative;
          height: clamp(135px, 16vw, 175px);
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 15%, rgba(124,58,237,.10), transparent 54%),
            linear-gradient(145deg,#faf8ff,#f5f3ff);
        }

        .fp-image {
          width: 100%;
          height: 100%;
          padding: 9px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          transition: transform .45s cubic-bezier(.22,1,.36,1);
        }

        .fp-card:hover .fp-image {
          transform: scale(1.06);
        }

        .fp-badge {
          position: absolute;
          top: 9px;
          left: 9px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 8px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 999px;
          background: linear-gradient(135deg,#7c3aed,#ec4899);
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .05em;
          box-shadow: 0 5px 14px rgba(124,58,237,.22);
        }

        .fp-discount {
          position: absolute;
          right: 9px;
          bottom: 9px;
          z-index: 2;
          padding: 4px 7px;
          border-radius: 7px;
          background: rgba(22,163,74,.92);
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          backdrop-filter: blur(7px);
        }

        .fp-content {
          padding: 11px 12px 12px;
        }

        .fp-category {
          margin-bottom: 4px;
          overflow: hidden;
          color: #7c3aed;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .fp-title {
          min-height: 34px;
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
          transition: color .2s ease;
        }

        .fp-card:hover .fp-title {
          color: #7c3aed;
        }

        .fp-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          min-height: 18px;
          margin-top: 7px;
        }

        .fp-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }

        .fp-rating-text {
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .fp-reviews,
        .fp-views {
          color: #94a3b8;
          font-size: 8px;
        }

        .fp-views {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          white-space: nowrap;
        }

        .fp-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .fp-price {
          font-size: 14px;
          font-weight: 900;
          color: #7c3aed;
        }

        .fp-original {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 600;
        }

        .fp-view-all {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1px solid rgba(124,58,237,.14);
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255,255,255,.92);
          color: #7c3aed;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 3px 12px rgba(15,23,42,.045);
          transition: .2s ease;
        }

        .fp-view-all:hover {
          transform: translateY(-1px);
          background: #faf5ff;
          border-color: rgba(124,58,237,.24);
        }

        .fp-view-all:focus-visible {
          outline: 2px solid rgba(124,58,237,.4);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .fp-item {
            flex-basis: 165px;
            width: 165px;
            min-width: 165px;
          }

          .fp-card {
            border-radius: 17px;
          }

          .fp-content {
            padding: 10px;
          }

          .fp-card:hover {
            transform: translateY(-2px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fp-card,
          .fp-image {
            transition: none !important;
          }

          .fp-scroll {
            scroll-behavior: auto;
          }
        }
      `}</style>

      <section className="fp-root mx-auto w-full max-w-7xl px-3 py-7 sm:px-5 lg:px-8">
        <div className="relative z-10 mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50/80 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-purple-600">
              <FaGem size={9} />
              Handpicked
            </div>

            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-500 sm:h-9 sm:w-9">
                <FaGem size={15} />
              </span>
              Featured Products
            </h2>

            <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
              Handpicked products worth discovering.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="fp-view-all shrink-0"
          >
            View All
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="fp-scroll">
          {products.map((product) => {
            const price = getPrice(product);
            const originalPrice = getOriginalPrice(product);

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

            const discount =
              originalPrice > price && originalPrice > 0
                ? Math.round(
                    ((originalPrice - price) / originalPrice) * 100
                  )
                : 0;

            return (
              <article
                key={product._id}
                className="fp-item"
              >
                <div
                  className="fp-card"
                  onClick={() => openProduct(product)}
                >
                  <div className="fp-image-wrap">
                    <img
                      src={getImage(product)}
                      alt={product?.title || "Product"}
                      className="fp-image"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />

                    <span className="fp-badge">
                      <FaGem size={8} />
                      FEATURED
                    </span>

                    {discount > 0 && (
                      <span className="fp-discount">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="fp-content">
                    <p className="fp-category">
                      {product?.category?.name || "Featured"}
                    </p>

                    <h3 className="fp-title">
                      {product?.title || "Product"}
                    </h3>

                    <div className="fp-meta">
                      <div className="fp-rating">
                        <FaStar className="text-amber-400" size={9} />

                        <span className="fp-rating-text">
                          {rating > 0 ? rating.toFixed(1) : "New"}
                        </span>

                        <span className="fp-reviews">
                          ({reviews})
                        </span>
                      </div>

                      {views > 0 && (
                        <span
                          className="fp-views"
                          title={`${views.toLocaleString("en-IN")} views`}
                        >
                          <FaEye size={9} />
                          {views.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <div className="fp-price-row">
                      <span className="fp-price">
                        ₹{price.toLocaleString("en-IN")}
                      </span>

                      {originalPrice > price && (
                        <del className="fp-original">
                          ₹{originalPrice.toLocaleString("en-IN")}
                        </del>
                      )}
                    </div>
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
