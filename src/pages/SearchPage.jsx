import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaChevronRight,
  FaChevronDown,
  FaClock,
  FaFire,
  FaStar,
  FaShoppingBag,
} from "react-icons/fa";

import { getData } from "../context/DataContext";

export default function SearchPage() {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  /* =========================================================
     DATA CONTEXT
     ========================================================= */

  const {
    filteredData = [],
    categoryOnlyData = [],
    brandOnlyData = [],
    search,
    setSearch,
    loading,
    error,
  } = getData();

  /* =========================================================
     URL SEARCH
     ========================================================= */

  const urlSearch =
    searchParams.get("search") || "";

  /* =========================================================
     LOCAL INPUT
     ========================================================= */

  const [
    searchInput,
    setSearchInput,
  ] = useState(urlSearch);

  const [
    sort,
    setSort,
  ] = useState("default");

  const [
    recentSearches,
    setRecentSearches,
  ] = useState([]);

  /* =========================================================
     HELPERS
     ========================================================= */

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .trim();

  const getProductName = (product) =>
    product?.name ||
    product?.title ||
    product?.productName ||
    product?.product_title ||
    "Untitled Product";

  const getProductCategory = (product) => {
    const category = product?.category;

    if (typeof category === "string") {
      return category;
    }

    if (
      category &&
      typeof category === "object"
    ) {
      return (
        category?.name ||
        category?.title ||
        category?.category ||
        ""
      );
    }

    return (
      product?.categoryName ||
      product?.category_name ||
      ""
    );
  };

  const getProductSubCategory = (product) => {
    const subCategory =
      product?.subCategory ||
      product?.subcategory;

    if (typeof subCategory === "string") {
      return subCategory;
    }

    if (
      subCategory &&
      typeof subCategory === "object"
    ) {
      return (
        subCategory?.name ||
        subCategory?.title ||
        ""
      );
    }

    return "";
  };

  const getProductBrand = (product) => {
    const brand = product?.brand;

    if (typeof brand === "string") {
      return brand;
    }

    if (
      brand &&
      typeof brand === "object"
    ) {
      return (
        brand?.name ||
        brand?.title ||
        ""
      );
    }

    return (
      product?.brandName ||
      product?.brand_name ||
      ""
    );
  };

  const getProductPrice = (product) =>
    Number(
      product?.displayPrice ??
      product?.price ??
      product?.sellingPrice ??
      product?.selling_price ??
      0
    );

  const getProductRating = (product) =>
    Number(
      product?.rating ??
      product?.ratings ??
      product?.averageRating ??
      0
    );

  const getProductImage = (product) => {
    if (product?.image) {
      return product.image;
    }

    if (product?.imageUrl) {
      return product.imageUrl;
    }

    if (product?.image_url) {
      return product.image_url;
    }

    if (product?.thumbnail) {
      return product.thumbnail;
    }

    if (
      Array.isArray(product?.images) &&
      product.images.length > 0
    ) {
      const firstImage =
        product.images[0];

      if (
        typeof firstImage ===
        "string"
      ) {
        return firstImage;
      }

      if (
        firstImage &&
        typeof firstImage ===
          "object"
      ) {
        return (
          firstImage?.url ||
          firstImage?.image ||
          firstImage?.src ||
          ""
        );
      }
    }

    return "";
  };

  const getProductId = (product) =>
    product?._id ??
    product?.id ??
    product?.productId ??
    null;

  /* =========================================================
     SYNC URL -> SEARCH CONTEXT
     ========================================================= */

  useEffect(() => {
    const value =
      searchParams.get("search") || "";

    setSearchInput(value);
    setSearch(value);
  }, [
    searchParams,
    setSearch,
  ]);

  /* =========================================================
     LOAD RECENT SEARCHES
     ========================================================= */

  useEffect(() => {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "recentSearches"
          ) || "[]"
        );

      if (Array.isArray(saved)) {
        setRecentSearches(saved);
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  /* =========================================================
     ACTIVE QUERY
     ========================================================= */

  const activeQuery =
    normalize(search);

  /* =========================================================
     PRODUCTS
     
     IMPORTANT:
     DataContext exposes filteredData, NOT products.
     
     filteredData is already filtered by:
     - backend search
     - category
     - subCategory
     - brand
     - price
     ========================================================= */

  const searchResults = useMemo(() => {
    if (!activeQuery) {
      return [];
    }

    return Array.isArray(filteredData)
      ? filteredData
      : [];
  }, [
    filteredData,
    activeQuery,
  ]);

  /* =========================================================
     SORT RESULTS
     ========================================================= */

  const sortedResults = useMemo(() => {
    const result = [
      ...searchResults,
    ];

    switch (sort) {
      case "low-high":
        result.sort(
          (a, b) =>
            getProductPrice(a) -
            getProductPrice(b)
        );
        break;

      case "high-low":
        result.sort(
          (a, b) =>
            getProductPrice(b) -
            getProductPrice(a)
        );
        break;

      case "rating":
        result.sort(
          (a, b) =>
            getProductRating(b) -
            getProductRating(a)
        );
        break;

      default:
        break;
    }

    return result;
  }, [
    searchResults,
    sort,
  ]);

  /* =========================================================
     CATEGORY RESULTS
     ========================================================= */

  const categoryResults = useMemo(() => {
    if (!activeQuery) {
      return [];
    }

    return (
      Array.isArray(categoryOnlyData)
        ? categoryOnlyData
        : []
    )
      .filter((item) => {
        const name =
          typeof item === "string"
            ? item
            : item?.name ||
              item?.category ||
              "";

        return normalize(name).includes(
          activeQuery
        );
      })
      .slice(0, 6);
  }, [
    categoryOnlyData,
    activeQuery,
  ]);

  /* =========================================================
     BRAND RESULTS
     ========================================================= */

  const brandResults = useMemo(() => {
    if (!activeQuery) {
      return [];
    }

    return (
      Array.isArray(brandOnlyData)
        ? brandOnlyData
        : []
    )
      .filter((item) => {
        const name =
          typeof item === "string"
            ? item
            : item?.name ||
              item?.brand ||
              "";

        return normalize(name).includes(
          activeQuery
        );
      })
      .slice(0, 6);
  }, [
    brandOnlyData,
    activeQuery,
  ]);

  /* =========================================================
     SUGGESTIONS
     ========================================================= */

  const suggestions = useMemo(() => {
    const value =
      normalize(searchInput);

    if (!value) {
      return [];
    }

    const values = (
      Array.isArray(filteredData)
        ? filteredData
        : []
    ).flatMap((product) => [
      getProductName(product),
      getProductCategory(product),
      getProductBrand(product),
    ]);

    return [
      ...new Set(
        values.filter(
          (item) =>
            item &&
            normalize(item).includes(
              value
            )
        )
      ),
    ].slice(0, 8);
  }, [
    filteredData,
    searchInput,
  ]);

  /* =========================================================
     SAVE RECENT SEARCH
     ========================================================= */

  const saveRecentSearch = (value) => {
    const cleaned =
      String(value || "").trim();

    if (!cleaned) {
      return;
    }

    const updated = [
      cleaned,

      ...recentSearches.filter(
        (item) =>
          normalize(item) !==
          normalize(cleaned)
      ),
    ].slice(0, 8);

    setRecentSearches(updated);

    try {
      localStorage.setItem(
        "recentSearches",
        JSON.stringify(updated)
      );
    } catch {
      // Ignore
    }
  };

  /* =========================================================
     EXECUTE SEARCH
     ========================================================= */

  const executeSearch = (
    value = searchInput
  ) => {
    const cleaned =
      String(value || "").trim();

    if (!cleaned) {
      setSearchInput("");
      setSearch("");
      setSearchParams({});
      return;
    }

    saveRecentSearch(cleaned);

    setSearchInput(cleaned);

    /*
     * Update DataContext.
     * This triggers:
     *
     * GET /api/products?search=cleaned
     */
    setSearch(cleaned);

    /*
     * Stay on dedicated search page.
     */
    setSearchParams({
      search: cleaned,
    });
  };

  /* =========================================================
     CLEAR SEARCH
     ========================================================= */

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setSearchParams({});
  };

  /* =========================================================
     POPULAR SEARCHES
     ========================================================= */

  const popularSearches = [
    "Shoes",
    "T-Shirts",
    "Watches",
    "Bags",
    "Headphones",
    "Mobiles",
  ];

  /* =========================================================
     FORMAT PRICE
     ========================================================= */

  const formatPrice = (value) =>
    `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;

  /* =========================================================
     PRODUCT CARD
     ========================================================= */

  const ProductCard = ({
    product,
  }) => {
    const name =
      getProductName(product);

    const price =
      getProductPrice(product);

    const rating =
      getProductRating(product);

    const image =
      getProductImage(product);

    const productId =
      getProductId(product);

    const brand =
      getProductBrand(product);

    const category =
      getProductCategory(product);

    return (
      <button
        type="button"
        onClick={() => {
          if (!productId) {
            console.warn(
              "⚠️ Product ID missing:",
              product
            );
            return;
          }

          navigate(
            `/products/${productId}`
          );
        }}
        className="
          group
          w-full
          overflow-hidden
          rounded-[1.45rem]
          border border-slate-200/80
          bg-white
          text-left
          shadow-[0_7px_25px_rgba(15,23,42,.055)]
          transition-all duration-300 ease-out
          hover:border-indigo-200
          hover:shadow-[0_20px_50px_rgba(79,70,229,.13)]
          active:scale-[0.985]
          sp-card
        "
      >
        {/* IMAGE */}

        <div
          className="
            relative
            aspect-square
            overflow-hidden
            bg-[linear-gradient(135deg,#f8fafc,#eef2ff)]
            ring-1 ring-inset ring-slate-100
          "
        >
          {image ? (
            <img
              src={image}
              alt={name}
              className="
                h-full
                w-full
                object-contain
                p-3
                transition-transform duration-700 ease-out
                group-hover:scale-[1.08]
              "
              loading="lazy"
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-slate-300
              "
            >
              <FaShoppingBag
                size={30}
              />
            </div>
          )}
        </div>

        {/* CONTENT */}

        <div className="p-3">
          <p
            className="
              line-clamp-2
              min-h-[32px]
              text-[11px]
              font-bold
              leading-4
              text-slate-800
            "
          >
            {name}
          </p>

          {brand && (
            <p
              className="
                mt-1
                truncate
                text-[9px]
                font-semibold
                text-slate-400
              "
            >
              {brand}
            </p>
          )}

          {!brand &&
            category && (
              <p
                className="
                  mt-1
                  truncate
                  text-[9px]
                  font-semibold
                  text-slate-400
                "
              >
                {category}
              </p>
            )}

          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              gap-2
            "
          >
            <span
              className="
                text-[15px]
                font-black
                tracking-tight
                text-slate-950
              "
            >
              {formatPrice(price)}
            </span>

            {rating > 0 && (
              <span
                className="
                  flex
                  items-center
                  gap-1
                  rounded-full
                  border border-emerald-100
                  bg-emerald-50
                  px-2 py-1
                  text-[8px]
                  font-black
                  text-emerald-700
                "
              >
                {rating.toFixed(1)}

                <FaStar size={7} />
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  /* =========================================================
     LOADING SKELETON
     ========================================================= */

  const LoadingSkeleton = () => (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
      "
    >
      {Array.from({
        length: 10,
      }).map((_, index) => (
        <div
          key={index}
          className="
            overflow-hidden
            rounded-[1.45rem]
            border border-slate-200/80
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              aspect-square
              search-page-skeleton
              bg-slate-100
            "
          />

          <div
            className="
              space-y-2
              p-3
            "
          >
            <div
              className="
                h-3
                w-4/5
                sp-skeleton rounded
              "
            />

            <div
              className="
                h-3
                w-2/5
                sp-skeleton rounded
              "
            />

            <div
              className="
                h-4
                w-1/3
                sp-skeleton rounded
              "
            />
          </div>
        </div>
      ))}
    </div>
  );

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_34%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)]
        pb-10
      "
    >

      <style>{`
        @keyframes searchPageFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes searchPagePop {
          0% { opacity: 0; transform: translateY(8px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes searchPageShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes searchPagePulse {
          0%, 100% { opacity: .55; transform: scale(.96); }
          50% { opacity: 1; transform: scale(1); }
        }
        .search-page-animate { animation: searchPageFadeUp .42s cubic-bezier(.22,1,.36,1) both; }
        .search-page-pop { animation: searchPagePop .34s cubic-bezier(.22,1,.36,1) both; }
        .search-page-stagger > * { animation: searchPageFadeUp .45s cubic-bezier(.22,1,.36,1) both; }
        .search-page-stagger > *:nth-child(2) { animation-delay: 45ms; }
        .search-page-stagger > *:nth-child(3) { animation-delay: 90ms; }
        .search-page-stagger > *:nth-child(4) { animation-delay: 135ms; }
        .search-page-stagger > *:nth-child(5) { animation-delay: 180ms; }
        .search-page-stagger > *:nth-child(6) { animation-delay: 225ms; }
        .search-page-card { transform: translateZ(0); }
        .search-page-card:hover { transform: translateY(-5px); }
        .search-page-skeleton {
          background: linear-gradient(90deg,#f1f5f9 25%,#f8fafc 37%,#f1f5f9 63%);
          background-size: 400% 100%;
          animation: searchPageShimmer 1.35s ease-in-out infinite;
        }
        .search-page-icon-pulse { animation: searchPagePulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .search-page-animate,.search-page-pop,.search-page-stagger > *,
          .search-page-skeleton,.search-page-icon-pulse { animation: none !important; }
          .search-page-card { transition: none !important; }
        }
      `}</style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className="
          sticky
          top-0
          z-40
          border-b
          border-white/70
          bg-white/80
          shadow-[0_8px_30px_rgba(15,23,42,0.06)]
          backdrop-blur-2xl
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[68px]
            max-w-7xl
            items-center
            gap-2
            px-3
            sm:px-5
          "
        >
          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border border-slate-200/80
              bg-white/80
              text-slate-600
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md
              active:scale-95
            "
            aria-label="Go back"
          >
            <FaArrowLeft size={13} />
          </button>

          {/* SEARCH */}

          <div className="relative flex-1">
            <div
              className="
                group flex
                h-12
                items-center
                gap-2.5
                rounded-2xl
                border
                border-slate-200/80
                bg-white/80
                px-3.5
                shadow-sm
                transition-all duration-200
                hover:border-indigo-200 hover:shadow-md
                focus-within:border-indigo-300
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-indigo-500/10
              "
            >
              <FaSearch
                size={12}
                className="
                  shrink-0
                  text-indigo-500 transition-transform duration-200 group-focus-within:scale-110
                "
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    executeSearch();
                  }

                  if (
                    event.key === "Escape"
                  ) {
                    clearSearch();
                  }
                }}
                placeholder="
                  Search products, brands & categories
                "
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  text-xs
                  font-semibold
                  text-slate-800
                  outline-none
                  placeholder:text-slate-400
                "
                autoFocus
              />

              {!loading && searchInput && (
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="
                    hidden sm:inline-flex
                    h-8 px-3 shrink-0 items-center justify-center gap-1.5
                    rounded-xl bg-indigo-600 text-[9px] font-black text-white
                    shadow-sm shadow-indigo-200
                    transition-all duration-200
                    hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md
                    active:scale-95
                  "
                  aria-label="Search"
                >
                  <FaSearch size={9} />
                  Search
                </button>
              )}

              {loading && (
                <div
                  className="
                    h-4
                    w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-slate-200
                    border-t-indigo-500
                  "
                />
              )}

              {searchInput &&
                !loading && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      text-slate-400
                      transition-all duration-200
                      hover:rotate-90 hover:bg-slate-100 hover:text-slate-700
                    "
                    aria-label="Clear search"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
            </div>

            {/* SUGGESTIONS */}

            {searchInput &&
              suggestions.length > 0 &&
              searchInput !== search && (
                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-[calc(100%+8px)]
                    z-50
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200/80
                    bg-white/95
                    p-2
                    shadow-[0_18px_55px_rgba(15,23,42,0.14)]
                    backdrop-blur-xl
                    search-page-pop
                  "
                >
                  {suggestions.map(
                    (
                      suggestion,
                      index
                    ) => (
                      <button
                        key={`${suggestion}-${index}`}
                        type="button"
                        onClick={() =>
                          executeSearch(
                            suggestion
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-xl
                          px-3
                          py-3
                          text-left
                          transition
                          hover:bg-slate-50
                        "
                      >
                        <FaSearch
                          size={10}
                          className="
                            text-slate-400
                          "
                        />

                        <span
                          className="
                            flex-1
                            truncate
                            text-[11px]
                            font-bold
                            text-slate-700
                          "
                        >
                          {suggestion}
                        </span>

                        <FaChevronRight
                          size={8}
                          className="
                            text-slate-300
                          "
                        />
                      </button>
                    )
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-3
          pt-6
          sm:px-5
          sm:pt-8
        "
      >
        {/* ===================================================
            NO SEARCH
            =================================================== */}

        {!activeQuery ? (
          <>
            <div className="mb-7 search-page-animate">
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-indigo-500
                "
              >
                Discover
              </p>

              <h1
                className="
                  mt-1
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                "
              >
                Find what you need
              </h1>

              <p
                className="
                  mt-1
                  text-[10px]
                  font-medium
                  text-slate-400
                  sm:text-xs
                "
              >
                Search products, brands
                and categories.
              </p>
            </div>

            {/* POPULAR */}

            <section className="mb-8">
              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                "
              >
                <FaFire
                  size={12}
                  className="
                    text-orange-500
                  "
                />

                <h2
                  className="
                    text-xs
                    font-black
                    text-slate-900
                  "
                >
                  Popular Searches
                </h2>
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {popularSearches.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        executeSearch(item)
                      }
                      className="
                        rounded-full
                        border
                        border-slate-200/80
                        bg-white/90
                        px-4
                        py-2.5
                        text-[10px]
                        font-bold
                        text-slate-600
                        shadow-sm
                        transition-all duration-200
                        hover:-translate-y-0.5 hover:border-indigo-200
                        hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md
                        active:scale-95
                      "
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </section>

            {/* RECENT */}

            {recentSearches.length > 0 && (
              <section>
                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <FaClock
                      size={11}
                      className="
                        text-slate-400
                      "
                    />

                    <h2
                      className="
                        text-xs
                        font-black
                        text-slate-900
                      "
                    >
                      Recent Searches
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches(
                        []
                      );

                      try {
                        localStorage.removeItem(
                          "recentSearches"
                        );
                      } catch {
                        // Ignore
                      }
                    }}
                    className="
                      text-[9px]
                      font-bold
                      text-slate-400
                      hover:text-red-500
                    "
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-1">
                  {recentSearches.map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          executeSearch(
                            item
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-2xl
                          border border-slate-200/70
                          bg-white/90
                          px-4
                          py-3
                          text-left
                          shadow-sm
                          transition-all duration-200
                          hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md
                        "
                      >
                        <FaClock
                          size={10}
                          className="
                            text-slate-300
                          "
                        />

                        <span
                          className="
                            flex-1
                            text-[10px]
                            font-bold
                            text-slate-600
                          "
                        >
                          {item}
                        </span>

                        <FaChevronRight
                          size={8}
                          className="
                            text-slate-300
                          "
                        />
                      </button>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* RESULTS HEADER */}

            <div
              className="
                mb-6
                flex search-page-animate
                flex-wrap
                items-end
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-indigo-500
                  "
                >
                  Search Results
                </p>

                <h1
                  className="
                    mt-1
                    max-w-[280px]
                    truncate
                    text-xl
                    font-black
                    text-slate-900
                    sm:max-w-lg
                    sm:text-2xl
                  "
                >
                  "{activeQuery}"
                </h1>

                {!loading && (
                  <p
                    className="
                      mt-1
                      text-[10px]
                      font-medium
                      text-slate-400
                    "
                  >
                    {sortedResults.length}{" "}
                    {sortedResults.length ===
                    1
                      ? "product"
                      : "products"}{" "}
                    found
                  </p>
                )}
              </div>

              {!loading && (
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target.value
                      )
                    }
                    className="
                      h-11
                      appearance-none
                      rounded-2xl
                      border
                      border-slate-200/80
                      bg-white/90
                      shadow-sm
                      pl-3
                      pr-8
                      text-[9px]
                      font-black
                      text-slate-700
                      outline-none
                      shadow-sm
                      focus:border-indigo-300
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  >
                    <option value="default">
                      Sort: Relevance
                    </option>

                    <option value="low-high">
                      Price: Low → High
                    </option>

                    <option value="high-low">
                      Price: High → Low
                    </option>

                    <option value="rating">
                      Highest Rated
                    </option>
                  </select>

                  <FaChevronDown
                    size={8}
                    className="
                      pointer-events-none
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />
                </div>
              )}
            </div>

            {/* ERROR */}

            {error && !loading && (
              <div
                className="
                  mb-5
                  rounded-2xl
                  border
                  border-red-100
                  bg-red-50
                  p-4
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    text-red-600
                  "
                >
                  Failed to load products
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-red-400
                  "
                >
                  {error}
                </p>
              </div>
            )}

            {/* LOADING */}

            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* CATEGORY / BRAND */}

                {(categoryResults.length >
                  0 ||
                  brandResults.length >
                    0) && (
                  <div
                    className="
                      mb-6
                      grid
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    {categoryResults.length >
                      0 && (
                      <div
                        className="
                          rounded-2xl
                          border
                          border-slate-200
                          bg-white
                          p-4
                        "
                      >
                        <h2
                          className="
                            mb-3
                            text-[10px]
                            font-black
                            uppercase
                            tracking-wider
                            text-slate-400
                          "
                        >
                          Categories
                        </h2>

                        <div className="space-y-1">
                          {categoryResults.map(
                            (
                              item,
                              index
                            ) => {
                              const name =
                                typeof item ===
                                "string"
                                  ? item
                                  : item?.name ||
                                    item?.category ||
                                    "";

                              return (
                                <button
                                  key={`${name}-${index}`}
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/category/${encodeURIComponent(
                                        name
                                      )}`
                                    )
                                  }
                                  className="
                                    flex
                                    w-full
                                    items-center
                                    justify-between
                                    rounded-xl
                                    px-3 py-2.5
                                    text-left
                                    text-[10px] font-bold text-slate-700
                                    transition-all duration-200
                                    hover:bg-indigo-50 hover:text-indigo-700
                                    hover:translate-x-0.5
                                  "
                                >
                                  {name}

                                  <FaChevronRight
                                    size={7}
                                    className="
                                      text-slate-300
                                    "
                                  />
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {brandResults.length >
                      0 && (
                      <div
                        className="
                          rounded-2xl
                          border
                          border-slate-200
                          bg-white
                          p-4
                        "
                      >
                        <h2
                          className="
                            mb-3
                            text-[10px]
                            font-black
                            uppercase
                            tracking-wider
                            text-slate-400
                          "
                        >
                          Brands
                        </h2>

                        <div className="space-y-1">
                          {brandResults.map(
                            (
                              item,
                              index
                            ) => {
                              const name =
                                typeof item ===
                                "string"
                                  ? item
                                  : item?.name ||
                                    item?.brand ||
                                    "";

                              return (
                                <button
                                  key={`${name}-${index}`}
                                  type="button"
                                  onClick={() =>
                                    executeSearch(
                                      name
                                    )
                                  }
                                  className="
                                    flex
                                    w-full
                                    items-center
                                    justify-between
                                    rounded-xl
                                    px-3 py-2.5
                                    text-left
                                    text-[10px] font-bold text-slate-700
                                    transition-all duration-200
                                    hover:bg-indigo-50 hover:text-indigo-700
                                    hover:translate-x-0.5
                                  "
                                >
                                  {name}

                                  <FaChevronRight
                                    size={7}
                                    className="
                                      text-slate-300
                                    "
                                  />
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PRODUCTS */}

                {sortedResults.length >
                0 ? (
                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-3
                      sm:grid-cols-3
                      sp-stagger
                      lg:grid-cols-4
                      xl:grid-cols-5
                    "
                  >
                    {sortedResults.map(
                      (
                        product,
                        index
                      ) => (
                        <ProductCard
                          key={
                            getProductId(
                              product
                            ) ??
                            index
                          }
                          product={
                            product
                          }
                        />
                      )
                    )}
                  </div>
                ) : (
                  /* EMPTY */

                  <div
                    className="
                      flex
                      min-h-[420px]
                      flex-col
                      items-center
                      justify-center
                      rounded-[2rem]
                      border border-slate-200/80
                      bg-white/92
                      px-6
                      shadow-[0_18px_55px_rgba(15,23,42,.07)]
                      sp-reveal
                      text-center
                    "
                  >
                    <div
                      className="
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-3xl
                        border border-indigo-100
                        bg-indigo-50
                        text-indigo-400
                        transition-transform duration-500 hover:scale-105
                      "
                    >
                      <FaSearch
                        size={22}
                      />
                    </div>

                    <h2
                      className="
                        mt-5
                        text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      No products found
                    </h2>

                    <p
                      className="
                        mt-2
                        max-w-sm
                        text-[10px]
                        leading-5
                        text-slate-400
                      "
                    >
                      We couldn't find
                      anything matching "
                      {activeQuery}". Try another
                      product, brand or category.
                    </p>

                    <div
                      className="
                        mt-5
                        flex
                        flex-wrap
                        justify-center
                        gap-2
                      "
                    >
                      {popularSearches
                        .slice(0, 4)
                        .map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              executeSearch(
                                item
                              )
                            }
                            className="
                              rounded-full
                              bg-slate-100
                              px-3
                              py-2
                              text-[9px]
                              font-bold
                              text-slate-600
                              transition
                              hover:bg-indigo-50
                              hover:text-indigo-600
                            "
                          >
                            {item}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}