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
import "./CategoryPage.css";
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
    return <>₹ 0</>;
  }

  return (
    <>
     <span className="price-inline">
  <FaRupeeSign className="price-rupee-icon" />
  <span>{Math.round(amount).toLocaleString("en-IN")}</span>
</span>
    </>
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

function CategoryIcon({ category }) {
  const [failed, setFailed] = useState(false);

  const image = getCategoryImage(category);
  const name = getCategoryName(category);

  return (
    <div className="category-icon-box">
      {!failed ? (
        <img
          src={image}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : (
        <Grid2X2 size={22} />
      )}
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function CategorySkeleton() {
  return (
    <div className="modern-category-page">
      <div className="category-mobile-header skeleton-header" />

      <div className="category-skeleton-categories">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton-category-pill" key={i}>
            <div className="skeleton skeleton-round" />
            <div className="skeleton skeleton-text" />
          </div>
        ))}
      </div>

      <div className="category-skeleton-toolbar">
        <div className="skeleton skeleton-toolbar-title" />
        <div className="skeleton skeleton-toolbar-filter" />
      </div>

      <div className="category-skeleton-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div className="skeleton-product-card" key={i}>
            <div className="skeleton skeleton-product-image" />
            <div className="skeleton skeleton-product-line" />
            <div className="skeleton skeleton-product-line short" />
            <div className="skeleton skeleton-product-price" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MODERN PRODUCT CARD
========================================================= */

function ProductCard({ product, index }) {
  const navigate = useNavigate();

  const productId = getProductId(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscountPercentage(product);
  const image = getProductImage(product, index);

  const [imageFailed, setImageFailed] =
    useState(false);

  const handleClick = () => {
    if (!productId) return;
    navigate(`/products/${productId}`);
  };

  return (
    <button
      type="button"
      className="modern-product-card"
      onClick={handleClick}
      disabled={!productId}
    >
      <div className="modern-product-media">
        <img
          src={
            imageFailed
              ? FALLBACK_PRODUCT_IMAGES[
                  index % FALLBACK_PRODUCT_IMAGES.length
                ]
              : image
          }
          alt={name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />

        {discount > 0 && (
          <span className="discount-pill">
            {Math.round(discount)}% OFF
          </span>
        )}

       
      </div>

      <div className="modern-product-info">
        <h3>{name}</h3>

        <div className="modern-price">
          <strong>{formatPrice(price)}</strong>

          {originalPrice > price && (
            <span>
              <span>{originalPrice}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   PRODUCT GRID
========================================================= */

function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="modern-empty">
        <div className="empty-icon">
          <Grid2X2 size={25} />
        </div>

        <strong>No products here yet</strong>

        <span>
          Try another category or explore all products.
        </span>
      </div>
    );
  }

  return (
    <div className="modern-product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={
            getProductId(product) ||
            `product-${index}`
          }
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

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [activeView, setActiveView] =
    useState("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          categoryResponse,
          productResponse,
        ] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        console.log(
          "ODIKART CATEGORY RESPONSE:",
          categoryResponse
        );

        console.log(
          "ODIKART PRODUCT RESPONSE:",
          productResponse
        );

        setCategories(
          extractArray(categoryResponse, [
            "categories",
            "category",
            "data",
          ])
        );

        setProducts(
          extractArray(productResponse, [
            "products",
            "product",
            "data",
          ])
        );
      } catch (err) {
        console.error(
          "CATEGORY PAGE ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to load categories and products"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     CATEGORY FILTER
  ======================================================= */

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) {
      return products;
    }

    const selected =
      categories.find(
        (category) =>
          getCategoryId(category) ===
          selectedCategory
      );

    if (!selected) {
      return products;
    }

    const selectedName =
      getCategoryName(selected)
        .trim()
        .toLowerCase();

    return products.filter((product) => {
      const categoryId =
        getProductCategoryId(product);

      const categoryName =
        getProductCategoryName(product);

      return (
        categoryId === selectedCategory ||
        categoryName === selectedName
      );
    });
  }, [
    products,
    categories,
    selectedCategory,
  ]);

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const searchedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categoryProducts;
    }

    return categoryProducts.filter(
      (product) => {
        const name =
          getProductName(product)
            .toLowerCase();

        const category =
          getProductCategoryName(product);

        return (
          name.includes(query) ||
          category.includes(query)
        );
      }
    );
  }, [categoryProducts, search]);

  /* =======================================================
     VIEW FILTER
  ======================================================= */

  const visibleProducts = useMemo(() => {
    const list = searchedProducts;

    if (activeView === "new") {
      return [...list]
        .sort((a, b) => {
          const aDate =
            new Date(
              a?.createdAt ||
                a?.created_at ||
                0
            ).getTime();

          const bDate =
            new Date(
              b?.createdAt ||
                b?.created_at ||
                0
            ).getTime();

          return bDate - aDate;
        })
        .slice(0, 18);
    }

    if (activeView === "deal") {
      return [...list]
        .filter(
          (product) =>
            getDiscountPercentage(product) > 0
        )
        .sort(
          (a, b) =>
            getDiscountPercentage(b) -
            getDiscountPercentage(a)
        )
        .slice(0, 18);
    }

    if (activeView === "recent") {
      return [...list].slice(0, 12);
    }

    return list.slice(0, 24);
  }, [searchedProducts, activeView]);

  /* =======================================================
     SELECTED CATEGORY
  ======================================================= */

  const selectedCategoryObject =
    categories.find(
      (category) =>
        getCategoryId(category) ===
        selectedCategory
    );

  /* =======================================================
     CATEGORY CLICK
  ======================================================= */

  const handleCategoryClick = (category) => {
    const id = getCategoryId(category);

    setSelectedCategory(
      id === selectedCategory ? "" : id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return <CategorySkeleton />;
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="modern-category-page">

 
      {/* =================================================
          CATEGORY / PRODUCT LAYOUT
      ================================================= */}

      <div className="category-main-layout">

        <aside className="modern-category-sidebar">

          <div className="sidebar-top">
            <div>
              <span>BROWSE</span>
              <strong>Categories</strong>
            </div>

            <Grid2X2 size={19} />
          </div>

          <div className="desktop-category-list">

            <button
              type="button"
              className={`desktop-category-item ${
                !selectedCategory
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedCategory("")
              }
              aria-current={!selectedCategory ? "page" : undefined}
            >
              <div className="desktop-category-icon all">
                <Grid2X2 size={21} />
              </div>

              <span>All Products</span>

            
            </button>

            {categories.map(
              (category, index) => {
                const id =
                  getCategoryId(category);

                const active =
                  selectedCategory === id;

                return (
                  <button
                    type="button"
                    key={
                      id ||
                      `desktop-category-${index}`
                    }
                    className={`desktop-category-item ${
                      active ? "active" : ""
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                  >
                    <CategoryIcon
                      category={category}
                    />

                    <span>
                      {getCategoryName(
                        category
                      )}
                    </span>

                  </button>
                );
              }
            )}
          </div>
        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="modern-category-content">

          {/* =================================================
              MOBILE CATEGORIES
          ================================================= */}

          <div className="mobile-category-strip">

            <button
              type="button"
              className={`mobile-category-chip ${
                !selectedCategory
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedCategory("")
              }
            >
              <div className="mobile-chip-icon all">
                <Grid2X2 size={21} />
              </div>

              <span>All</span>
            </button>

            {categories.map(
              (category, index) => {
                const id =
                  getCategoryId(category);

                const active =
                  selectedCategory === id;

                return (
                  <button
                    type="button"
                    key={
                      id ||
                      `mobile-category-${index}`
                    }
                    className={`mobile-category-chip ${
                      active ? "active" : ""
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                  >
                    <CategoryIcon
                      category={category}
                    />

                    <span>
                      {getCategoryName(
                        category
                      )}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          {/* =================================================
              MODERN FILTER / VIEW BAR
          ================================================= */}

          <div className="category-toolbar">

            <div className="view-tabs">

              <button
                type="button"
                className={
                  activeView === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveView("all")
                }
              >
                <Grid2X2 size={16} />
                All
              </button>

              <button
                type="button"
                className={
                  activeView === "deal"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveView("deal")
                }
              >
                <Flame size={16} />
                Deals
              </button>

              <button
                type="button"
                className={
                  activeView === "new"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveView("new")
                }
              >
                <Sparkles size={16} />
                New
              </button>

              <button
                type="button"
                className={
                  activeView === "recent"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveView("recent")
                }
              >
                <Clock3 size={16} />
                Recent
              </button>
            </div>

        
          </div>

          {/* =================================================
              SELECTED FILTER
          ================================================= */}

          {(selectedCategory ||
            search) && (
            <div className="active-filter-row">

              {selectedCategory && (
                <span className="active-filter">
                  <Tag size={13} />

                  {getCategoryName(
                    selectedCategoryObject ||
                      {}
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCategory("")
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {search && (
                <span className="active-filter">
                  <Search size={13} />

                  {search}

                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                className="clear-all"
                onClick={() => {
                  setSelectedCategory("");
                  setSearch("");
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="category-error">
              <div>
                <strong>
                  Couldn't load products
                </strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadData()
                }
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="product-count-row">
            <span>
              {visibleProducts.length} products
            </span>

            <button
              type="button"
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />
            </button>
          </div>

          <ProductGrid
            products={visibleProducts}
          />

          {/* =================================================
              BOTTOM SPACE
          ================================================= */}

          <div className="category-bottom-space" />
        </main>
      </div>
    </div>
  );
}
