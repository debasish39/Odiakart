import React, { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiInfo,
  FiLoader,
  FiPercent,
  FiTag,
  FiX,
} from "react-icons/fi";
import api from "../api/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getDiscountText = (coupon) => {
  const value = Number(coupon?.discountValue || 0);

  if (coupon?.discountType === "PERCENTAGE") {
    return `${value}% OFF`;
  }

  return `${money(value)} OFF`;
};

const isExpired = (coupon) => {
  if (!coupon?.expiryDate) return false;

  const expiry = new Date(coupon.expiryDate).getTime();

  return Number.isFinite(expiry) && expiry <= Date.now();
};

const formatExpiry = (value) => {
  if (!value) return "No expiry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No expiry";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function CouponSkeleton() {
  return (
    <div className="mt-3 space-y-2">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-3"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />

            <div className="min-w-0 flex-1">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-2.5 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-28 rounded bg-slate-200" />
            </div>

            <div className="h-8 w-16 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CouponCard({
  coupon,
  applying,
  onApply,
  onCopy,
  copiedCode,
}) {
  const code = String(coupon?.code || "").toUpperCase();

  const minimum = Number(coupon?.minOrderAmount || 0);

  const hasMaxDiscount =
    coupon?.discountType === "PERCENTAGE" &&
    Number(coupon?.maxDiscount || 0) > 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-[1px] hover:border-blue-200 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      {/* top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <span className="absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </div>

      <div className="p-3.5">
        <div className="flex items-start gap-3">
          {/* icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiTag size={18} />
          </div>

          {/* content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-900">
                  {getDiscountText(coupon)}
                </h4>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {minimum > 0
                    ? `On orders above ${money(minimum)}`
                    : "Valid on your order"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">
                AVAILABLE
              </span>
            </div>

            {/* code */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-2">
                <FiPercent
                  size={13}
                  className="shrink-0 text-blue-600"
                />

                <span className="truncate text-[10px] font-black tracking-[0.12em] text-slate-800">
                  {code}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCopy(code)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[9px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                {copiedCode === code ? (
                  <>
                    <FiCheck size={13} />
                    Copied
                  </>
                ) : (
                  <>
                    <FiCopy size={13} />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* metadata */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-[8px] text-slate-400">
                <FiClock size={11} />

                {coupon?.expiryDate
                  ? `Valid until ${formatExpiry(coupon.expiryDate)}`
                  : "No expiry"}
              </span>

              {hasMaxDiscount && (
                <span className="flex items-center gap-1 text-[8px] font-medium text-violet-500">
                  <FiInfo size={10} />

                  Max {money(coupon.maxDiscount)}
                </span>
              )}
            </div>
          </div>

          {/* apply */}
          <button
            type="button"
            disabled={applying}
            onClick={() => onApply(code)}
            className="relative mt-0.5 flex h-9 shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-[9px] font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? (
              <FiLoader className="animate-spin" size={13} />
            ) : (
              <>
                Apply
                <FiChevronRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouponSection({
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}) {
  const [code, setCode] = useState("");
  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [copiedCode, setCopiedCode] = useState("");

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/coupons/available");

      const data = response?.data;

      const list = Array.isArray(data?.coupons)
        ? data.coupons
        : Array.isArray(data?.data?.coupons)
        ? data.data.coupons
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const available = list.filter(
        (coupon) =>
          coupon?.code &&
          coupon?.isActive !== false &&
          !isExpired(coupon)
      );

      setCoupons(available);
    } catch (err) {
      console.error("COUPONS LOAD ERROR:", err);

      setCoupons([]);

      setError(
        err?.response?.data?.message ||
          "Unable to load available coupons."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCopy = async (couponCode) => {
    try {
      await navigator.clipboard.writeText(couponCode);

      setCopiedCode(couponCode);

      setTimeout(() => {
        setCopiedCode((current) =>
          current === couponCode ? "" : current
        );
      }, 1800);
    } catch {
      setCode(couponCode);
    }
  };

  const handleApply = async (couponCode = code) => {
    const finalCode = String(couponCode || "")
      .trim()
      .toUpperCase();

    if (!finalCode) {
      setError("Enter a coupon code.");
      return;
    }

    try {
      setApplying(true);
      setError("");
      setSuccess("");

      /*
       * IMPORTANT:
       * The parent checkout should call your existing backend
       * coupon API here.
       *
       * We do NOT calculate discount on the frontend.
       */
      if (onCouponApplied) {
        await onCouponApplied(finalCode);
      } else {
        /*
         * Optional direct API implementation.
         *
         * If your backend expects additional checkout data,
         * pass that data from the parent instead.
         */
        const response = await api.post("/coupons/apply", {
          code: finalCode,
        });

        onCouponApplied?.(finalCode, response?.data);
      }

      setCode(finalCode);
      setSuccess(`Coupon ${finalCode} applied successfully.`);
    } catch (err) {
      console.error("COUPON APPLY ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to apply this coupon."
      );
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = async () => {
    try {
      setError("");
      setSuccess("");
      setCode("");

      if (onCouponRemoved) {
        await onCouponRemoved();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to remove coupon."
      );
    }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiTag size={17} />
          </div>

          <div className="min-w-0">
            <h3 className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-900">
              Coupons & Offers
            </h3>

            <p className="mt-0.5 truncate text-[9px] text-slate-500">
              Save more on your order
            </p>
          </div>
        </div>

        {coupons.length > 0 && (
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-600">
            {coupons.length} available
          </span>
        )}
      </div>

      {/* Applied coupon */}
      {appliedCoupon ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FiCheck size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold text-emerald-700">
                Coupon applied
              </p>

              <p className="mt-0.5 truncate text-[11px] font-black tracking-wider text-emerald-900">
                {String(appliedCoupon.code).toUpperCase()}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 text-[9px] font-bold text-red-500 transition hover:bg-red-50"
            >
              <FiX size={12} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Manual input */}
          <div className="mt-3 flex gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <FiTag
                size={14}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApply();
                  }
                }}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              disabled={!code.trim() || applying}
              onClick={() => handleApply()}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {applying ? (
                <FiLoader
                  size={14}
                  className="animate-spin"
                />
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-[9px] font-medium text-red-600">
              <FiX size={12} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[9px] font-medium text-emerald-700">
              <FiCheck size={12} />
              <span>{success}</span>
            </div>
          )}

          {/* Available coupons */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-900">
                Available coupons
              </h4>

              <p className="mt-0.5 text-[8px] text-slate-400">
                Tap Apply to use an offer
              </p>
            </div>
          </div>

          {loading ? (
            <CouponSkeleton />
          ) : coupons.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
              <FiTag
                size={15}
                className="text-slate-400"
              />

              <span className="text-[9px] text-slate-500">
                No coupons available right now.
              </span>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {coupons.slice(0, 3).map((coupon, index) => (
                <CouponCard
                  key={coupon._id || `${coupon.code}-${index}`}
                  coupon={coupon}
                  applying={applying}
                  onApply={handleApply}
                  onCopy={handleCopy}
                  copiedCode={copiedCode}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}