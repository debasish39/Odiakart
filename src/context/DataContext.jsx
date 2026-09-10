import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import { toast } from "react-hot-toast";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const DataContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* =====================================================
   HELPERS
===================================================== */

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || "");
  }

  return String(value);
};

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

/* =====================================================
   PRODUCT HELPERS
===================================================== */

const getProductPrice = (product) => {
  if (!product) return 0;

  const variants = Array.isArray(product.variants)
    ? product.variants.filter(
        (variant) => variant?.isActive !== false
      )
    : [];

  if (variants.length === 0) return 0;

  const prices = variants
    .map((variant) => Number(variant?.price))
    .filter(
      (price) => !Number.isNaN(price) && price >= 0
    );

  return prices.length ? Math.min(...prices) : 0;
};

const getProductOriginalPrice = (product) => {
  if (!product?.variants?.length) return 0;

  const variants = product.variants.filter(
    (variant) => variant?.isActive !== false
  );

  const prices = variants
    .map((variant) => Number(variant?.originalPrice))
    .filter(
      (price) => !Number.isNaN(price) && price > 0
    );

  return prices.length ? Math.min(...prices) : 0;
};

const getProductStock = (product) => {
  if (!product?.variants?.length) return 0;

  return product.variants
    .filter(
      (variant) => variant?.isActive !== false
    )
    .reduce(
      (total, variant) =>
        total + Number(variant?.stock || 0),
      0
    );
};

const getProductImage = (product) => {
  if (!product) return "";

  if (product?.media?.thumbnail) {
    return product.media.thumbnail;
  }

  if (
    Array.isArray(product?.media?.images) &&
    product.media.images.length > 0
  ) {
    return product.media.images[0];
  }

  if (
    Array.isArray(product?.variants) &&
    product.variants.length > 0
  ) {
    const variantWithImage =
      product.variants.find(
        (variant) =>
          Array.isArray(variant?.images) &&
          variant.images.length > 0
      );

    if (variantWithImage) {
      return variantWithImage.images[0];
    }
  }

  return "";
};

/* =====================================================
   API FETCHERS
===================================================== */

const fetchProducts = async (searchValue = "") => {
  const params = new URLSearchParams();

  if (searchValue.trim()) {
    params.set("search", searchValue.trim());
  }

  const url = `${BACKEND_URL}/api/products${
    params.toString()
      ? `?${params.toString()}`
      : ""
  }`;

  const res = await axios.get(url);

  const rawProducts = Array.isArray(
    res.data?.products
  )
    ? res.data.products
    : [];

  return rawProducts.map((product) => ({
    ...product,
    displayPrice: getProductPrice(product),
    originalPrice: getProductOriginalPrice(product),
    totalStock: getProductStock(product),
    image: getProductImage(product),
  }));
};

const fetchCategories = async () => {
  const res = await axios.get(
    `${BACKEND_URL}/api/category`
  );

  return Array.isArray(res.data?.categories)
    ? res.data.categories
    : [];
};

/* =====================================================
   DATA PROVIDER
===================================================== */

export const DataProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] =
    useState("All");
  const [brand, setBrand] = useState("All");
  const [priceRange, setPriceRange] =
    useState([0, 100000]);

  /* ===================================================
     PRODUCTS QUERY
  =================================================== */

  const productsQuery = useQuery({
    queryKey: ["products", search.trim()],
    queryFn: () => fetchProducts(search),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) =>
      previousData,
  });

  /* ===================================================
     CATEGORIES QUERY
  =================================================== */

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const data = useMemo(
    () =>
      Array.isArray(productsQuery.data)
        ? productsQuery.data
        : [],
    [productsQuery.data]
  );

  const categories = useMemo(
    () =>
      Array.isArray(categoriesQuery.data)
        ? categoriesQuery.data
        : [],
    [categoriesQuery.data]
  );

  const loading =
    productsQuery.isLoading ||
    productsQuery.isFetching;

  const categoriesLoading =
    categoriesQuery.isLoading ||
    categoriesQuery.isFetching;

  const error = productsQuery.error
    ? productsQuery.error?.message ||
      "Failed to fetch products"
    : null;

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categoryOnlyData = useMemo(
    () => categories,
    [categories]
  );

  /* =====================================================
     UNIQUE SUBCATEGORIES
  ===================================================== */

  const subCategoryOnlyData = useMemo(() => {
    const subCategoryMap = new Map();

    data.forEach((item) => {
      if (!item?.subCategory) return;

      const id = getId(item.subCategory);
      if (!id) return;

      const name =
        typeof item.subCategory === "object"
          ? item.subCategory?.name
          : String(item.subCategory);

      subCategoryMap.set(id, {
        _id: id,
        name: name || "Unnamed Subcategory",
      });
    });

    return [...subCategoryMap.values()];
  }, [data]);

  /* =====================================================
     UNIQUE BRANDS
  ===================================================== */

  const brandOnlyData = useMemo(() => {
    const brands = data
      .map((item) => item?.brand)
      .filter(
        (brandName) =>
          typeof brandName === "string" &&
          brandName.trim() !== ""
      );

    return [...new Set(brands)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [data]);

  /* =====================================================
     FILTERED PRODUCTS
  ===================================================== */

  const filteredData = useMemo(() => {
    let temp = [...data];

    if (
      category &&
      category !== "All"
    ) {
      const selectedCategory = String(category);

      temp = temp.filter(
        (item) =>
          getId(item?.category) ===
          selectedCategory
      );
    }

    if (
      subCategory &&
      subCategory !== "All"
    ) {
      const selectedSubCategory =
        String(subCategory);

      temp = temp.filter(
        (item) =>
          getId(item?.subCategory) ===
          selectedSubCategory
      );
    }

    if (
      brand &&
      brand !== "All"
    ) {
      const selectedBrand =
        normalizeText(brand);

      temp = temp.filter(
        (item) =>
          normalizeText(item?.brand) ===
          selectedBrand
      );
    }

    temp = temp.filter((item) => {
      const price = Number(
        item?.displayPrice || 0
      );

      return (
        price >=
          Number(priceRange?.[0] || 0) &&
        price <=
          Number(
            priceRange?.[1] || 100000
          )
      );
    });

    if (sort === "low-high") {
      temp.sort(
        (a, b) =>
          Number(a.displayPrice || 0) -
          Number(b.displayPrice || 0)
      );
    }

    if (sort === "high-low") {
      temp.sort(
        (a, b) =>
          Number(b.displayPrice || 0) -
          Number(a.displayPrice || 0)
      );
    }

    if (sort === "rating") {
      temp.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );
    }

    if (sort === "newest") {
      temp.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    if (sort === "best-selling") {
      temp.sort(
        (a, b) =>
          Number(
            b.analytics?.sales || 0
          ) -
          Number(
            a.analytics?.sales || 0
          )
      );
    }

    return temp;
  }, [
    data,
    category,
    subCategory,
    brand,
    priceRange,
    sort,
  ]);

  /* =====================================================
     EVENT HANDLERS
  ===================================================== */

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleSubCategoryChange = (e) => {
    setSubCategory(e.target.value);
  };

  const handleBrandChange = (e) => {
    setBrand(e.target.value);
  };

  /* =====================================================
     MANUAL PRODUCT REFRESH

     Existing components can continue calling
     fetchAllProducts().
  ===================================================== */

  const fetchAllProducts = async (
    searchValue = search
  ) => {
    const normalizedSearch =
      String(searchValue || "").trim();

    try {
      setSearch(normalizedSearch);

      await queryClient.invalidateQueries({
        queryKey: [
          "products",
          normalizedSearch,
        ],
      });

      return await queryClient.fetchQuery({
        queryKey: [
          "products",
          normalizedSearch,
        ],
        queryFn: () =>
          fetchProducts(normalizedSearch),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      });
    } catch (err) {
      console.error(
        "FETCH PRODUCTS ERROR:",
        err
      );

      toast.error(
        "Failed to fetch products"
      );

      throw err;
    }
  };

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = {
    data,
    loading,
    error,
    fetchAllProducts,

    search,
    setSearch,

    category,
    setCategory,

    subCategory,
    setSubCategory,

    brand,
    setBrand,

    priceRange,
    setPriceRange,

    sort,
    setSort,

    handleCategoryChange,
    handleSubCategoryChange,
    handleBrandChange,

    categoryOnlyData,
    categories,
    categoriesLoading,
    subCategoryOnlyData,
    brandOnlyData,

    filteredData,

    getProductPrice,
    getProductOriginalPrice,
    getProductStock,
    getProductImage,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

/* =====================================================
   HOOK
===================================================== */

export const getData = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      "getData must be used inside DataProvider"
    );
  }

  return context;
};
