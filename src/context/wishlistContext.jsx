import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const WishlistContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getProductPrice = (product) => {
  if (!product) return 0;

  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant?.isActive !== false)
    : [];

  if (variants.length === 0) return 0;

  const prices = variants
    .map((variant) => Number(variant.price))
    .filter((price) => !Number.isNaN(price) && price >= 0);

  if (prices.length === 0) return 0;

  return Math.min(...prices);
};

const getProductImage = (product) => {
  if (!product) return "";

  if (product.media?.thumbnail) {
    return product.media.thumbnail;
  }

  if (
    Array.isArray(product.media?.images) &&
    product.media.images.length > 0
  ) {
    return product.media.images[0];
  }

  if (Array.isArray(product.variants)) {
    const variantWithImage = product.variants.find(
      (variant) => Array.isArray(variant.images) && variant.images.length > 0
    );

    if (variantWithImage) {
      return variantWithImage.images[0];
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const fetchUser = async (token) => {
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to fetch user");
  }

  return data.user;
};

const fetchWishlist = async (token) => {
  const res = await fetch(`${BACKEND_URL}/api/wishlist`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to fetch wishlist"
    );
  }

  return data.items || data.wishlist?.items || [];
};

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export const WishlistProvider = ({ children }) => {
  const queryClient = useQueryClient();

  /*
  |--------------------------------------------------------------------------
  | TOKEN
  |--------------------------------------------------------------------------
  */

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | USER QUERY
  |--------------------------------------------------------------------------
  */

  const userQuery = useQuery({
    queryKey: ["currentUser", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const user = token ? userQuery.data ?? null : null;

  /*
  |--------------------------------------------------------------------------
  | WISHLIST QUERY
  |--------------------------------------------------------------------------
  |
  | Cached per authenticated user.
  |
  | Product page -> Wishlist page -> Product page
  | won't repeatedly call GET /api/wishlist while cached data is fresh.
  |
  */

  const wishlistQuery = useQuery({
    queryKey: ["wishlist", token],
    queryFn: () => fetchWishlist(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const wishlist = token ? wishlistQuery.data ?? [] : [];

  /*
  |--------------------------------------------------------------------------
  | UPDATE CACHE FROM MUTATION RESPONSE
  |--------------------------------------------------------------------------
  */

  const updateWishlistFromResponse = useCallback(
    (data) => {
      const items = data?.wishlist?.items || data?.items || [];

      queryClient.setQueryData(["wishlist", token], items);

      return items;
    },
    [queryClient, token]
  );

  /*
  |--------------------------------------------------------------------------
  | ADD TO WISHLIST
  |--------------------------------------------------------------------------
  */

  const addToWishlist = useCallback(
    async (product) => {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (!product?._id) {
        toast.error("Invalid product");
        return;
      }

      const exists = wishlist.some(
        (item) =>
          String(item.productId?._id || item.productId) ===
          String(product._id)
      );

      if (exists) {
        toast("Already in Wishlist ❤️");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/wishlist/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message || data.error || "Failed to add wishlist"
          );
          return;
        }

        updateWishlistFromResponse(data);

        toast.success("Added to Wishlist ❤️");
      } catch (error) {
        console.error("Add wishlist error:", error);
        toast.error("Failed to add wishlist");
      }
    },
    [token, wishlist, updateWishlistFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | REMOVE FROM WISHLIST
  |--------------------------------------------------------------------------
  */

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/wishlist/remove`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(
            data.message ||
              data.error ||
              "Failed to remove wishlist item"
          );
          return;
        }

        updateWishlistFromResponse(data);

        toast("Removed from Wishlist 💔");
      } catch (error) {
        console.error("Remove wishlist error:", error);
        toast.error("Failed to remove wishlist item");
      }
    },
    [token, updateWishlistFromResponse]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR WISHLIST
  |--------------------------------------------------------------------------
  */

  const clearWishlist = useCallback(async () => {
    if (!token) {
      queryClient.setQueryData(["wishlist", token], []);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/wishlist/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data.message || "Failed to clear wishlist"
        );
        return;
      }

      queryClient.setQueryData(["wishlist", token], []);

      toast("Wishlist Cleared 🧹");
    } catch (error) {
      console.error("Clear wishlist error:", error);
      toast.error("Failed to clear wishlist");
    }
  }, [token, queryClient]);

  /*
  |--------------------------------------------------------------------------
  | CHECK WISHLIST
  |--------------------------------------------------------------------------
  */

  const isInWishlist = useCallback(
    (productId) => {
      return wishlist.some(
        (item) =>
          String(item.productId?._id || item.productId) ===
          String(productId)
      );
    },
    [wishlist]
  );

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const wishlistCount = wishlist.length;

  /*
  |--------------------------------------------------------------------------
  | PROVIDER VALUE
  |--------------------------------------------------------------------------
  */

  const contextValue = useMemo(
    () => ({
      wishlist,
      user,

      addToWishlist,
      removeFromWishlist,
      clearWishlist,

      isInWishlist,
      wishlistCount,

      getProductPrice,
      getProductImage,

      token,

      // Optional loading/error helpers for pages that need them.
      wishlistLoading: wishlistQuery.isLoading,
      wishlistFetching: wishlistQuery.isFetching,
      wishlistError: wishlistQuery.error?.message || null,
      refetchWishlist: wishlistQuery.refetch,

      userLoading: userQuery.isLoading,
      userFetching: userQuery.isFetching,
      userError: userQuery.error?.message || null,
      refetchUser: userQuery.refetch,
    }),
    [
      wishlist,
      user,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      isInWishlist,
      wishlistCount,
      token,
      wishlistQuery.isLoading,
      wishlistQuery.isFetching,
      wishlistQuery.error,
      wishlistQuery.refetch,
      userQuery.isLoading,
      userQuery.isFetching,
      userQuery.error,
      userQuery.refetch,
    ]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| CUSTOM HOOK
|--------------------------------------------------------------------------
*/

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
};
