import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import {
  FaAngleLeft,
  FaAngleRight,
  FaFilter,
  FaTimes,
  FaThLarge,
  FaList,
  FaChevronDown,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";

import {
  MdOutlineCategory,
  MdTune,
  MdShoppingBag,
} from "react-icons/md";

import { getData } from "../context/DataContext";
import { useQuery } from "@tanstack/react-query";

import FilterSection from "../components/FilterSection";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";

import Lottie from "lottie-react";
import notfound from "../assets/notfound.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Products() {
  // =========================================================
  // URL
  // =========================================================

  const [searchParams, setSearchParams] =
    useSearchParams();

  // =========================================================
  // DATA CONTEXT
  // =========================================================

  const {
    loading,
    error,
    filteredData,
    search,

    category,
    subCategory,
    brand,

  setSearch,
    priceRange,
    sort,

    setCategory,
    setSubCategory,
    setBrand,
    setPriceRange,
    setSort,

    categoryOnlyData,
  } = getData();

  // =========================================================
  // LOCAL STATE
  // =========================================================

  const [page, setPage] = useState(1);

  const [showFilters, setShowFilters] =
    useState(false);

  const [activeFilterSection, setActiveFilterSection] =
    useState("all");

  const openFilterSection = (section) => {
    setActiveFilterSection(section);
    setShowFilters(true);
  };

  const [gridView, setGridView] =
    useState(true);



  // =========================================================
  // PRODUCTS
  // =========================================================

  const products = Array.isArray(filteredData)
    ? filteredData
    : [];

  // =========================================================
  // SYNC URL WITH CONTEXT
  // =========================================================

  useEffect(() => {
  const urlSearch = searchParams.get("search");
  const urlCategory = searchParams.get("category");
  const urlSubCategory = searchParams.get("subCategory");
  const urlBrand = searchParams.get("brand");

  setSearch(urlSearch || "");

  setCategory(urlCategory || "All");
  setSubCategory(urlSubCategory || "All");
  setBrand(urlBrand || "All");
}, [
  searchParams,
  setSearch,
  setCategory,
  setSubCategory,
  setBrand,
]);

  // =========================================================
  // SELECTED CATEGORY QUERY
  // =========================================================

  const {
    data: apiCategory = null,
  } = useQuery({
    queryKey: ["category", category],

    queryFn: async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/category/${category}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const result = await response.json();

      return result?.category || null;
    },

    enabled:
      !!category &&
      category !== "All",

    // Category information normally changes
    // much less frequently than product data.
    staleTime: 30 * 60 * 1000,

    gcTime: 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });

  // =========================================================
  // SELECTED CATEGORY
  // =========================================================

  const selectedCategory = useMemo(() => {
    if (!category || category === "All") {
      return null;
    }

    // First priority: exact category returned by backend.
    if (apiCategory) {
      return apiCategory;
    }

    // Second priority: category data already available in context.
    if (Array.isArray(categoryOnlyData)) {
      const found = categoryOnlyData.find(
        (item) => String(item?._id) === String(category)
      );

      if (found) {
        return found;
      }
    }

    // Third priority: category object attached to a product.
    const productWithCategory = products.find((product) => {
      const productCategory = product?.category;

      if (!productCategory) {
        return false;
      }

      if (typeof productCategory === "object") {
        return String(productCategory?._id) === String(category);
      }

      return String(productCategory) === String(category);
    });

    const productCategory = productWithCategory?.category;

    return typeof productCategory === "object"
      ? productCategory
      : null;
  }, [
    category,
    apiCategory,
    categoryOnlyData,
    products,
  ]);

  // =========================================================
  // CATEGORY NAME
  // =========================================================

  const categoryName = useMemo(() => {
    if (!category || category === "All") {
      return "All Products";
    }

    const name =
      selectedCategory?.name ||
      selectedCategory?.title ||
      selectedCategory?.categoryName ||
      selectedCategory?.category;

    // Never show the MongoDB ObjectId as the visible category title.
    if (name && String(name) !== String(category)) {
      return String(name);
    }

    return "Products";
  }, [category, selectedCategory]);

  // =========================================================
  // CATEGORY DESCRIPTION
  // =========================================================

  const categoryDescription = useMemo(() => {
    if (
      !category ||
      category === "All"
    ) {
      return (
        "Explore our complete collection and discover products picked for every need."
      );
    }

    return (
      selectedCategory?.description ||
      selectedCategory?.desc ||
      `Explore the best ${categoryName.toLowerCase()} products available in our store.`
    );
  }, [
    category,
    selectedCategory,
    categoryName,
  ]);

  // =========================================================
  // CATEGORY IMAGE
  // =========================================================

  const categoryImage =
    selectedCategory?.image ||
    selectedCategory?.thumbnail ||
    selectedCategory?.categoryImage ||
    null;

  // =========================================================
  // CATEGORY COLOR
  // =========================================================

  const categoryColor =
    selectedCategory?.color ||
    selectedCategory?.themeColor ||
    "#4f46e5";

  // =========================================================
  // PRICE FILTER
  // =========================================================

  const priceIsFiltered =
    Array.isArray(priceRange) &&
    (
      Number(priceRange[0]) !== 0 ||
      Number(priceRange[1]) !== 5000
    );

  // =========================================================
  // ACTIVE FILTER COUNT
  // =========================================================

  const activeFiltersCount = [
    category &&
      category !== "All",

    subCategory &&
      subCategory !== "All",

    brand &&
      brand !== "All",

    priceIsFiltered,
  ].filter(Boolean).length;

  // =========================================================
  // PAGINATION
  // =========================================================

  const itemsPerPage = gridView
    ? 12
    : 8;

  const totalPages = Math.max(
    1,
    Math.ceil(
      products.length /
        itemsPerPage
    )
  );

  const startIndex =
    (page - 1) *
    itemsPerPage;

  const paginatedProducts =
    products.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  // =========================================================
  // RESET PAGE
  // =========================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    category,
    subCategory,
    brand,
    priceRange,
    sort,
  ]);

  // =========================================================
  // SELECT CATEGORY
  // =========================================================

  const selectCategory = (
    categoryId
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    if (
      categoryId &&
      categoryId !== "All"
    ) {
      params.set(
        "category",
        categoryId
      );
    } else {
      params.delete(
        "category"
      );
    }

    params.delete(
      "subCategory"
    );

    params.delete(
      "brand"
    );

    setSearchParams(params);

    setCategory(
      categoryId || "All"
    );

    setSubCategory("All");
    setBrand("All");

    setPage(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearAllFilters = () => {
    setCategory("All");
    setSubCategory("All");
    setBrand("All");

    setPriceRange([
      0,
      5000,
    ]);

    setSort("default");

    const params =
      new URLSearchParams();

    if (search) {
      params.set(
        "search",
        search
      );
    }

    setSearchParams(params);

    setPage(1);
  };

  // =========================================================
  // REMOVE FILTER
  // =========================================================

  const removeFilter = (
    filterName
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    params.delete(
      filterName
    );

    setSearchParams(params);

    if (
      filterName ===
      "category"
    ) {
      setCategory("All");
      setSubCategory("All");
    }

    if (
      filterName ===
      "subCategory"
    ) {
      setSubCategory("All");
    }

    if (
      filterName ===
      "brand"
    ) {
      setBrand("All");
    }

    setPage(1);
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const goToPage = (
    nextPage
  ) => {
    const safePage =
      Math.min(
        Math.max(
          nextPage,
          1
        ),
        totalPages
      );

    setPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // PAGINATION NUMBERS
  // =========================================================

  const paginationPages =
    useMemo(() => {
      const pages = [];

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        if (
          i === 1 ||
          i === totalPages ||
          (
            i >= page - 1 &&
            i <= page + 1
          )
        ) {
          pages.push(i);
        }
      }

      return pages;
    }, [
      page,
      totalPages,
    ]);

  // =========================================================
  // ERROR
  // =========================================================

  if (
    error &&
    !loading
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">

        <div className="mx-auto flex min-h-[500px] max-w-xl items-center justify-center">

          <div className="w-full rounded-[30px] border border-red-100 bg-white p-8 text-center shadow-xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-500">
              !
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Unable to load products
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-95"
            >
              Try Again
            </button>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen max-w-7xl mx-auto mt-3">

      {/* =====================================================
          PAGE
      ===================================================== */}

      <div className="relative overflow-hidden">

        {/* Background Decoration */}

        <div className="pointer-events-none absolute -right-40 -top-40 h-8.56 w-96 rounded-full blur-3xl" />

        <div className="pointer-events-none absolute -left-40 top-[700px] h-8.56 w-96 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-[1600px] px-3 pb-12 pt-4 sm:px-5 sm:pt-6 lg:px-8">

          {/* =================================================
              CATEGORY BANNER
          ================================================= */}

          {/* {category !== "All" ? (
            <CategoryBanner
              categoryName={
                categoryName
              }
              description={
                categoryDescription
              }
              image={
                categoryImage
              }
              productCount={
                products.length
              }
              color={
                categoryColor
              }
              onShopNow={() =>
                document
                  .getElementById(
                    "category-products"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                    block:
                      "start",
                  })
              }
            />
          ) : (
            <AllProductsBanner
              productCount={
                products.length
              }
            />
          )} */}

          {/* =================================================
              CATEGORY NAVIGATION
          ================================================= */}

          <section className="mb-5">


          </section>

          {/* =================================================
              ACTIVE FILTERS
          ================================================= */}

          {/* {!loading &&
            activeFiltersCount >
              0 && (
              <section className="mb-4">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="mr-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Applied Filters
                  </span>

                  {category &&
                    category !==
                      "All" && (
                    <FilterChip
                      label={
                        categoryName
                      }
                      onRemove={() =>
                        removeFilter(
                          "category"
                        )
                      }
                    />
                  )}

                  {subCategory &&
                    subCategory !==
                      "All" && (
                    <FilterChip
                      label="Subcategory"
                      onRemove={() =>
                        removeFilter(
                          "subCategory"
                        )
                      }
                    />
                  )}

                  {brand &&
                    brand !==
                      "All" && (
                    <FilterChip
                      label={`Brand: ${brand}`}
                      onRemove={() =>
                        removeFilter(
                          "brand"
                        )
                      }
                    />
                  )}

                  {priceIsFiltered && (
                    <div className="inline-flex min-h-8 items-center rounded-full bg-indigo-50 px-3 text-[10px] font-extrabold text-indigo-600">
                      ₹
                      {Number(
                        priceRange?.[0] ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                      {" – "}
                      ₹
                      {Number(
                        priceRange?.[1] ||
                          5000
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      clearAllFilters
                    }
                    className="ml-1 text-[10px] font-black text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>

                </div>

              </section>
            )} */}

          {/* =================================================
              MODERN HORIZONTAL FILTER BAR
              Values are taken from the actual filter state
          ================================================= */}

          {/* =================================================
              MODERN COMPACT FILTER TOOLBAR
          ================================================= */}

          <section className="mb-5">
            <div
              className="
                flex
                items-center
                gap-2
                overflow-x-auto
                px-0.5
                pb-1
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >

              {/* ALL FILTERS */}

              <button
                type="button"
                onClick={() => openFilterSection("all")}
                aria-label="Open all filters"
                className={`
                  group
                  inline-flex
                  h-10
                  shrink-0
                  items-center
                  gap-2
                  rounded-xl
                  border
                  px-3
                  text-[10px]
                  font-black
                  transition-all
                  duration-200
                  active:scale-95
                  ${
                    activeFiltersCount > 0
                      ? "border-indigo-200 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-600"
                  }
                `}
              >
                <span
                  className={`
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-md
                    px-1
                    text-[8px]
                    font-black
                    ${
                      activeFiltersCount > 0
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }
                  `}
                >
                  {activeFiltersCount}
                </span>

                <FaFilter
                  size={10}
                  className={
                    activeFiltersCount > 0
                      ? "text-white"
                      : "text-slate-500"
                  }
                />

                <span>Filters</span>
              </button>


              {/* CATEGORY */}

              <FilterChipButton
                label={
                  category && category !== "All"
                    ? categoryName
                    : "Category"
                }
                active={
                  category &&
                  category !== "All"
                }
                onClick={() =>
                  openFilterSection("category")
                }
              />


              {/* BRAND */}

              <FilterChipButton
                label={
                  brand && brand !== "All"
                    ? brand
                    : "Brand"
                }
                active={
                  brand &&
                  brand !== "All"
                }
                onClick={() =>
                  openFilterSection("brand")
                }
              />


              {/* PRICE */}

              <FilterChipButton
                label={
                  priceIsFiltered
                    ? `₹${Number(
                        priceRange?.[0] ?? 0
                      ).toLocaleString("en-IN")} - ₹${Number(
                        priceRange?.[1] ?? 5000
                      ).toLocaleString("en-IN")}`
                    : "Price"
                }
                active={priceIsFiltered}
                onClick={() =>
                  openFilterSection("price")
                }
              />


              {/* SORT */}

              <FilterChipButton
                label={
                  sort && sort !== "default"
                    ? sort === "low-high"
                      ? "Low → High"
                      : sort === "high-low"
                        ? "High → Low"
                        : sort === "rating"
                          ? "Top Rated"
                          : sort
                    : "Sort By"
                }
                active={
                  !!sort &&
                  sort !== "default"
                }
                onClick={() =>
                  openFilterSection("sort")
                }
              />

            </div>
          </section>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          {loading ? (

            <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">

              {Array.from({
                length: 12,
              }).map(
                (_, index) => (
                  <ProductCardSkeleton
                    key={
                      index
                    }
                  />
                )
              )}

            </div>

          ) : products.length ===
            0 ? (

            <EmptyProducts
              categoryName={
                categoryName
              }
              onClear={
                clearAllFilters
              }
              onFilter={() =>
                setShowFilters(
                  true
                )
              }
            />

          ) : (

            <section
              id="category-products"
            >

              {/* Heading */}

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                    {category ===
                    "All"
                      ? "Our Collection"
                      : "Category Products"}
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    {categoryName}
                  </h2>

                </div>

                <span className="text-[10px] font-bold text-slate-400">
                  {products.length}{" "}
                  items
                </span>

              </div>

              {/* Product Grid */}

              <div
                className={
                  gridView
                    ? "grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6"
                    : "flex flex-col gap-4"
                }
              >

                {paginatedProducts.map(
                  (product) => (
                    <div
                      key={
                        product?._id ||
                        product?.id
                      }
                      className="min-w-0 w-full"
                    >
                      <ProductCard
                        product={
                          product
                        }
                      />
                    </div>
                  )
                )}

              </div>

              {/* Pagination */}

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5">

                  <button
                    type="button"
                    disabled={
                      page ===
                      1
                    }
                    onClick={() =>
                      goToPage(
                        page - 1
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                  >
                    <FaAngleLeft
                      size={12}
                    />
                  </button>

                  {paginationPages.map(
                    (
                      pageNumber,
                      index
                    ) => {

                      const previous =
                        paginationPages[
                          index - 1
                        ];

                      const showDots =
                        index >
                          0 &&
                        pageNumber -
                          previous >
                          1;

                      return (
                        <React.Fragment
                          key={
                            pageNumber
                          }
                        >

                          {showDots && (
                            <span className="px-1 text-slate-400">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              goToPage(
                                pageNumber
                              )
                            }
                            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-xs font-black ${
                              page ===
                              pageNumber
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>

                        </React.Fragment>
                      );
                    }
                  )}

                  <button
                    type="button"
                    disabled={
                      page ===
                      totalPages
                    }
                    onClick={() =>
                      goToPage(
                        page + 1
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                  >
                    <FaAngleRight
                      size={12}
                    />
                  </button>

                </div>
              )}

              <div className="mt-5 text-center text-[10px] text-slate-400">

                Showing{" "}

                <span className="font-black text-indigo-600">
                  {startIndex + 1}
                  {" – "}
                  {Math.min(
                    startIndex +
                      itemsPerPage,
                    products.length
                  )}
                </span>

                {" "}of{" "}

                <span className="font-black text-indigo-600">
                  {
                    products.length
                  }
                </span>

                {" "}products

              </div>

            </section>

          )}

        </div>

      </div>

      {/* =====================================================
          MOBILE FILTER BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setShowFilters(
            true
          )
        }
        aria-label="Open filters"
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-indigo-600 text-white shadow-xl shadow-indigo-300 transition active:scale-90 sm:hidden"
      >

        <FaFilter
          size={16}
        />

        {activeFiltersCount >
          0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[8px] font-black">
            {
              activeFiltersCount
            }
          </span>
        )}

      </button>

      {/* =====================================================
          FILTER POPUP
      ===================================================== */}

      <FilterSection
        open={
          showFilters
        }
        setOpen={
          setShowFilters
        }
        initialSection={activeFilterSection}
      />

    </main>
  );
}

// =============================================================
// CATEGORY BANNER
// =============================================================

// =============================================================
// MODERN CATEGORY BANNER
// =============================================================

function CategoryBanner({
  categoryName,
  description,
  image,
  productCount,
  color,
  onShopNow,
}) {
  return (
    <section className="mb-5">

      <div
        className="
          group
          relative
          isolate
          min-h-[220px]
          overflow-hidden
          rounded-[26px]
          bg-slate-950
          shadow-lg
          sm:min-h-[270px]
          lg:min-h-[320px]
        "
      >

        {/* =================================================
            CATEGORY IMAGE
        ================================================= */}

        {image && (
          <img
            src={image}
            alt={categoryName}
            loading="lazy"
            decoding="async"
            className="
              absolute
              inset-0
              -z-30
              h-full
              w-full
              object-cover
              object-center
              transition-transform
              duration-700
              ease-out
              group-hover:scale-[1.04]
            "
          />
        )}

        {/* =================================================
            DARK OVERLAY
        ================================================= */}

        <div
          className="
            absolute
            inset-0
            -z-20
            bg-gradient-to-r
            from-slate-950
            via-slate-950/80
            to-slate-950/20
          "
        />

        {/* =================================================
            MOBILE OVERLAY
        ================================================= */}

        <div
          className="
            absolute
            inset-0
            -z-10
            bg-gradient-to-t
            from-slate-950/80
            via-transparent
            to-slate-950/20
            lg:hidden
          "
        />

        {/* =================================================
            CATEGORY COLOR GLOW
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            opacity-25
            blur-3xl
            transition-opacity
            duration-500
            group-hover:opacity-40
          "
          style={{
            backgroundColor: color,
          }}
        />

        {/* =================================================
            CONTENT
        ================================================= */}

        <div
          className="
            relative
            flex
            min-h-[220px]
            items-end
            px-5
            py-6
            sm:min-h-[270px]
            sm:px-8
            sm:py-8
            lg:min-h-[320px]
            lg:items-center
            lg:px-10
          "
        >

          <div className="w-full max-w-2xl">

            {/* =================================================
                BADGE
            ================================================= */}

            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/10
                px-3
                py-1.5
                backdrop-blur-md
              "
            >

              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                }}
              />

              <span
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/75
                "
              >
                Explore Collection
              </span>

            </div>

            {/* =================================================
                TITLE
            ================================================= */}

            <h1
              className="
                max-w-xl
                text-3xl
                font-black
                leading-[1.05]
                tracking-tight
                text-white
                sm:text-4xl
                lg:text-5xl
              "
            >
              {categoryName}
            </h1>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p
              className="
                mt-2
                max-w-lg
                text-[10px]
                leading-5
                text-white/65
                sm:text-xs
                sm:leading-6
              "
            >
              {description}
            </p>

            {/* =================================================
                ACTION ROW
            ================================================= */}

            <div
              className="
                mt-4
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              {/* PRODUCT COUNT */}

              <div
                className="
                  inline-flex
                  min-h-9
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/10
                  px-3
                  backdrop-blur-md
                "
              >

                <MdShoppingBag
                  size={13}
                  className="text-white/80"
                />

                <span
                  className="
                    text-[9px]
                    font-black
                    text-white
                  "
                >
                  {productCount} Products
                </span>

              </div>

              {/* SHOP BUTTON */}

              <button
                type="button"
                onClick={onShopNow}
                className="
                  group/button
                  inline-flex
                  min-h-9
                  items-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-4
                  text-[9px]
                  font-black
                  text-slate-900
                  shadow-lg
                  transition-all
                  duration-200
                  hover:bg-slate-100
                  active:scale-95
                "
              >

                Shop Collection

                <FaArrowRight
                  size={8}
                  className="
                    transition-transform
                    duration-200
                    group-hover/button:translate-x-0.5
                  "
                />

              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            CATEGORY IMAGE PREVIEW
        ================================================= */}

        {image && (
          <div
            className="
              absolute
              bottom-5
              right-5
              hidden
              h-20
              w-20
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-white/15
              bg-white/10
              p-2
              backdrop-blur-md
              sm:flex
              lg:bottom-7
              lg:right-7
              lg:h-24
              lg:w-24
            "
          >

            <img
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              className="
                h-full
                w-full
                object-contain
                transition-transform
                duration-500
                group-hover:scale-110
              "
            />

          </div>
        )}

        {/* =================================================
            BOTTOM ACCENT
        ================================================= */}

        <div
          className="
            absolute
            bottom-0
            left-0
            h-[3px]
            w-full
          "
          style={{
            background: `linear-gradient(
              90deg,
              ${color},
              transparent
            )`,
          }}
        />

      </div>

    </section>
  );
}

// =============================================================
// ALL PRODUCTS BANNER
// =============================================================

function AllProductsBanner({
  productCount,
}) {
  return (
    <section className="mb-5">

      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 shadow-xl">

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full blur-3xl" />

        <div className="relative px-5 py-9 sm:px-8 sm:py-11 lg:px-12 lg:py-14">

          <div className="max-w-2xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur">

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/70 sm:text-[9px]">
                Complete Collection
              </span>

            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Discover Everything
            </h1>

            <p className="mt-3 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
              Explore our complete collection and discover products for every style, need and occasion.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold text-white backdrop-blur">
              <MdShoppingBag
                size={14}
              />

              {productCount} Products

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

// =============================================================
// CATEGORY NAV CARD
// =============================================================

function CategoryNavCard({
  item,
  name,
  active,
  onClick,
}) {
  const image =
    item?.image ||
    item?.thumbnail ||
    item?.categoryImage;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        h-[72px]
        min-w-[92px]
        shrink-0
        items-center
        gap-2
        rounded-2xl
        border
        px-2.5
        text-left
        transition-all
        duration-200
        active:scale-[0.96]
        sm:h-[82px]
        sm:min-w-[125px]
        sm:px-3
        ${
          active
            ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white hover:shadow-sm"
        }
      `}
    >

      {/* IMAGE */}

      {image ? (
        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            p-1
            ${
              active
                ? "bg-white/15"
                : "bg-white"
            }
          `}
        >

          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />

        </div>
      ) : (
        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${
              active
                ? "bg-white/15"
                : "bg-white"
            }
          `}
        >

          <MdOutlineCategory
            size={17}
          />

        </div>
      )}

      {/* NAME */}

      <span className="min-w-0 flex-1">

        <span
          className={`
            block
            break-words
            text-[9px]
            font-black
            leading-3.5
            sm:text-[10px]
            ${
              active
                ? "text-white"
                : "text-slate-700"
            }
          `}
        >
          {name}
        </span>

        {active && (
          <span className="mt-1 block text-[7px] font-bold text-white/60">
            Selected
          </span>
        )}

      </span>

      {/* CHECK */}

      {active && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-indigo-600">
          <FaCheck
            size={7}
          />
        </span>
      )}

    </button>
  );
}

// =============================================================
// MODERN HORIZONTAL FILTER CHIP
// =============================================================

function FilterChipButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex
        h-10
        min-w-[82px]
        max-w-[155px]
        shrink-0
        items-center
        justify-between
        gap-2
        rounded-xl
        border
        px-3
        text-left
        transition-all
        duration-200
        active:scale-95
        ${
          active
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
            : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
        }
      `}
    >
      <span className="min-w-0 flex-1 truncate text-[9px] font-extrabold">
        {label}
      </span>

      <FaChevronDown
        size={7}
        className={`shrink-0 ${
          active
            ? "text-indigo-500"
            : "text-slate-400"
        }`}
      />
    </button>
  );
}

// =============================================================
// FILTER CHIP
// =============================================================

function FilterChip({
  label,
  onRemove,
}) {
  return (
    <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 text-[10px] font-extrabold text-indigo-600">

      <span>
        {label}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 transition hover:bg-indigo-200"
      >
        <FaTimes
          size={7}
        />
      </button>

    </div>
  );
}

// =============================================================
// EMPTY PRODUCTS
// =============================================================

function EmptyProducts({
  categoryName,
  onClear,
  onFilter,
}) {
  return (
    <section className="flex min-h-[500px] items-center justify-center">

      <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">

        <Lottie
          animationData={notfound}
          loop
          className="mx-auto w-48 sm:w-56"
        />

        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-indigo-500">
          {categoryName}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          No Products Found
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          We couldn't find products matching your current selection.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">

          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            Clear Filters
          </button>

          <button
            type="button"
            onClick={onFilter}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
          >

            <MdTune
              size={16}
            />

            Change Filters

          </button>

        </div>

      </div>

    </section>
  );
}

