import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaTruck,
  FaHeart,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTrash,
  FaChevronRight,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { AccountShell, api } from "./AccountShell";

/* =========================================================
   PROFILE PAGE
   Modern Tailwind / full-width account UI
========================================================= */

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const token = localStorage.getItem("token");

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

    localStorage.removeItem("token");

    setTimeout(() => {
      navigate("/sign-in", { replace: true });
    }, 350);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading && !user) {
    return (
      <AccountShell title="Account">
        <ProfileSkeleton />
      </AccountShell>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (userError && !user) {
    return (
      <AccountShell title="Account">
        <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_12px_40px_rgba(15,23,42,0.07)] sm:p-9">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <FaUser size={19} />
            </div>

            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-slate-900">
              Unable to load your profile
            </h2>

            <p className="mt-2 text-[13px] leading-5 text-slate-500">
              Something went wrong while loading your account details.
              Please try again.
            </p>

            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["currentUser", token],
                })
              }
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-md active:translate-y-0"
            >
              Try again
            </button>
          </div>
        </div>
      </AccountShell>
    );
  }

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Odikart User";

  return (
    <AccountShell title="Account">
      <div className="w-full overflow-hidden pb-16">

        {/* =====================================================
            PROFILE HERO
        ====================================================== */}

        <section className="relative w-full overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-white via-white to-indigo-50/50 px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-blue-100/30 blur-3xl" />

          <div className="relative flex w-full items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 opacity-20 blur-md" />

              <div className="relative h-[72px] w-[72px] rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 p-[3px] shadow-[0_8px_24px_rgba(79,70,229,0.20)] sm:h-[86px] sm:w-[86px]">
                <img
                  src={user?.image || "https://i.pravatar.cc/200"}
                  alt="Profile"
                  className="h-full w-full rounded-full border-[3px] border-white object-cover"
                />
              </div>

              {/* Verified indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-blue-600 shadow-sm sm:h-7 sm:w-7">
                <MdVerified size={19} />
              </span>
            </div>

            {/* Profile information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[21px] font-bold tracking-[-0.035em] text-slate-900 sm:text-[25px]">
                  {name}
                </h1>
              </div>

              <p className="mt-1 truncate text-[12px] font-medium text-slate-500 sm:text-[13px]">
                {user?.email || "No email added"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 text-[10px] font-bold text-indigo-700 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Odikart member
                </span>

                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ACCOUNT
        ====================================================== */}

        <AccountSection title="Account">
          <Tile
            icon={<FaUser />}
            title="Personal information"
            sub="Name, phone number and photo"
            path="/account/personal-information"
            navigate={navigate}
            iconClassName="bg-indigo-50 text-indigo-600"
          />

          <Tile
            icon={<FaMapMarkerAlt />}
            title="My addresses"
            sub="Manage your delivery addresses"
            path="/account/addresses"
            navigate={navigate}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <Tile
            icon={<FaShoppingBag />}
            title="My orders"
            sub="View and track your purchases"
            path="/account/orders"
            navigate={navigate}
            iconClassName="bg-violet-50 text-violet-600"
          />

          <Tile
            icon={<FaTruck />}
            title="Track an order"
            sub="Check delivery status and shipment progress"
            path="/track-order"
            navigate={navigate}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <Tile
            icon={<FaHeart />}
            title="Wishlist"
            sub="Products you saved"
            path="/account/wishlist"
            navigate={navigate}
            iconClassName="bg-rose-50 text-rose-600"
          />
        </AccountSection>

        {/* =====================================================
            PREFERENCES
        ====================================================== */}

        <AccountSection title="Preferences">
          <Tile
            icon={<FaBell />}
            title="Notifications"
            sub="Manage alerts and offers"
            path="/account/notifications"
            navigate={navigate}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <Tile
            icon={<FaQuestionCircle />}
            title="Help & support"
            sub="Get help with Odikart"
            path="/account/help"
            navigate={navigate}
            iconClassName="bg-cyan-50 text-cyan-600"
          />

          <Tile
            icon={<FaQuestionCircle />}
            title="Terms & privacy"
            sub="Policies and legal information"
            path="/account/legal"
            navigate={navigate}
            iconClassName="bg-slate-100 text-slate-600"
          />
        </AccountSection>

        {/* =====================================================
            ACCOUNT ACTIONS
        ====================================================== */}

        <AccountSection
          title="Account actions"
          extraClass="mt-9 border-t border-slate-200/80 pt-7"
        >
          <Tile
            icon={<FaSignOutAlt />}
            title="Sign out"
            sub="Sign back in anytime"
            onClick={() => setShowSignOutModal(true)}
            navigate={navigate}
            iconClassName="bg-slate-100 text-slate-600"
          />

          <Tile
            danger
            icon={<FaTrash />}
            title="Delete account"
            sub="Permanently remove your account"
            path="/account/delete"
            navigate={navigate}
            iconClassName="bg-rose-50 text-rose-600"
          />
        </AccountSection>
      </div>

      {/* =======================================================
          SIGN OUT MODAL
      ======================================================= */}

      {showSignOutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-md sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !signingOut) {
              setShowSignOutModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            className="relative w-full overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-[0_-10px_50px_rgba(15,23,42,0.18)] animate-[profileModalIn_.24s_ease-out] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_25px_70px_rgba(15,23,42,0.20)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />

            <div className="p-5 sm:p-7">
              <button
                type="button"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowSignOutModal(false)}
                disabled={signingOut}
                aria-label="Close sign out dialog"
              >
                <FaTimes size={13} />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.08)]">
                <FaSignOutAlt size={21} />
              </div>

              <div className="mt-5 pr-8">
                <span className="text-[10px] font-extrabold tracking-[0.12em] text-indigo-600">
                  ACCOUNT ACTION
                </span>

                <h2
                  id="signout-title"
                  className="mt-1.5 text-[20px] font-bold tracking-[-0.025em] text-slate-900"
                >
                  Sign out of your account?
                </h2>

                <p className="mt-2 text-[12.5px] leading-5 text-slate-500 sm:text-[13px]">
                  You will be signed out of this device. You can sign back
                  in anytime using your account credentials.
                </p>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <FaShieldAlt size={13} />
                </span>

                <p className="pt-0.5 text-[10.5px] leading-4 text-slate-600">
                  Your account data will remain safe and available when
                  you sign back in.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="h-11 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setShowSignOutModal(false)}
                  disabled={signingOut}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 text-[12px] font-bold text-white shadow-[0_7px_20px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-[0_10px_25px_rgba(79,70,229,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt size={13} />
                      Sign out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes profileModalIn {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes profileSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </AccountShell>
  );
}

/* =========================================================
   PROFILE SKELETON
========================================================= */

function ProfileSkeleton() {
  return (
    <div
      className="w-full pb-16"
      aria-hidden="true"
    >
      {/* Profile skeleton */}
      <section className="relative flex w-full items-center gap-4 overflow-hidden border-b border-slate-200 bg-white px-4 py-6 sm:gap-5 sm:px-6 sm:py-7 lg:px-8">
        <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-full sm:h-[86px] sm:w-[86px]" />

        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40 rounded-lg sm:h-7 sm:w-52" />
          <Skeleton className="mt-3 h-3.5 w-52 max-w-[75%] rounded-md" />

          <div className="mt-3 flex gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </section>

      <SkeletonSection rows={4} />
      <SkeletonSection rows={3} />
      <SkeletonSection rows={2} separated />
    </div>
  );
}

function SkeletonSection({ rows = 3, separated = false }) {
  return (
    <section
      className={`w-full ${
        separated
          ? "mt-8 border-t border-slate-200 pt-7"
          : "mt-7"
      }`}
    >
      <Skeleton className="ml-4 h-3 w-24 rounded-md sm:ml-6" />

      <div className="mt-2.5 w-full overflow-hidden border-y border-slate-200 bg-white">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[70px] items-center gap-3 border-b border-slate-100 px-4 last:border-b-0 sm:px-6"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

            <div className="min-w-0 flex-1">
              <Skeleton
                className={`h-3.5 rounded-md ${
                  index % 2 === 0
                    ? "w-40 max-w-[70%]"
                    : "w-32 max-w-[60%]"
                }`}
              />
              <Skeleton className="mt-2 h-2.5 w-56 max-w-[85%] rounded-md" />
            </div>

            <Skeleton className="h-4 w-2.5 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] animate-[profileSkeleton_1.4s_ease-in-out_infinite] ${className}`}
    />
  );
}

/* =========================================================
   ACCOUNT SECTION
========================================================= */

function AccountSection({
  title,
  children,
  extraClass = "",
}) {
  return (
    <section className={`mt-7 w-full ${extraClass}`}>
      <div className="mb-2.5 px-4 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500 sm:px-6">
        {title}
      </div>

      <div className="w-full overflow-hidden border-y border-slate-200 bg-white">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   TILE
========================================================= */

function Tile({
  icon,
  title,
  sub,
  path,
  onClick,
  navigate,
  danger = false,
  iconClassName = "",
}) {
  return (
    <button
      type="button"
      className="group relative flex min-h-[72px] w-full items-center gap-3.5 border-b border-slate-100 bg-white px-4 text-left transition-all duration-200 last:border-b-0 hover:bg-slate-50/80 active:scale-[0.998] focus:outline-none focus-visible:bg-indigo-50/40 sm:min-h-[76px] sm:px-6"
      onClick={
        onClick ||
        (() => {
          if (path) navigate(path);
        })
      }
      aria-label={title}
    >
      {/* Hover indicator */}
      <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Icon */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-sm sm:h-11 sm:w-11 sm:rounded-[13px] ${iconClassName}`}
      >
        {icon}
      </span>

      {/* Content */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-5 tracking-[-0.01em] text-slate-800 sm:text-[14px]">
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[10.5px] leading-4 text-slate-400 sm:text-[11.5px]">
          {sub}
        </span>
      </span>

      {/* Arrow */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-slate-100 group-hover:text-slate-500">
        <FaChevronRight size={10} />
      </span>
    </button>
  );
}
