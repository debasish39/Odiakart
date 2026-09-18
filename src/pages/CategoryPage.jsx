import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  Flame,
  Grid2X2,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";

/* =========================================================
   OdiKart - Modern Category Page
   ---------------------------------------------------------
   No api.js / categories.js / products.js required.
   Uses the same fetch architecture as your notification API.
========================================================= */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

const getToken = () => localStorage.getItem("token");

const request = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

/* Change only these paths if your backend uses different routes. */
const getCategories = () => request("/api/category");
const getProducts = () => request("/api/products");

/* =========================================================
   FALLBACK IMAGES
========================================================= */

const FALLBACK_CATEGORY_IMAGES = {
  "for you":
    "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
  grocery:
    "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
  fashion:
    "https://cdn-icons-png.flaticon.com/512/3050/3050250.png",
  mobiles:
    "https://cdn-icons-png.flaticon.com/512/545/545245.png",
  appliances:
    "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
  electronics:
    "https://cdn-icons-png.flaticon.com/512/3659/3659898.png",
  "smart gadgets":
    "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  home:
    "https://cdn-icons-png.flaticon.com/512/1946/1946436.png",
  "beauty & personal care":
    "https://cdn-icons-png.flaticon.com/512/3050/3050248.png",
  "toys & baby care":
    "https://cdn-icons-png.flaticon.com/512/3081/3081556.png",
};

const FALLBACK_PRODUCT_IMAGES = [
  "https://dummyimage.com/600x600/f5f7fb/64748b&text=OdiKart",
  "https://dummyimage.com/600x600/f1f5f9/64748b&text=Product",
  "https://dummyimage.com/600x600/f8fafc/64748b&text=OdiKart",
];

/* =========================================================
   HELPERS
========================================================= */

function getCategoryId(category) {
  return String(
    category?._id ||
      category?.id ||
      category?.categoryId ||
      ""
  );
}

function getCategoryName(category) {
  return (
    category?.name ||
    category?.title ||
    category?.categoryName ||
    "Category"
  );
}

function getCategoryImage(category) {
  const direct =
    category?.image ||
    category?.imageUrl ||
    category?.thumbnail ||
    category?.icon;

  if (direct) return direct;

  return (
    FALLBACK_CATEGORY_IMAGES[
      getCategoryName(category).trim().toLowerCase()
    ] ||
    FALLBACK_CATEGORY_IMAGES["for you"]
  );
}

function getProductId(product) {
  return String(
    product?._id ||
      product?.id ||
      product?.productId ||
      ""
  );
}

function getProductName(product) {
  return (
    product?.title ||
    product?.name ||
    product?.productName ||
    "Product"
  );
}

function getProductImage(product, index = 0) {
  const mediaImages = product?.media?.images;
  const productImages = product?.images;

  return (
    product?.media?.thumbnail ||
    (Array.isArray(mediaImages) ? mediaImages[0] : "") ||
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    (Array.isArray(productImages) ? productImages[0] : "") ||
    FALLBACK_PRODUCT_IMAGES[
      index % FALLBACK_PRODUCT_IMAGES.length
    ]
  );
}

function getProductPrice(product) {
  if (
    product?.price !== undefined &&
    product?.price !== null
  ) {
    return Number(product.price) || 0;
  }

  if (
    Array.isArray(product?.variants) &&
    product.variants.length
  ) {
    return Number(product.variants[0]?.price) || 0;
  }

  return 0;
}

function getOriginalPrice(product) {
  if (
    product?.originalPrice !== undefined &&
    product?.originalPrice !== null
  ) {
    return Number(product.originalPrice) || 0;
  }

  if (
    product?.mrp !== undefined &&
    product?.mrp !== null
  ) {
    return Number(product.mrp) || 0;
  }

  if (
    Array.isArray(product?.variants) &&
    product.variants.length
  ) {
    const variant = product.variants[0];

    return (
      Number(
        variant?.originalPrice ??
          variant?.mrp ??
          variant?.price
      ) || 0
    );
  }

  return 0;
}

function getDiscountPercentage(product) {
  if (
    product?.discountPercentage !== undefined &&
    product?.discountPercentage !== null
  ) {
    return Number(product.discountPercentage) || 0;
  }

  if (
    product?.discount !== undefined &&
    product?.discount !== null
  ) {
    return Number(product.discount) || 0;
  }

  const price = getProductPrice(product);
  const original = getOriginalPrice(product);

  if (original > price && price > 0) {
    return Math.round(
      ((original - price) / original) * 100
    );
  }

  return 0;
}

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return <span className="inline-flex items-center whitespace-nowrap">₹ 0</span>;
  }

  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <FaRupeeSign className="shrink-0 text-[0.85em]" />
      <span>{Math.round(amount).toLocaleString("en-IN")}</span>
    </span>
  );
}

function getProductCategoryId(product) {
  const category =
    product?.category ??
    product?.categoryId ??
    product?.category_id;

  if (category && typeof category === "object") {
    return String(
      category?._id ||
        category?.id ||
        category?.categoryId ||
        ""
    );
  }

  return String(category || "");
}

function getProductCategoryName(product) {
  const category =
    product?.category ??
    product?.categoryName ??
    product?.category_name;

  if (category && typeof category === "object") {
    return String(
      category?.name ||
        category?.title ||
        ""
    )
      .trim()
      .toLowerCase();
  }

  return String(category || "")
    .trim()
    .toLowerCase();
}

function extractArray(response, keys = []) {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

/* =========================================================
   MODERN CATEGORY ICON
========================================================= */

function CategoryIcon({ category, active = false }) {
  const [failed, setFailed] = useState(false);

  const image = getCategoryImage(category);
  const name = getCategoryName(category);

  return (
    <div
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 ${
        active
          ? "border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm"
          : "border-slate-100 bg-gradient-to-br from-violet-50 via-indigo-50/60 to-blue-50 text-indigo-500 group-hover:border-indigo-200 group-hover:from-violet-100 group-hover:via-indigo-50 group-hover:to-blue-50"
      }`}
    >
      {!failed ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
          onError={() => setFailed(true)}
        />
      ) : (
        <Grid2X2 size={19} />
      )}
    </div>
  );
}


/* =========================================================
   SHARED UI
========================================================= */

function AppHeader({ search, setSearch }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-[0_2px_14px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-2 px-3 sm:h-[74px] sm:gap-3 sm:px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 active:scale-95"
        >
          <span className="text-[28px] leading-none">‹</span>
        </button>

        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands & categories"
            aria-label="Search products, brands and categories"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-blue-50/70 pl-10 pr-4 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:h-12 sm:text-[14px]"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate("/cart")}
          aria-label="Cart"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-800 transition hover:bg-slate-100 active:scale-95"
        >
          <ShoppingCart size={23} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

function CategoryRail({ categories, selectedCategory, onCategoryClick }) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.045)] sm:rounded-3xl">
      <div className="hidden shrink-0 border-b border-slate-100 px-4 py-4 lg:block">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
          Browse
        </p>
        <div className="mt-0.5 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-slate-900">Categories</h2>
          <Grid2X2 size={17} className="text-slate-400" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2 sm:px-1.5 lg:px-2.5 lg:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onCategoryClick(null)}
          className={`group relative mb-1 flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-all duration-200 sm:min-h-[82px] lg:min-h-[70px] lg:flex-row lg:justify-start lg:gap-3 lg:px-2.5 lg:text-left ${
            !selectedCategory
              ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-blue-100"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
              !selectedCategory
                ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200/50"
                : "bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 text-indigo-500"
            }`}
          >
            <Grid2X2 size={22} />
          </span>
          <span className="text-[10px] font-bold leading-3.5 sm:text-[10px] lg:text-[11px]">
            All
          </span>
        </button>

        {categories.map((category, index) => {
          const id = getCategoryId(category);
          const active = selectedCategory === id;

          return (
            <button
              type="button"
              key={id || `category-${index}`}
              onClick={() => onCategoryClick(category)}
              className={`group relative mb-1 flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-all duration-200 sm:min-h-[82px] lg:min-h-[70px] lg:flex-row lg:justify-start lg:gap-3 lg:px-2.5 lg:text-left ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CategoryIcon category={category} active={active} />

              <span className="line-clamp-2 max-w-full text-[9px] font-semibold leading-3.5 sm:text-[10px] lg:flex-1 lg:text-[11px] lg:leading-4">
                {getCategoryName(category)}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

/* =========================================================
   SKELETON — mirrors the real two-pane layout
========================================================= */

function CategorySkeleton() {
  const Skeleton = ({ className = "" }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 animate-pulse ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-50/50 via-indigo-50/30 to-blue-50/50 text-slate-900">
      <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white px-3 py-3 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
          <Skeleton className="h-11 min-w-0 flex-1 rounded-2xl sm:h-12" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        </div>
      </div>

      <div className="mx-auto grid h-[calc(100vh-68px)] min-h-0 max-w-[1500px] grid-cols-[92px_minmax(0,1fr)] gap-2 overflow-hidden px-2 py-2 sm:h-[calc(100vh-74px)] sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-3 sm:px-3 sm:py-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4 lg:px-5 lg:py-4">
        <aside className="flex min-h-0 h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:rounded-3xl sm:p-2">
          <div className="hidden shrink-0 border-b border-slate-100 px-3 py-3 lg:block">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-hidden py-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex min-h-[76px] flex-col items-center justify-center gap-1 lg:min-h-[70px] lg:flex-row lg:justify-start lg:gap-3 lg:px-2">
                <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                <Skeleton className={`hidden h-3 rounded lg:block ${i % 3 === 0 ? "w-24" : i % 3 === 1 ? "w-20" : "w-28"}`} />
                <Skeleton className="h-2 w-8 lg:hidden" />
              </div>
            ))}
          </div>
        </aside>

        <main className="min-h-0 h-full overflow-y-auto overscroll-contain">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <div className="flex min-w-0 flex-1 gap-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-16 shrink-0 rounded-xl sm:w-20" />
              ))}
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-sm"
              >
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="space-y-2 px-1 pb-2 pt-3">
                  <Skeleton className="h-3 w-[88%]" />
                  <Skeleton className="h-3 w-[62%]" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product, index }) {
  const navigate = useNavigate();
  const productId = getProductId(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscountPercentage(product);
  const image = getProductImage(product, index);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => productId && navigate(`/products/${productId}`)}
      disabled={!productId}
      className="group relative min-w-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-2 text-left shadow-[0_4px_18px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <div className="relative aspect-square overflow-hidden rounded-[19px] bg-slate-50">
        <img
          src={
            imageFailed
              ? FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length]
              : image
          }
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.04]"
          onError={() => setImageFailed(true)}
        />

        {discount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-2 py-1 text-[8px] font-extrabold tracking-wide text-white shadow-sm sm:text-[9px]">
            {Math.round(discount)}% OFF
          </span>
        )}

        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md backdrop-blur-sm transition group-hover:text-indigo-600">
          <Sparkles size={13} />
        </span>
      </div>

      <div className="px-1  pt-0.5">
        <h3 className="line-clamp-2 min-h-[34px] text-[12px] font-bold leading-[17px] text-slate-800 sm:text-[13px]">
          {name}
        </h3>

        <div className="flex min-w-0 items-baseline gap-1.5">
          <strong className="text-[14px] font-extrabold text-slate-950 sm:text-[15px]">
            {formatPrice(price)}
          </strong>

          {originalPrice > price && (
            <span className="truncate text-[9px] font-medium text-slate-400 line-through sm:text-[10px]">
              ₹{Math.round(originalPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Grid2X2 size={26} />
        </div>
        <strong className="text-[13px] font-bold text-slate-700">
          No products here yet
        </strong>
        <span className="mt-1 max-w-[260px] text-[10px] leading-4 text-slate-400">
          Try another category or explore all products.
        </span>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product, index) => (
        <ProductCard
          key={getProductId(product) || `product-${index}`}
          product={product}
          index={index}
        />
      ))}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [categoryResponse, productResponse] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);

      setCategories(
        extractArray(categoryResponse, ["categories", "category", "data"])
      );

      setProducts(
        extractArray(productResponse, ["products", "product", "data"])
      );
    } catch (err) {
      console.error("CATEGORY PAGE ERROR:", err);
      setError(err?.message || "Unable to load categories and products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return products;

    const selected = categories.find(
      (category) => getCategoryId(category) === selectedCategory
    );

    if (!selected) return products;

    const selectedName = getCategoryName(selected).trim().toLowerCase();

    return products.filter((product) => {
      const categoryId = getProductCategoryId(product);
      const categoryName = getProductCategoryName(product);

      return (
        categoryId === selectedCategory || categoryName === selectedName
      );
    });
  }, [products, categories, selectedCategory]);

  const searchedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categoryProducts;

    return categoryProducts.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const category = getProductCategoryName(product);

      return name.includes(query) || category.includes(query);
    });
  }, [categoryProducts, search]);

  const visibleProducts = useMemo(() => {
    const list = searchedProducts;

    if (activeView === "new") {
      return [...list]
        .sort((a, b) => {
          const aDate = new Date(
            a?.createdAt || a?.created_at || 0
          ).getTime();
          const bDate = new Date(
            b?.createdAt || b?.created_at || 0
          ).getTime();
          return bDate - aDate;
        })
        .slice(0, 18);
    }

    if (activeView === "deal") {
      return [...list]
        .filter((product) => getDiscountPercentage(product) > 0)
        .sort(
          (a, b) =>
            getDiscountPercentage(b) - getDiscountPercentage(a)
        )
        .slice(0, 18);
    }

    if (activeView === "recent") {
      return [...list].slice(0, 12);
    }

    return list.slice(0, 24);
  }, [searchedProducts, activeView]);

  const selectedCategoryObject = categories.find(
    (category) => getCategoryId(category) === selectedCategory
  );

  const handleCategoryClick = (category) => {
    const id = category ? getCategoryId(category) : "";
    setSelectedCategory(id === selectedCategory ? "" : id);

    requestAnimationFrame(() => {
      document
        .querySelector("[data-products-pane]")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (loading) return <CategorySkeleton />;

  return (
    <div className="min-h-screen mt-3 w-full overflow-hidden bg-gradient-to-br from-violet-50/50 via-indigo-50/30 to-blue-50/50 text-slate-900">
    
      <div className="mx-auto grid h-[calc(100vh-68px)] min-h-0 max-w-[1500px] grid-cols-[92px_minmax(0,1fr)] gap-2 overflow-hidden px-2 py-2 sm:h-[calc(100vh-74px)] sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-3 sm:px-3 sm:py-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4 lg:px-5 lg:py-4">
        {/* LEFT: independently scrollable category rail */}
        <CategoryRail
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        {/* RIGHT: independently scrollable product area */}
        <main
          data-products-pane
          className="min-h-0 h-full overflow-y-auto overscroll-contain pr-0.5 sm:pr-1 [scrollbar-width:thin]"
        >
          <div className="pb-8 mt-3">
           

            {/* Active filters */}
            {(selectedCategory || search) && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4">
                {selectedCategory && (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700">
                    <Tag size={12} />
                    <span className="max-w-[140px] truncate">
                      {getCategoryName(selectedCategoryObject || {})}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className="rounded-full p-0.5 hover:bg-indigo-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {search && (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                    <Search size={12} />
                    <span className="max-w-[140px] truncate">{search}</span>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="rounded-full p-0.5 hover:bg-slate-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setSearch("");
                  }}
                  className="rounded-full px-2 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Heading */}
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  {selectedCategoryObject
                    ? getCategoryName(selectedCategoryObject)
                    : "Explore"}
                </p>
                <h1 className="mt-0.5 truncate text-[16px] font-extrabold text-slate-900 sm:text-[18px]">
                  {activeView === "deal"
                    ? "Deals & Offers"
                    : activeView === "new"
                    ? "New Arrivals"
                    : activeView === "recent"
                    ? "Recently Added"
                    : "All Products"}
                </h1>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                {visibleProducts.length} products
              </span>
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-red-700">
                <div className="min-w-0">
                  <strong className="text-[11px] font-bold">
                    Couldn't load products
                  </strong>
                  <p className="mt-0.5 truncate text-[10px] text-red-500">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadData()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-red-600 shadow-sm hover:bg-red-100"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            )}

            <ProductGrid products={visibleProducts} />
          </div>
        </main>
      </div>
    </div>
  );
}
