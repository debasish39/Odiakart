import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaHeart,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTrash,
  FaChevronRight,
  FaArrowRight,
  FaShieldAlt,
  FaTimes,
  FaGift,
  FaCreditCard,
  FaWallet,
  FaLanguage,
  FaLock,
  FaMobileAlt,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaCoins,
  FaHeadset,
} from "react-icons/fa";

import {
  MdOutlineLocalOffer,
} from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { AccountShell, api } from "./AccountShell";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const token = localStorage.getItem("token");

  // =========================================================
  // CURRENT USER
  // =========================================================

  const {
    data: user = null,
    isLoading: loading,
    error: userError,
  } = useQuery({
    queryKey: ["currentUser", token],

    queryFn: async () => {
      const data = await api("/api/auth/me");

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load profile");
      }

      return data.user;
    },

    enabled: !!token,

    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });

  // =========================================================
  // RECENTLY VIEWED PRODUCTS
  // =========================================================

  const {
    data: recentlyViewedData,
    isLoading: recentlyViewedLoading,
  } = useQuery({
    queryKey: ["recentlyViewed", token],

    queryFn: async () => {
      console.log("🟣 GET RECENTLY VIEWED START");

      // IMPORTANT:
      // Recently Viewed is cookie-based on the backend.
      // Use the same VITE_BACKEND_URL as SingleProduct.jsx and
      // explicitly include cookies so recentVisitorId is preserved.
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

      if (!BACKEND_URL) {
        throw new Error("VITE_BACKEND_URL is not configured");
      }

      const response = await fetch(
        `${BACKEND_URL}/api/products/recently-viewed`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log(
        "🟢 GET RECENTLY VIEWED STATUS:",
        response.status
      );

      const data = await response.json();

      console.log("🟢 GET RECENTLY VIEWED RESPONSE:", data);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to load recently viewed products"
        );
      }

      return data;
    },

    enabled: !!token,

    // Always fetch latest recently viewed products
    staleTime: 0,

    gcTime: 5 * 60 * 1000,

    refetchOnMount: "always",

    refetchOnWindowFocus: true,

    retry: 1,

    onError: (error) => {
      console.error("🔴 RECENTLY VIEWED GET ERROR:", error);
    },
  });

  /*
   * Your API returns:
   *
   * {
   *   success: true,
   *   products: [...]
   * }
   *
   * Therefore use data.products.
   */

  const recentlyViewedProducts = Array.isArray(
    recentlyViewedData?.products
  )
    ? recentlyViewedData.products
    : [];

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleSignOut = () => {
    setSigningOut(true);

    queryClient.removeQueries({
      queryKey: ["currentUser", token],
    });

    queryClient.removeQueries({
      queryKey: ["wishlist", token],
    });

    queryClient.removeQueries({
      queryKey: ["cart", token],
    });

    queryClient.removeQueries({
      queryKey: ["recentlyViewed", token],
    });

    localStorage.removeItem("token");

    setTimeout(() => {
      navigate("/sign-in", {
        replace: true,
      });
    }, 350);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && !user) {
    return (
      <AccountShell title="Account">
        <ProfileSkeleton />
      </AccountShell>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (userError && !user) {
    return (
      <AccountShell title="Account">
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#f7f8fa] px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FaUser size={19} />
            </div>

            <h2 className="text-[18px] font-bold text-slate-900">
              Unable to load your profile
            </h2>

            <p className="mt-2 text-[13px] leading-5 text-slate-500">
              Something went wrong while loading your account details.
            </p>

            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["currentUser", token],
                })
              }
              className="mt-6 h-11 rounded-lg bg-[#2874f0] px-6 text-[13px] font-semibold text-white"
            >
              Try again
            </button>

          </div>
        </div>
      </AccountShell>
    );
  }

  // =========================================================
  // USER INFO
  // =========================================================

  const name =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") || "Odikart User";

  const firstName =
    user?.firstName ||
    name.split(" ")[0] ||
    "there";

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <AccountShell title="Account">

      <div className="min-h-screen w-full bg-[#f6f7f9] pb-24 text-slate-800">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="border-b border-slate-100 bg-white px-4 pb-4 pt-4 sm:px-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-[15px] font-extrabold tracking-[-0.02em] text-slate-900">
                Hey, {firstName}
              </p>

              <p className="mt-1 text-[9px] text-slate-400">
                Manage your Odikart account
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/account/help")}
              className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[10px] font-bold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition active:scale-95"
            >
              <FaHeadset
                className="text-slate-500"
                size={10}
              />

              Help
            </button>

          </div>

        </section>

        {/* =====================================================
            ORDERS + WISHLIST
        ===================================================== */}

        <section className="border-b border-slate-100 bg-white px-4 pb-4 sm:px-6">

          <div className="grid grid-cols-2 gap-2.5">

            <QuickAction
              icon={<FaShoppingBag />}
              title="Orders"
              onClick={() => navigate("/account/orders")}
            />

            <QuickAction
              icon={<FaHeart />}
              title="Wishlist"
              onClick={() => navigate("/account/wishlist")}
            />

          </div>

        </section>

        {/* =====================================================
            RECENTLY VIEWED
        ===================================================== */}

        {(recentlyViewedLoading ||
          recentlyViewedProducts.length > 0) && (

          <section className="mt-2 border-y border-slate-100 bg-white py-4">

            {/* HEADER */}

            <div className="mb-3 flex items-center justify-between px-4 sm:px-6">

              <div>

                <h2 className="text-[14px] font-extrabold tracking-[-0.025em] text-slate-900">
                  Recently Viewed
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Pick up where you left off
                </p>

              </div>

              {recentlyViewedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-1 text-[9px] font-bold text-[#2874f0]"
                >
                  View all

                  <FaChevronRight size={7} />
                </button>
              )}

            </div>

            {/* =================================================
                SKELETON
            ================================================= */}

            {recentlyViewedLoading ? (

              <div className="flex gap-2.5 overflow-hidden px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {[1, 2, 3, 4].map((item) => (

                  <div
                    key={item}
                    className="w-[116px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
                  >

                    <div className="aspect-square animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100" />

                    <div className="p-2">

                      <div className="h-2.5 w-16 animate-pulse rounded-full bg-slate-100" />

                      <div className="mt-2 h-2 w-11 animate-pulse rounded-full bg-slate-100" />

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              /* =================================================
                 PRODUCT LIST
              ================================================= */

              <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">

                {recentlyViewedProducts.map((product) => {

                  const productId =
                    product?._id ||
                    product?.id;

                  if (!productId) {
                    return null;
                  }

                  // Collect all possible product images
                  const images = [
                    product?.media?.thumbnail,

                    ...(Array.isArray(
                      product?.media?.images
                    )
                      ? product.media.images
                      : []),

                    ...(Array.isArray(
                      product?.images
                    )
                      ? product.images
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

                    product?.image,

                    product?.thumbnail,
                  ].filter(Boolean);

                  const image =
                    images[0] ||
                    "https://via.placeholder.com/300x300?text=Product";

                  // Product name
                  const productName =
                    product?.title ||
                    product?.name ||
                    "Product";

                  // Find active variant
                  const activeVariant =
                    Array.isArray(product?.variants)
                      ? product.variants.find(
                          (variant) =>
                            variant?.isActive !== false
                        ) ||
                        product.variants[0]
                      : null;

                  // Product price
                  const price =
                    activeVariant?.price ??
                    product?.price ??
                    null;

                  // Category
                  const category =
                    product?.category?.name ||
                    product?.categoryName ||
                    product?.category ||
                    "";

                  return (

                    <button
                      key={productId}
                      type="button"

                      onClick={() =>
                        navigate(
                          `/products/${productId}`
                        )
                      }

                      className="group w-[116px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white text-left shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] active:scale-[0.98]"
                    >

                      {/* =================================================
                          IMAGE
                      ================================================= */}

                      <div className="relative aspect-square overflow-hidden bg-slate-50">

                        <img
                          src={image}
                          alt={productName}
                          loading="lazy"

                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"

                          onError={(event) => {
                            event.currentTarget.src =
                              "https://via.placeholder.com/300x300?text=Product";
                          }}
                        />

                        {/* Viewed Badge */}

                        <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[6.5px] font-bold text-slate-600 shadow-sm backdrop-blur-sm">
                          Viewed
                        </span>

                      </div>

                      {/* =================================================
                          PRODUCT INFO
                      ================================================= */}

                      <div className="p-2">

                        <p className="line-clamp-2 min-h-[24px] text-[8.5px] font-bold leading-[12px] text-slate-800">
                          {productName}
                        </p>

                        {category && (
                          <p className="mt-0.5 truncate text-[7px] text-slate-400">
                            {category}
                          </p>
                        )}

                        {price !== null && (
                          <p className="mt-1 text-[9px] font-extrabold text-slate-950">
                            ₹
                            {Number(
                              price
                            ).toLocaleString("en-IN")}
                          </p>
                        )}

                        <div className="mt-1.5 flex items-center justify-between">

                          <span className="text-[7px] font-medium text-slate-400">
                            View product
                          </span>

                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-[#2874f0] transition group-hover:bg-[#2874f0] group-hover:text-white">

                            <FaArrowRight size={7} />

                          </span>

                        </div>

                      </div>

                    </button>

                  );
                })}

              </div>

            )}

          </section>
        )}

        {/* =====================================================
            COUPONS
        ===================================================== */}

        <section className="mt-2 bg-white px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() => navigate("/coupons")}
            className="group flex w-full items-center justify-between rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-white px-3.5 py-3 shadow-[0_2px_10px_rgba(124,58,237,0.05)] transition hover:border-violet-200 hover:shadow-[0_5px_16px_rgba(124,58,237,0.08)] active:scale-[0.995]"
          >

            <div className="flex items-center gap-2.5">

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">

                <MdOutlineLocalOffer size={17} />

              </span>

              <span className="text-left">

                <span className="block text-[11px] font-bold text-slate-800">
                  Coupons & Offers
                </span>

                <span className="mt-0.5 block text-[9px] text-slate-500">
                  Explore and grab the best deals
                </span>

              </span>

            </div>

            <FaChevronRight
              size={9}
              className="text-slate-400"
            />

          </button>

        </section>

        {/* =====================================================
            PROFILE SETTINGS
        ===================================================== */}

        <AccountSection title="Profile Settings">

          <Tile
            icon={<FaUser />}
            title="Edit profile"
            sub="Name, phone number and photo"
            path="/account/personal-information"
            navigate={navigate}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <Tile
            icon={<FaMapMarkerAlt />}
            title="Saved addresses"
            sub="Manage your delivery addresses"
            path="/account/addresses"
            navigate={navigate}
            iconClassName="bg-cyan-50 text-cyan-600"
          />

          <Tile
            icon={<FaLanguage />}
            title="Change language"
            sub="English"
            path="/account/language"
            navigate={navigate}
            iconClassName="bg-violet-50 text-violet-600"
          />

          <Tile
            icon={<FaBell />}
            title="Notification settings"
            sub="Manage alerts and offers"
            path="/account/notifications"
            navigate={navigate}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <Tile
            icon={<FaCoins />}
            title="My subscriptions"
            sub="Manage Odikart membership"
            path="/account/subscriptions"
            navigate={navigate}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

        </AccountSection>

        {/* =====================================================
            PAYMENTS
        ===================================================== */}

        <AccountSection title="Payments & Wallets">

          <Tile
            icon={<FaGift />}
            title="Gift card"
            sub="Add or manage gift cards"
            path="/account/gift-card"
            navigate={navigate}
            iconClassName="bg-blue-50 text-blue-600"
            rightText="Add gift card"
          />

          <Tile
            icon={<FaCreditCard />}
            title="Saved payment methods"
            sub="Manage cards and payment preferences"
            path="/account/payment-methods"
            navigate={navigate}
            iconClassName="bg-indigo-50 text-indigo-600"
          />

          <Tile
            icon={<FaWallet />}
            title="Odikart Wallet"
            sub="View balance and wallet activity"
            path="/account/wallet"
            navigate={navigate}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

        </AccountSection>

        {/* =====================================================
            PRIVACY
        ===================================================== */}

        <AccountSection title="Privacy & Security">

          <Tile
            icon={<FaLock />}
            title="Privacy center"
            sub="Control your privacy preferences"
            path="/account/privacy"
            navigate={navigate}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <Tile
            icon={<FaMobileAlt />}
            title="Manage devices"
            sub="Review active signed-in devices"
            path="/account/devices"
            navigate={navigate}
            iconClassName="bg-slate-100 text-slate-600"
            rightText="Active devices"
          />

        </AccountSection>

        {/* =====================================================
            EARN WITH ODIKART
        ===================================================== */}

        <AccountSection title="Earn with Odikart">

          <Tile
            icon={<FaCoins />}
            title="Odikart affiliate program"
            sub="Earn rewards by sharing products"
            path="/affiliate"
            navigate={navigate}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <Tile
            icon={<FaShoppingBag />}
            title="Sell on Odikart"
            sub="Start selling your products"
            path="/seller"
            navigate={navigate}
            iconClassName="bg-blue-50 text-blue-600"
          />

        </AccountSection>

        {/* =====================================================
            FAQ
        ===================================================== */}

        <AccountSection title="FAQ & Terms">

          <Tile
            icon={<FaQuestionCircle />}
            title="FAQs"
            sub="Frequently asked questions"
            path="/faq"
            navigate={navigate}
            iconClassName="bg-cyan-50 text-cyan-600"
          />

          <Tile
            icon={<FaShieldAlt />}
            title="Terms, Policies & Licences"
            sub="Read Odikart's legal information"
            path="/account/legal"
            navigate={navigate}
            iconClassName="bg-slate-100 text-slate-600"
          />

        </AccountSection>

        {/* =====================================================
            ACTIVITY
        ===================================================== */}

        <AccountSection title="My Activity">

          <Tile
            icon={<FaQuestionCircle />}
            title="Questions & Answers"
            sub="Your product questions and answers"
            path="/account/questions"
            navigate={navigate}
            iconClassName="bg-indigo-50 text-indigo-600"
          />

          <Tile
            icon={<FaHeart />}
            title="Wishlist activity"
            sub="Recently saved products"
            path="/account/wishlist"
            navigate={navigate}
            iconClassName="bg-rose-50 text-rose-600"
          />

        </AccountSection>

        {/* =====================================================
            SOCIAL
        ===================================================== */}

        <section className="mt-6 bg-white px-4 py-4 sm:px-6">

          <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
            Follow Us On
          </p>

          <div className="grid grid-cols-3 gap-2">

            <SocialButton
              icon={<FaInstagram />}
              label="Instagram"
            />

            <SocialButton
              icon={<FaYoutube />}
              label="YouTube"
            />

            <SocialButton
              icon={<FaLinkedin />}
              label="LinkedIn"
            />

          </div>

        </section>

        {/* =====================================================
            LOGOUT
        ===================================================== */}

        <section className="bg-white px-4 py-4 sm:px-6">

          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="flex h-10 w-full items-center justify-center rounded-md border border-[#2874f0] bg-white text-[11px] font-bold text-[#2874f0] transition hover:bg-blue-50"
          >
            Log out
          </button>

          <p className="mt-3 text-center text-[8px] text-slate-400">
            v1.0.0
          </p>

        </section>

        {/* =====================================================
            DELETE ACCOUNT
        ===================================================== */}

        <section className="px-4 pb-6 pt-2 sm:px-6">

          <button
            type="button"
            onClick={() => navigate("/account/delete")}
            className="mx-auto flex items-center gap-1.5 text-[9px] font-medium text-slate-400 hover:text-rose-500"
          >

            <FaTrash size={8} />

            Delete account

          </button>

        </section>

        {/* =====================================================
            SIGN OUT MODAL
        ===================================================== */}

        {showSignOutModal && (

          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"

            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !signingOut
              ) {
                setShowSignOutModal(false);
              }
            }}
          >

            <div
              role="dialog"
              aria-modal="true"

              className="relative w-full overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-w-[420px] sm:rounded-[24px]"

              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="h-1 w-full bg-[#2874f0]" />

              <div className="p-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowSignOutModal(false)
                  }
                  disabled={signingOut}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <FaTimes size={12} />
                </button>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2874f0]">
                  <FaSignOutAlt size={18} />
                </div>

                <h2 className="mt-4 text-[18px] font-bold text-slate-900">
                  Log out of your account?
                </h2>

                <p className="mt-2 pr-5 text-[12px] leading-5 text-slate-500">
                  You can sign back in anytime using your account credentials.
                </p>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 p-3">

                  <FaShieldAlt
                    className="mt-0.5 shrink-0 text-[#2874f0]"
                    size={13}
                  />

                  <p className="text-[10px] leading-4 text-slate-600">
                    Your account data will remain safe when you sign back in.
                  </p>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">

                  <button
                    type="button"
                    onClick={() =>
                      setShowSignOutModal(false)
                    }
                    disabled={signingOut}
                    className="h-11 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2874f0] text-[12px] font-bold text-white disabled:opacity-60"
                  >

                    {signingOut ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Logging out...
                      </>
                    ) : (
                      <>
                        <FaSignOutAlt size={12} />

                        Log out
                      </>
                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </AccountShell>
  );
}

// =========================================================
// QUICK ACTION
// =========================================================

function QuickAction({
  icon,
  title,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
    >

      <span className="text-[#2874f0]">
        {icon}
      </span>

      {title}

    </button>
  );
}

// =========================================================
// ACCOUNT SECTION
// =========================================================

function AccountSection({
  title,
  children,
}) {
  return (
    <section className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">

      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 sm:px-6">
        {title}
      </div>

      <div className="overflow-hidden border-t border-slate-100 bg-white">
        {children}
      </div>

    </section>
  );
}

// =========================================================
// TILE
// =========================================================

function Tile({
  icon,
  title,
  sub,
  path,
  onClick,
  navigate,
  iconClassName = "",
  rightText,
}) {
  return (
    <button
      type="button"

      className="group relative flex min-h-[62px] w-full items-center gap-3 border-b border-slate-100 bg-white px-4 text-left last:border-b-0 transition hover:bg-slate-50 active:bg-slate-100 sm:px-6"

      onClick={
        onClick ||
        (() => {
          if (path) {
            navigate(path);
          }
        })
      }

      aria-label={title}
    >

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] ${iconClassName} shadow-sm`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">

        <span className="block truncate text-[10.5px] font-semibold text-slate-800">
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[8.5px] text-slate-400">
          {sub}
        </span>

      </span>

      {rightText && (
        <span className="max-w-[90px] truncate text-[8px] font-semibold text-[#2874f0]">
          {rightText}
        </span>
      )}

      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-300 transition group-hover:text-slate-500">
        <FaChevronRight size={8} />
      </span>

    </button>
  );
}

// =========================================================
// SOCIAL BUTTON
// =========================================================

function SocialButton({
  icon,
  label,
}) {
  return (
    <button
      type="button"
      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[9px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
    >

      <span className="text-slate-700">
        {icon}
      </span>

      {label}

    </button>
  );
}

// =========================================================
// PROFILE SKELETON
// =========================================================

function ProfileSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#f7f8fa] pb-20">

      {/* Header */}

      <div className="border-b border-slate-100 bg-white px-4 py-4">

        <Skeleton className="h-4 w-28 rounded" />

        <Skeleton className="mt-2 h-2.5 w-40 rounded" />

      </div>

      {/* Main profile */}

      <div className="bg-white px-4 py-3">

        <Skeleton className="h-14 w-full rounded-lg" />

      </div>

      {/* Actions */}

      <div className="bg-white px-4 pb-4">

        <div className="grid grid-cols-2 gap-2.5">

          <Skeleton className="h-11 rounded-md" />

          <Skeleton className="h-11 rounded-md" />

        </div>

      </div>

      {/* Sections */}

      {[4, 3, 5, 3, 2].map(
        (rows, sectionIndex) => (

          <section
            key={sectionIndex}
            className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]"
          >

            <div className="px-4 py-3">

              <Skeleton className="h-2.5 w-24 rounded" />

            </div>

            {Array.from({
              length: rows,
            }).map((_, index) => (

              <div
                key={index}
                className="flex min-h-[58px] items-center gap-3 border-y border-slate-50 px-4"
              >

                <Skeleton className="h-8 w-8 rounded-full" />

                <div className="flex-1">

                  <Skeleton className="h-2.5 w-32 rounded" />

                  <Skeleton className="mt-2 h-2 w-48 max-w-[80%] rounded" />

                </div>

                <Skeleton className="h-3 w-2 rounded" />

              </div>

            ))}

          </section>

        )
      )}

    </div>
  );
}

// =========================================================
// SKELETON
// =========================================================

function Skeleton({
  className = "",
}) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 ${className}`}
    />
  );
}