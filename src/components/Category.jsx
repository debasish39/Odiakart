import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const CATEGORY_CACHE_KEY = "odikart_categories";
const CATEGORY_CACHE_TIME_KEY = "odikart_categories_cache_time";

// Cache for 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

/* =========================================================
   GET CACHED CATEGORIES
========================================================= */

const getCachedCategories = () => {
  try {
    const cached = sessionStorage.getItem(CATEGORY_CACHE_KEY);
    const cachedTime = sessionStorage.getItem(
      CATEGORY_CACHE_TIME_KEY
    );

    if (!cached || !cachedTime) {
      return null;
    }

    const age = Date.now() - Number(cachedTime);

    if (age > CACHE_DURATION) {
      return null;
    }

    const parsed = JSON.parse(cached);

    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn("CATEGORY CACHE READ ERROR:", error);
    return null;
  }
};

/* =========================================================
   SAVE CATEGORIES TO CACHE
========================================================= */

const saveCategoriesToCache = (categories) => {
  try {
    sessionStorage.setItem(
      CATEGORY_CACHE_KEY,
      JSON.stringify(categories)
    );

    sessionStorage.setItem(
      CATEGORY_CACHE_TIME_KEY,
      String(Date.now())
    );
  } catch (error) {
    console.warn("CATEGORY CACHE SAVE ERROR:", error);
  }
};

/* =========================================================
   NORMALIZE CATEGORY RESPONSE
========================================================= */

const normalizeCategories = (data) => {
  const received = Array.isArray(data?.categories)
    ? data.categories
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return received
    .filter(
      (category) =>
        category?.isActive !== false &&
        (category?.parentCategory === null ||
          category?.parentCategory === undefined)
    )
    .sort(
      (a, b) =>
        (a?.displayOrder || 0) -
        (b?.displayOrder || 0)
    );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Category() {
  const navigate = useNavigate();

  const cachedCategories = getCachedCategories();

  const [categories, setCategories] = useState(
    cachedCategories || []
  );

  // If cache exists, don't show skeleton
  const [loading, setLoading] = useState(
    !cachedCategories
  );

  const [error, setError] = useState("");

  /* =====================================================
     FETCH CATEGORIES
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        // Only show loading if there is no cached data
        if (!cachedCategories) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${BACKEND_URL}/api/category`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load categories"
          );
        }

        const parents = normalizeCategories(data);

        if (!mounted) {
          return;
        }

        setCategories(parents);

        // Save fresh data
        saveCategoriesToCache(parents);

      } catch (err) {
        console.error(
          "CATEGORY ERROR:",
          err
        );

        if (!mounted) {
          return;
        }

        /*
         * If cached data exists, keep showing it.
         * Don't replace good cached content with an error.
         */
        if (!cachedCategories) {
          setError(
            err?.message ||
              "Unable to load categories"
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     CATEGORY CLICK
  ===================================================== */

  const handleCategoryClick = (category) => {
    if (!category?._id) {
      return;
    }

    navigate(
      `/products?category=${encodeURIComponent(
        category._id
      )}`
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <section className="category-skeleton-section relative w-full overflow-hidden bg-white py-4 sm:py-6">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-0 h-32 w-32 rounded-full bg-indigo-300/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-0 h-36 w-36 rounded-full bg-purple-300/10 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-3">

          {/* CATEGORY HEADER */}
          <div className="mb-4 flex items-center justify-between">
            <div className="category-skeleton-shimmer h-5 w-32 rounded-md sm:h-6 sm:w-40" />

            <div className="category-skeleton-shimmer hidden h-4 w-16 rounded-full sm:block" />
          </div>

          {/* CATEGORY SCROLLER */}
          <div
            className="
              flex
              gap-4
              overflow-hidden
              pb-1
            "
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (item) => (
                <div
                  key={item}
                  className="
                    category-skeleton-item
                    flex
                    w-[58px]
                    min-w-[58px]
                    flex-col
                    items-center
                    gap-1
                  "
                >
                  {/* Category circle */}
                  <div
                    className="
                      category-skeleton-shimmer
                      relative
                      h-12
                      w-12
                      rounded-full
                      border
                      border-slate-100
                      sm:h-[52px]
                      sm:w-[52px]
                    "
                  >
                    <div
                      aria-hidden="true"
                      className="
                        pointer-events-none
                        absolute
                        inset-1.5
                        rounded-full
                        bg-white/30
                        blur-sm
                      "
                    />
                  </div>

                  {/* Category name */}
                  <div className="category-skeleton-shimmer h-2.5 w-12 rounded-full" />
                </div>
              )
            )}
          </div>
        </div>

        <style>{`
          .category-skeleton-shimmer {
            position: relative;
            overflow: hidden;

            background:
              linear-gradient(
                110deg,
                #f1f5f9 8%,
                #f8fafc 18%,
                #e8edff 30%,
                #f8fafc 42%,
                #eef2f7 58%
              );

            background-size: 250% 100%;

            animation:
              categorySkeletonShimmer
              1.8s
              ease-in-out
              infinite;

            box-shadow:
              inset 0 0 12px
              rgba(255, 255, 255, 0.65),
              0 0 12px
              rgba(99, 102, 241, 0.025);
          }

          .category-skeleton-shimmer::after {
            content: "";

            position: absolute;
            inset: 0;

            background:
              linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.25) 28%,
                rgba(255, 255, 255, 0.85) 50%,
                rgba(165, 180, 252, 0.2) 62%,
                transparent 100%
              );

            transform:
              translateX(-120%);

            animation:
              categorySkeletonGlow
              2.2s
              ease-in-out
              infinite;
          }

          @keyframes categorySkeletonShimmer {
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

          @keyframes categorySkeletonGlow {
            0% {
              transform:
                translateX(-120%);
            }

            55%,
            100% {
              transform:
                translateX(120%);
            }
          }

          @media (max-width: 640px) {
            .category-skeleton-shimmer {
              background-size: 200% 100%;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .category-skeleton-shimmer,
            .category-skeleton-shimmer::after {
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
      <section className="px-3 py-4">
        <div
          className="
            rounded-xl
            bg-gray-50
            p-4
            text-center
          "
        >
          <p className="text-xs font-bold text-gray-800">
            Categories unavailable
          </p>

          <p className="mt-1 text-[10px] text-gray-500">
            {error}
          </p>
        </div>
      </section>
    );
  }

  /* =====================================================
     NO CATEGORIES
  ===================================================== */

  if (!categories.length) {
    return null;
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-7xl
        border-b
        border-gray-100
        bg-white
        py-9
      "
    >
      <div className="px-3">

        {/* CATEGORY TITLE */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-900">
            Shop by Category
          </h2>
        </div>

        {/* HORIZONTAL CATEGORY SCROLL */}
        <div
          className="
            flex
            gap-4
            overflow-x-auto
            pb-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {categories.map((category) => {
            const name =
              category?.name
                ?.replace(/-/g, " ")
                ?.trim() ||
              "Category";

            return (
              <button
                key={category?._id}
                type="button"
                onClick={() =>
                  handleCategoryClick(category)
                }
                aria-label={`View ${name} products`}
                className="
                  group
                  flex
                  w-[58px]
                  min-w-[58px]
                  flex-col
                  items-center
                  gap-1
                  outline-none
                "
              >
                {/* CATEGORY IMAGE */}
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border
                    border-gray-100
                    bg-gray-50
                    transition
                    duration-200
                    group-hover:border-indigo-300
                    group-hover:bg-indigo-50
                    group-active:scale-90
                  "
                >
                  {category?.image ? (
                    <img
                      src={category.image}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className="
                        h-full
                        w-full
                        object-contain
                        p-1.5
                      "
                    />
                  ) : (
                    <span className="text-lg">
                      🛍️
                    </span>
                  )}
                </div>

                {/* CATEGORY NAME */}
                <span
                  className="
                    w-full
                    truncate
                    text-center
                    text-[9px]
                    font-semibold
                    capitalize
                    text-gray-600
                    transition
                    group-hover:text-indigo-600
                  "
                >
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}