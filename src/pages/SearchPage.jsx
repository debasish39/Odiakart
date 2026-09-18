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

  const [searchParams, setSearchParams] = useSearchParams();

  const {
    filteredData = [],
    categoryOnlyData = [],
    brandOnlyData = [],
    search,
    setSearch,
    loading,
    error,
  } = getData();

  const urlSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [sort, setSort] = useState("default");
  const [recentSearches, setRecentSearches] = useState([]);

  const normalize = (value) =>
    String(value || "").toLowerCase().trim();

  const getProductName = (product) =>
    product?.name ||
    product?.title ||
    product?.productName ||
    product?.product_title ||
    "Untitled Product";

  const getProductCategory = (product) => {
    const category = product?.category;

    if (typeof category === "string") return category;

    if (category && typeof category === "object") {
      return (
        category?.name ||
        category?.title ||
        category?.category ||
        ""
      );
    }

    return product?.categoryName || product?.category_name || "";
  };

  const getProductSubCategory = (product) => {
    const subCategory =
      product?.subCategory || product?.subcategory;

    if (typeof subCategory === "string") return subCategory;

    if (subCategory && typeof subCategory === "object") {
      return subCategory?.name || subCategory?.title || "";
    }

    return "";
  };

  const getProductBrand = (product) => {
    const brand = product?.brand;

    if (typeof brand === "string") return brand;

    if (brand && typeof brand === "object") {
      return brand?.name || brand?.title || "";
    }

    return product?.brandName || product?.brand_name || "";
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
    if (product?.image) return product.image;
    if (product?.imageUrl) return product.imageUrl;
    if (product?.image_url) return product.image_url;
    if (product?.thumbnail) return product.thumbnail;

    if (Array.isArray(product?.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") return firstImage;

      if (firstImage && typeof firstImage === "object") {
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
    product?._id ?? product?.id ?? product?.productId ?? null;

  useEffect(() => {
    const value = searchParams.get("search") || "";
    setSearchInput(value);
    setSearch(value);
  }, [searchParams, setSearch]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("recentSearches") || "[]"
      );

      if (Array.isArray(saved)) setRecentSearches(saved);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const activeQuery = normalize(search);

  const searchResults = useMemo(() => {
    if (!activeQuery) return [];

    return Array.isArray(filteredData) ? filteredData : [];
  }, [filteredData, activeQuery]);

  const sortedResults = useMemo(() => {
    const result = [...searchResults];

    switch (sort) {
      case "low-high":
        result.sort(
          (a, b) => getProductPrice(a) - getProductPrice(b)
        );
        break;

      case "high-low":
        result.sort(
          (a, b) => getProductPrice(b) - getProductPrice(a)
        );
        break;

      case "rating":
        result.sort(
          (a, b) => getProductRating(b) - getProductRating(a)
        );
        break;

      default:
        break;
    }

    return result;
  }, [searchResults, sort]);

  const categoryResults = useMemo(() => {
    if (!activeQuery) return [];

    return (Array.isArray(categoryOnlyData) ? categoryOnlyData : [])
      .filter((item) => {
        const name =
          typeof item === "string"
            ? item
            : item?.name || item?.category || "";

        return normalize(name).includes(activeQuery);
      })
      .slice(0, 6);
  }, [categoryOnlyData, activeQuery]);

  const brandResults = useMemo(() => {
    if (!activeQuery) return [];

    return (Array.isArray(brandOnlyData) ? brandOnlyData : [])
      .filter((item) => {
        const name =
          typeof item === "string"
            ? item
            : item?.name || item?.brand || "";

        return normalize(name).includes(activeQuery);
      })
      .slice(0, 6);
  }, [brandOnlyData, activeQuery]);

  const suggestions = useMemo(() => {
    const value = normalize(searchInput);

    if (!value) return [];

    const values = (
      Array.isArray(filteredData) ? filteredData : []
    ).flatMap((product) => [
      getProductName(product),
      getProductCategory(product),
      getProductBrand(product),
    ]);

    return [
      ...new Set(
        values.filter(
          (item) =>
            item && normalize(item).includes(value)
        )
      ),
    ].slice(0, 8);
  }, [filteredData, searchInput]);

  const saveRecentSearch = (value) => {
    const cleaned = String(value || "").trim();

    if (!cleaned) return;

    const updated = [
      cleaned,
      ...recentSearches.filter(
        (item) =>
          normalize(item) !== normalize(cleaned)
      ),
    ].slice(0, 8);

    setRecentSearches(updated);

    try {
      localStorage.setItem(
        "recentSearches",
        JSON.stringify(updated)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const executeSearch = (value = searchInput) => {
    const cleaned = String(value || "").trim();

    if (!cleaned) {
      setSearchInput("");
      setSearch("");
      setSearchParams({});
      return;
    }

    saveRecentSearch(cleaned);
    setSearchInput(cleaned);
    setSearch(cleaned);
    setSearchParams({ search: cleaned });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setSearchParams({});
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);

    try {
      localStorage.removeItem("recentSearches");
    } catch {
      // Ignore storage errors.
    }
  };

  const popularSearches = [
    "Shoes",
    "T-Shirts",
    "Watches",
    "Bags",
    "Headphones",
    "Mobiles",
  ];

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  /* =========================================================
     MATERIAL / PLAY-STORE PRODUCT CARD
     ========================================================= */

  const ProductCard = ({ product }) => {
    const name = getProductName(product);
    const price = getProductPrice(product);
    const rating = getProductRating(product);
    const image = getProductImage(product);
    const productId = getProductId(product);
    const brand = getProductBrand(product);
    const category = getProductCategory(product);

    return (
      <button
        type="button"
        onClick={() => {
          if (!productId) {
            console.warn("Product ID missing:", product);
            return;
          }

          navigate(`/products/${productId}`);
        }}
        className="
          group w-full text-left
          rounded-[22px] bg-white
          p-1.5 sm:p-2
          shadow-[0_1px_3px_rgba(60,64,67,.07)]
          transition duration-200
          hover:bg-slate-50
          active:scale-[0.985]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-slate-400
        "
      >
        <div
          className="
            relative aspect-square overflow-hidden
            rounded-[18px]
            bg-[#f8f9fa]
          "
        >
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="
                h-full w-full object-contain p-2.5
                transition duration-300 ease-out
                group-hover:scale-[1.045]
              "
            />
          ) : (
            <div
              className="
                flex h-full w-full items-center justify-center
                text-slate-300
              "
            >
              <FaShoppingBag size={28} />
            </div>
          )}

          {rating > 0 && (
            <span
              className="
                absolute bottom-2 left-2
                inline-flex items-center gap-1
                rounded-full
                bg-white/95 px-2 py-1
                text-[10px] font-semibold
                text-emerald-700
                shadow-sm
              "
            >
              {rating.toFixed(1)}
              <FaStar size={7} />
            </span>
          )}
        </div>

        <div className="px-1.5 pb-2 pt-2.5">
          <p
            className="
              line-clamp-2 min-h-[34px]
              text-[12px] font-medium leading-[16px]
              text-[#202124]
            "
          >
            {name}
          </p>

          {(brand || category) && (
            <p
              className="
                mt-1 truncate
                text-[11px] font-normal
                text-[#5f6368]
              "
            >
              {brand || category}
            </p>
          )}

          <p
            className="
              mt-1.5 text-[14px]
              font-bold tracking-tight
              text-[#202124]
            "
          >
            {formatPrice(price)}
          </p>
        </div>
      </button>
    );
  };

  /* =========================================================
     FULL TAILWIND SKELETON
     ========================================================= */

  const SkeletonBlock = ({ className = "" }) => (
    <div
      className={`
        animate-pulse rounded-xl
        bg-slate-200/80
        ${className}
      `}
    />
  );

  const SearchHeaderSkeleton = () => (
    <div className="flex items-center gap-2">
      <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
      <SkeletonBlock className="h-12 flex-1 rounded-full" />
    </div>
  );

  const ProductSkeleton = () => (
    <div className="rounded-2xl bg-white p-1.5 sm:p-2">
      <SkeletonBlock className="aspect-square w-full rounded-[18px]" />

      <div className="space-y-2 px-1.5 pb-2 pt-3">
        <SkeletonBlock className="h-3.5 w-[88%]" />
        <SkeletonBlock className="h-3.5 w-[62%]" />
        <SkeletonBlock className="mt-2 h-4 w-[38%]" />
      </div>
    </div>
  );

  const ResultsSkeleton = () => (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-6 w-52 max-w-[55vw]" />
          <SkeletonBlock className="h-3 w-28" />
        </div>

        <SkeletonBlock className="h-10 w-32 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    </div>
  );

  const DiscoverSkeleton = () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-8 w-64 max-w-[70vw]" />
        <SkeletonBlock className="h-3 w-56 max-w-[65vw]" />
      </div>

      <div>
        <SkeletonBlock className="mb-4 h-5 w-36" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock
              key={index}
              className="h-10 w-24 shrink-0 rounded-full"
            />
          ))}
        </div>
      </div>

      <div>
        <SkeletonBlock className="mb-4 h-5 w-36" />
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="
                flex items-center gap-3
                border-b border-slate-100
                py-4
              "
            >
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-3 flex-1 max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* =========================================================
     MODERN MOBILE-FIRST RENDER
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#202124] pb-8">
      {/* Top app bar / search */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 pb-2 pt-2 sm:px-5 sm:pt-3">
          {loading && !activeQuery ? (
            <SearchHeaderSkeleton />
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#3c4043] transition active:scale-90 hover:bg-[#f1f3f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Go back"
              >
                <FaArrowLeft size={13} />
              </button>

              <div className="relative min-w-0 flex-1">
                <div className="flex h-11 items-center gap-2.5 rounded-full bg-[#f1f3f4] px-3.5 transition focus-within:bg-white focus-within:ring-1 focus-within:ring-[#c4c7c5] focus-within:shadow-[0_2px_8px_rgba(60,64,67,.16)]">
                  <FaSearch size={13} className="shrink-0 text-[#5f6368]" />

                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") executeSearch();
                      if (event.key === "Escape") clearSearch();
                    }}
                    placeholder="Search products, brands & categories"
                    className="min-w-0 flex-1 bg-transparent text-[13px] font-normal text-[#202124] outline-none placeholder:text-[#80868b]"
                    autoFocus
                  />

                  {loading && (
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                  )}

                  {/* {!loading && searchInput && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5f6368] transition active:scale-90 hover:bg-[#e8eaed]"
                      aria-label="Clear search"
                    >
                      <FaTimes size={11} />
                    </button>
                  )} */}

                  {!loading && searchInput && (
                    <button
                      type="button"
                      onClick={() => executeSearch()}
                      className="hidden h-8 shrink-0 items-center justify-center rounded-full bg-[#202124] px-4 text-[11px] font-semibold text-white transition active:scale-95 hover:bg-black sm:flex"
                    >
                      Search
                    </button>
                  )}
                </div>

                {searchInput &&
                  suggestions.length > 0 &&
                  searchInput !== search && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[#e8eaed] bg-white p-1.5 shadow-[0_10px_30px_rgba(60,64,67,.18)]">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion}-${index}`}
                          type="button"
                          onClick={() => executeSearch(suggestion)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:bg-[#f1f3f4] hover:bg-[#f8f9fa]"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                            <FaSearch size={9} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#3c4043]">
                            {suggestion}
                          </span>
                          <FaChevronRight size={8} className="text-[#9aa0a6]" />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
        <div className="h-px bg-[#e8eaed]" />
      </header>

      <div className="mx-auto max-w-7xl px-3 pb-8 pt-5 sm:px-6 sm:pt-8">
        {loading ? (
          activeQuery ? <ResultsSkeleton /> : <DiscoverSkeleton />
        ) : !activeQuery ? (
          <>
            {/* Discover hero */}
            <section className="mb-7 rounded-[28px] bg-white px-5 py-6 shadow-[0_1px_3px_rgba(60,64,67,.08)] sm:px-7 sm:py-8">
              <span className="inline-flex items-center rounded-full bg-[#f1f3f4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                Explore
              </span>
              <h1 className="mt-3 text-[24px] font-bold tracking-[-0.035em] text-[#202124] sm:text-[30px]">
                Find what you need
              </h1>
              <p className="mt-1.5 max-w-lg text-[12px] leading-5 text-[#5f6368] sm:text-[13px]">
                Search products, brands and categories and discover something you’ll love.
              </p>
            </section>

            {/* Popular searches */}
            <section className="mb-8">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fce8e6] text-[#ea4335]">
                    <FaFire size={11} />
                  </span>
                  <h2 className="text-[15px] font-bold text-[#202124]">
                    Popular searches
                  </h2>
                </div>
              </div>

              <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none">
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => executeSearch(item)}
                    className="min-h-9 shrink-0 rounded-full border border-[#dadce0] bg-white px-3.5 text-[11px] font-semibold text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,.04)] transition active:scale-95 hover:bg-[#f8f9fa]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_3px_rgba(60,64,67,.07)]">
                <div className="flex items-center justify-between px-4 pb-1 pt-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                      <FaClock size={10} />
                    </span>
                    <h2 className="text-[15px] font-bold text-[#202124]">
                      Recent searches
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="rounded-full px-3 py-2 text-[11px] font-semibold text-[#5f6368] transition active:scale-95 hover:bg-[#f1f3f4]"
                  >
                    Clear
                  </button>
                </div>

                <div className="divide-y divide-[#f1f3f4] px-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => executeSearch(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition active:bg-[#f1f3f4] hover:bg-[#f8f9fa]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                        <FaClock size={10} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#3c4043]">
                        {item}
                      </span>
                      <FaChevronRight size={8} className="text-[#9aa0a6]" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* Results header */}
            <section className="mb-5">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#80868b]">
                    Search results
                  </p>
                  <h1 className="mt-1 truncate text-[20px] font-bold tracking-[-0.025em] text-[#202124] sm:text-[27px]">
                    “{activeQuery}”
                  </h1>
                  {!loading && (
                    <p className="mt-1 text-[11px] text-[#5f6368]">
                      {sortedResults.length} {sortedResults.length === 1 ? "product" : "products"} found
                    </p>
                  )}
                </div>

                {!loading && (
                  <div className="relative shrink-0">
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      className="h-9 appearance-none rounded-full border border-[#dadce0] bg-white pl-3.5 pr-8 text-[10px] font-semibold text-[#3c4043] outline-none transition hover:bg-[#f8f9fa] focus:border-[#9aa0a6]"
                    >
                      <option value="default">Relevance</option>
                      <option value="low-high">Price: Low → High</option>
                      <option value="high-low">Price: High → Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                    <FaChevronDown
                      size={7}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368]"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Error */}
            {error && !loading && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
                <p className="text-[12px] font-bold text-red-700">Failed to load products</p>
                <p className="mt-1 text-[10px] leading-4 text-red-500">{error}</p>
              </div>
            )}

            {/* Products */}
            {sortedResults.length > 0 ? (
              <section>
                <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
                  {sortedResults.map((product, index) => (
                    <ProductCard
                      key={getProductId(product) ?? index}
                      product={product}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section className="flex min-h-[330px] flex-col items-center justify-center rounded-[28px] bg-white px-5 py-10 text-center shadow-[0_1px_3px_rgba(60,64,67,.08)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                  <FaSearch size={21} />
                </div>
                <h2 className="mt-4 text-[18px] font-bold text-[#202124]">
                  No products found
                </h2>
                <p className="mt-1.5 max-w-xs text-[12px] leading-5 text-[#5f6368]">
                  We couldn't find anything matching “{activeQuery}”.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {popularSearches.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => executeSearch(item)}
                      className="rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[10px] font-semibold text-[#3c4043] transition active:scale-95 hover:bg-[#f8f9fa]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
