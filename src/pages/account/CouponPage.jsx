import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCopy,
  FiGift,
  FiInfo,
  FiRefreshCw,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiZap,
  FiShoppingCart,

} from "react-icons/fi";
import { toast } from "sonner";



// ============================================================
// HELPERS
// ============================================================

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;


const isExpired = (coupon) => {
  if (!coupon?.expiryDate) {
    return false;
  }

  const expiry = new Date(coupon.expiryDate).getTime();

  return Number.isFinite(expiry) && expiry <= Date.now();
};


const getDiscountText = (coupon) => {
  const value = Number(coupon?.discountValue || 0);

  if (coupon?.discountType === "PERCENTAGE") {
    return `${value}% OFF`;
  }

  return `${money(value)} OFF`;
};


const getDescription = (coupon) => {
  const minimum = Number(coupon?.minOrderAmount || 0);

  if (minimum > 0) {
    return `${getDiscountText(
      coupon
    )} on orders above ${money(minimum)}`;
  }

  return `${getDiscountText(coupon)} on your order`;
};


const formatExpiry = (value) => {
  if (!value) {
    return "No expiry";
  }

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


// ============================================================
// SKELETON
// ============================================================

function CouponSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex gap-3">
            {/* Icon */}
            <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="h-3 w-24 rounded bg-slate-200" />

              <div className="mt-2 h-2.5 w-48 rounded bg-slate-200" />

              <div className="mt-3 h-9 w-full rounded-lg bg-slate-200" />

              <div className="mt-3 h-2 w-40 rounded bg-slate-200" />
            </div>

            {/* Button */}
            <div className="h-8 w-16 shrink-0 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}


// ============================================================
// COUPON CARD
// ============================================================

function CouponCard({
  coupon,
  copiedCode,
  onCopy,
}) {
  const canvasRef = useRef(null);
  const scratchAreaRef = useRef(null);

  const code = String(coupon?.code || "").toUpperCase();
  const minimum = Number(coupon?.minOrderAmount || 0);

  const scratchStorageKey = `odikart:coupon-revealed:${code}`;

  const [isScratched, setIsScratched] = useState(() => {
    try {
      return localStorage.getItem(scratchStorageKey) === "1";
    } catch {
      return false;
    }
  });

  const [scratchProgress, setScratchProgress] = useState(() =>
    (() => {
      try {
        return localStorage.getItem(scratchStorageKey) === "1" ? 100 : 0;
      } catch {
        return 0;
      }
    })()
  );

  const [isDrawing, setIsDrawing] = useState(false);

  const hasMaxDiscount =
    coupon?.discountType === "PERCENTAGE" &&
    Number(coupon?.maxDiscount || 0) > 0;

  const discountText = getDiscountText(coupon);

  const createScratchSurface = useCallback(() => {
    const canvas = canvasRef.current;
    const area = scratchAreaRef.current;

    if (!canvas || !area || isScratched) return;

    const rect = area.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Paytm-style metallic scratch coating.
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#6b7280");
    gradient.addColorStop(0.18, "#d8dbe2");
    gradient.addColorStop(0.42, "#7c8492");
    gradient.addColorStop(0.58, "#eef0f4");
    gradient.addColorStop(0.82, "#727a88");
    gradient.addColorStop(1, "#c7ccd5");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Metallic diagonal texture.
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    for (let x = -rect.height; x < rect.width + rect.height; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + rect.height, rect.height);
      ctx.stroke();
    }
    ctx.restore();

    // Soft center glow.
    const glow = ctx.createRadialGradient(
      rect.width * 0.5,
      rect.height * 0.45,
      4,
      rect.width * 0.5,
      rect.height * 0.45,
      Math.max(rect.width, rect.height) * 0.7
    );
    glow.addColorStop(0, "rgba(255,255,255,.5)");
    glow.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Keep the canvas purely as the metallic scratch layer.
    // The scratch prompt is rendered as normal React UI below so
    // React Icons can be used cleanly and remain accessible.
    setScratchProgress(0);
  }, [isScratched]);

  useEffect(() => {
    createScratchSurface();

    const handleResize = () => {
      if (!isScratched) createScratchSurface();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [createScratchSurface, isScratched]);

  const revealIfNeeded = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas || isScratched) return;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx || !canvas.width || !canvas.height) return;

    const { data } = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    let transparent = 0;
    const sampleStep = 8;

    for (let i = 3; i < data.length; i += 4 * sampleStep) {
      if (data[i] < 80) transparent += 1;
    }

    const totalSamples = Math.ceil(data.length / (4 * sampleStep));
    const progress = Math.min(
      100,
      Math.round((transparent / totalSamples) * 100)
    );

    setScratchProgress(progress);

    if (progress >= 45) {
      setIsScratched(true);

      try {
        localStorage.setItem(scratchStorageKey, "1");
      } catch (storageError) {
        console.warn("Unable to persist coupon reveal state:", storageError);
      }

      // Finish the reveal cleanly.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      toast.success("Coupon revealed 🎉");
    }
  }, [isScratched, scratchStorageKey]);

  const scratch = useCallback(
    (event) => {
      if (isScratched) return;

      const canvas = canvasRef.current;
      const area = scratchAreaRef.current;

      if (!canvas || !area) return;

      const rect = area.getBoundingClientRect();

      let clientX;
      let clientY;

      if (event.touches?.length) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      revealIfNeeded();
    },
    [isScratched, revealIfNeeded]
  );

  const handlePointerDown = (event) => {
    if (isScratched) return;

    setIsDrawing(true);
    scratch(event);
  };

  const handlePointerMove = (event) => {
    if (!isDrawing || isScratched) return;
    scratch(event);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <article
      className="
        group relative overflow-hidden rounded-[24px]
        border border-slate-200/80 bg-white
        shadow-[0_10px_35px_rgba(15,23,42,0.07)]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_50px_rgba(15,23,42,0.11)]
      "
    >
      {/* Top brand strip */}
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-indigo-600
                ring-1 ring-indigo-100 shadow-sm
              "
            >
              <div className="relative">
                <FiTag size={19} />
                <FiStar
                  size={9}
                  className="absolute -right-2 -top-2 text-purple-500"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    inline-flex items-center gap-1.5 rounded-full
                    bg-emerald-50 px-2.5 py-1
                    text-[8px] font-extrabold uppercase tracking-[0.08em]
                    text-emerald-700 ring-1 ring-emerald-100
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>

                {hasMaxDiscount && (
                  <span
                    className="
                      rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1
                      text-[8px] font-bold text-indigo-700
                      ring-1 ring-indigo-100
                    "
                  >
                    Max {money(coupon.maxDiscount)}
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 truncate text-[15px] font-black tracking-[-0.025em] text-slate-900 sm:text-[16px]">
                {discountText}
              </h2>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-indigo-700 ring-1 ring-indigo-100">
            <FiZap size={10} className="text-purple-500" />
            Scratch offer
          </span>
        </div>

        {/* Scratch card */}
        <div
          ref={scratchAreaRef}
          className="
            relative mt-4 overflow-hidden rounded-2xl
            border border-slate-200 bg-gradient-to-br
            from-blue-50 via-indigo-50 to-purple-50
            shadow-inner
            select-none
          "
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Hidden reward underneath */}
          <div className="flex min-h-[142px] flex-col items-center justify-center px-4 py-5 text-center">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
              Your reward
            </div>

            <div className="mt-1 text-[29px] font-black tracking-[-0.045em] text-slate-900">
              {discountText}
            </div>

            <p className="mt-1 max-w-xs text-[9px] leading-4 text-slate-500">
              {minimum > 0
                ? `Use on orders above ${money(minimum)}`
                : "Use this offer on your next eligible order"}
            </p>

            <div
              className="
                mt-3 inline-flex items-center gap-2
                rounded-xl border border-dashed border-indigo-200
                bg-white px-4 py-2.5 shadow-sm
              "
            >
              <FiTag size={13} className="text-indigo-600" />
              <span className="text-[12px] font-black tracking-[0.18em] text-slate-900">
                {code}
              </span>
            </div>
          </div>

          {/* Scratch coating */}
          {!isScratched && (
            <>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer"
                aria-label="Scratch to reveal coupon"
              />

              {/* React-based scratch prompt */}
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-indigo-700 shadow-sm ring-1 ring-white/70 backdrop-blur-sm">
                  <FiTag size={18} strokeWidth={2.4} />
                </div>

                <div className="mt-2 rounded-full bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-800 shadow-sm backdrop-blur-sm">
                  Scratch to reveal
                </div>

                <div className="mt-1 text-[8px] font-semibold text-slate-600">
                  Use your finger or mouse
                </div>
              </div>
            </>
          )}

          {/* Progress hint */}
          {!isScratched && scratchProgress > 0 && (
            <div
              className="
                pointer-events-none absolute bottom-2 left-1/2 z-20
                -translate-x-1/2 rounded-full bg-slate-900/75
                px-2.5 py-1 text-[7px] font-bold text-white
                backdrop-blur-sm
              "
            >
              {scratchProgress}% revealed
            </div>
          )}

          {isScratched && (
            <div
              className="
                pointer-events-none absolute right-2 top-2 z-20
                inline-flex items-center gap-1 rounded-full
                bg-emerald-500 px-2 py-1
                text-[7px] font-extrabold uppercase tracking-wide text-white
                shadow-sm
              "
            >
              <FiCheck size={9} strokeWidth={3} />
              Revealed
            </div>
          )}
        </div>

        {/* Action */}
        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <FiClock size={11} className="shrink-0 text-slate-400" />
              <span className="truncate text-[8.5px] text-slate-400 sm:text-[9px]">
                {coupon?.expiryDate
                  ? `Valid until ${formatExpiry(coupon.expiryDate)}`
                  : "No expiry"}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <FiShoppingBag size={11} className="shrink-0 text-slate-400" />
              <span className="truncate text-[8.5px] text-slate-400 sm:text-[9px]">
                {minimum > 0
                  ? `Minimum order ${money(minimum)}`
                  : "No minimum order"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!isScratched}
            onClick={() => onCopy(code)}
            className={`
              inline-flex h-11 shrink-0 items-center justify-center gap-1.5
              rounded-xl px-4 text-[9px] font-extrabold transition-all
              active:scale-[0.97]
              ${
                isScratched
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200/60 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-lg"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }
            `}
          >
            {copiedCode === code && isScratched ? (
              <>
                <FiCheck size={13} />
                Copied
              </>
            ) : (
              <>
                <FiCopy size={13} />
                {isScratched ? "Copy code" : "Scratch first"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CouponPage() {
  const navigate = useNavigate();


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState("");


  // ----------------------------------------------------------
  // LOAD COUPONS
  // ----------------------------------------------------------

  const loadCoupons = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
         * Customer-safe endpoint.
         *
         * Do NOT use the admin GET /coupons endpoint here.
         */
     const token =
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt");

const response = await fetch(
  `${import.meta.env.VITE_BACKEND_URL}/api/coupons/available`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!response.ok) {
  throw new Error("Unable to load coupons");
}

const data = await response.json();


        /*
         * Support these possible backend responses:
         *
         * {
         *   coupons: [...]
         * }
         *
         * {
         *   data: {
         *     coupons: [...]
         *   }
         * }
         *
         * {
         *   data: [...]
         * }
         */
        const list =
          Array.isArray(data?.coupons)
            ? data.coupons
            : Array.isArray(
                data?.data?.coupons
              )
            ? data.data.coupons
            : Array.isArray(data?.data)
            ? data.data
            : [];


        /*
         * Only display coupons that:
         *
         * 1. Have a code
         * 2. Are active
         * 3. Have not expired
         */
        const available =
          list.filter(
            (coupon) =>
              coupon?.code &&
              coupon?.isActive !== false &&
              !isExpired(coupon)
          );


        setCoupons(available);

      } catch (err) {
        console.error(
          "COUPON PAGE LOAD ERROR:",
          err
        );

        setCoupons([]);

        setError(
          err?.response?.data?.message ||
            "Unable to load coupons right now."
        );

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);


  // ----------------------------------------------------------
  // COPY COUPON
  // ----------------------------------------------------------

  const copyCoupon = async (
    couponCode
  ) => {
    try {
      await navigator.clipboard.writeText(
        couponCode
      );

      setCopiedCode(couponCode);

      toast.success(
        `${couponCode} copied`
      );


      window.setTimeout(() => {
        setCopiedCode((current) =>
          current === couponCode
            ? ""
            : current
        );
      }, 1800);

    } catch (err) {
      console.error(
        "COPY COUPON ERROR:",
        err
      );

      toast.error(
        "Unable to copy coupon code"
      );
    }
  };


  // ----------------------------------------------------------
  // COUNT
  // ----------------------------------------------------------

  const countText = useMemo(() => {
    if (coupons.length === 0) {
      return "No offers available right now";
    }

    return `${coupons.length} offer${
      coupons.length === 1
        ? ""
        : "s"
    } available`;
  }, [coupons.length]);


  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <main
      className="
        relative min-h-screen overflow-hidden
        bg-slate-50
        text-slate-900
      "
    >
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-72 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[520px] h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/10 blur-3xl" />

      {/* ======================================================
          PAGE ANIMATIONS
      ====================================================== */}

      <style>{`
        @keyframes couponPageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes couponGlow {
          0%,
          100% {
            opacity: .22;
            transform: scale(1);
          }

          50% {
            opacity: .42;
            transform: scale(1.06);
          }
        }

        @keyframes couponShine {
          0% {
            transform: translateX(-140%) skewX(-18deg);
          }

          100% {
            transform: translateX(420%) skewX(-18deg);
          }
        }

        .coupon-page-in {
          animation:
            couponPageIn
            .4s
            ease-out
            both;
        }

        .coupon-hero-glow {
          animation:
            couponGlow
            4s
            ease-in-out
            infinite;
        }

        .coupon-shine {
          position: relative;
          overflow: hidden;
        }

        .coupon-shine::after {
          content: "";
          position: absolute;
          top: -40%;
          left: -75%;
          width: 35%;
          height: 180%;
          transform: skewX(-18deg);
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.18),
              rgba(255,255,255,.75),
              rgba(255,255,255,.18),
              transparent
            );
          pointer-events: none;
        }

        .coupon-shine:hover::after {
          animation:
            couponShine
            .9s
            ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .coupon-page-in,
          .coupon-hero-glow,
          .coupon-shine:hover::after {
            animation: none !important;
          }
        }
      `}</style>


      {/* ======================================================
          PAGE CONTAINER
      ====================================================== */}

      <div
        className="
          coupon-page-in
          mx-auto
          w-full
          max-w-5xl
          px-3
          pb-10
          pt-3
          sm:px-5
          sm:pt-5
          lg:px-6
        "
      >


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          className="
            flex
            min-h-12
            items-center
            gap-3
            sm:min-h-14
          "
        >

          {/* Back */}
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            aria-label="Go back"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-700
              shadow-sm
              transition
              hover:border-indigo-200
              hover:bg-[#eaf3ff]
              hover:text-indigo-600
              active:scale-95
            "
          >
            <FiArrowLeft size={18} />
          </button>


          {/* Title */}
          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h1
              className="
                truncate
                text-[17px]
                font-black
                tracking-[-0.03em]
                text-slate-900
                sm:text-[20px]
              "
            >
              Coupons & Offers
            </h1>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-500
                sm:text-[10px]
              "
            >
              Exclusive savings made for your next Odikart order
            </p>
          </div>


          {/* Refresh */}
          <button
            type="button"
            onClick={() =>
              loadCoupons(true)
            }
            disabled={refreshing}
            aria-label="Refresh coupons"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-600
              shadow-sm
              transition
              hover:border-indigo-200
              hover:bg-[#eaf3ff]
              hover:text-indigo-600
              disabled:opacity-50
              active:scale-95
            "
          >
            <FiRefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </header>


        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          className="
            relative
            mt-3
            overflow-hidden
            rounded-2xl
            border
            border-indigo-100
            bg-gradient-to-br
            from-blue-50
            via-indigo-50
            to-purple-50
            p-4
            shadow-[0_12px_35px_rgba(79,70,229,0.10)]
            sm:mt-5
            sm:p-5
          "
        >

          {/* Glow */}
          <div
            className="
              coupon-hero-glow
              pointer-events-none
              absolute
              -right-16
              -top-20
              h-44
              w-44
              rounded-full
              bg-purple-300/30
              blur-3xl
            "
          />


          <div
            className="
              relative
              flex
              items-center
              gap-3.5
            "
          >

            {/* Icon */}
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-white
                text-indigo-600
                shadow-sm
                ring-1
                ring-[#d7e8fb]
                sm:h-14
                sm:w-14
              "
            >
              <div className="relative">
                <FiGift size={23} />
                <FiStar
                  size={10}
                  className="absolute -right-2 -top-2 text-purple-500"
                />
              </div>
            </div>


            {/* Content */}
            <div className="min-w-0">
              <h2
                className="
                  text-[14px]
                  font-black
                  tracking-[-0.02em]
                  text-slate-900
                  sm:text-[16px]
                "
              >
                Unlock your Odikart savings
              </h2>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[9px]
                  leading-4
                  text-slate-500
                  sm:text-[10px]
                  sm:leading-5
                "
              >
                Copy an available coupon code
                and apply it during checkout.
              </p>
            </div>
          </div>
        </section>


        {/* ====================================================
            HOW IT WORKS
        ==================================================== */}

        <section
          className="
            mt-3
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            sm:mt-4
            sm:p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-[#eaf3ff]
                text-indigo-600
              "
            >
              <FiInfo size={14} />
            </div>

            <h2
              className="
                text-[11px]
                font-black
                text-slate-900
                sm:text-[12px]
              "
            >
              How to use a coupon
            </h2>
          </div>


          <div
            className="
              mt-3
              grid
              gap-2
              sm:grid-cols-3
              sm:gap-3
            "
          >

            {[
              {
                icon: FiTag,
                title: "Choose",
                text: "Pick an available coupon.",
              },
              {
                icon: FiCopy,
                title: "Copy",
                text: "Copy the revealed code.",
              },
              {
                icon: FiShoppingCart,
                title: "Apply",
                text: "Use it during checkout.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="
                  group flex items-center gap-2.5
                  rounded-xl border border-slate-100
                  bg-gradient-to-br from-slate-50 to-indigo-50/50
                  px-3 py-2.5 transition
                  hover:border-indigo-100 hover:from-blue-50 hover:to-purple-50
                "
              >
                <span
                  className="
                    flex h-8 w-8 shrink-0 items-center justify-center
                    rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600
                    text-white shadow-sm shadow-indigo-200/50
                  "
                >
                  <Icon size={14} strokeWidth={2.4} />
                </span>

                <span className="min-w-0">
                  <span className="block text-[9px] font-extrabold text-slate-800">
                    {title}
                  </span>
                  <span className="block text-[8px] font-medium leading-4 text-slate-500">
                    {text}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>


        {/* ====================================================
            SECTION HEADER
        ==================================================== */}

        <section
          className="
            mt-5
            flex
            items-end
            justify-between
            gap-3
          "
        >

          <div>
            <h2
              className="
                flex items-center gap-2
                text-[14px]
                font-black
                tracking-[-0.02em]
                text-slate-900
                sm:text-[15px]
              "
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-indigo-100">
                <FiTag size={13} />
              </span>
              <span>Available coupons</span>
            </h2>

            <p
              className="
                mt-1
                text-[9px]
                text-slate-400
                sm:text-[10px]
              "
            >
              {countText}
            </p>
          </div>


          {!loading &&
            coupons.length > 0 && (
              <div
                className="
                  inline-flex items-center gap-1
                  rounded-full
                  bg-[#eaf3ff]
                  px-2.5
                  py-1.5
                  text-[8px]
                  font-black
                  text-indigo-600
                "
              >
                <FiGift size={10} />
                {coupons.length}
              </div>
            )}
        </section>


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <CouponSkeleton />
        ) : error ? (

          /* ==================================================
             ERROR
          ================================================== */

          <section
            className="
              mt-4
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-4
              sm:p-5
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-red-100
                  text-red-600
                "
              >
                <FiInfo size={18} />
              </div>


              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <h3
                  className="
                    text-[11px]
                    font-black
                    text-red-800
                  "
                >
                  Couldn't load offers
                </h3>


                <p
                  className="
                    mt-1
                    text-[9px]
                    leading-4
                    text-red-600
                  "
                >
                  {error}
                </p>


                <button
                  type="button"
                  onClick={() =>
                    loadCoupons()
                  }
                  className="
                    mt-3
                    inline-flex
                    h-8
                    items-center
                    gap-1.5
                    rounded-lg
                    bg-white
                    px-3
                    text-[9px]
                    font-extrabold
                    text-red-600
                    shadow-sm
                    ring-1
                    ring-red-200
                    transition
                    hover:bg-red-50
                  "
                >
                  <FiRefreshCw size={12} />

                  Try again
                </button>
              </div>
            </div>
          </section>

        ) : coupons.length === 0 ? (

          /* ==================================================
             EMPTY
          ================================================== */

          <section
            className="
              mt-4
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-white
              px-5
              py-10
              text-center
              sm:py-14
            "
          >

            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <FiTag size={28} />
            </div>


            <h3
              className="
                mt-4
                text-[14px]
                font-black
                text-slate-900
              "
            >
              No coupons available
            </h3>


            <p
              className="
                mx-auto
                mt-2
                max-w-sm
                text-[9px]
                leading-4
                text-slate-500
                sm:text-[10px]
              "
            >
              New offers will appear here when
              they become available. Check back
              later for savings on your next order.
            </p>


            <button
              type="button"
              onClick={() =>
                loadCoupons(true)
              }
              className="
                coupon-shine
                mt-5
                inline-flex
                h-9
                items-center
                gap-2
                rounded-xl
                bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                px-4
                text-[9px]
                font-extrabold
                text-white
                shadow-sm
                transition
                hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700
                active:scale-[0.98]
              "
            >
              <FiRefreshCw size={13} />

              Refresh offers
            </button>
          </section>

        ) : (

          /* ==================================================
             COUPON LIST
          ================================================== */

          <section
            className="
              mt-4
              space-y-3
            "
          >
            {coupons.map(
              (coupon, index) => (
                <CouponCard
                  key={
                    coupon._id ||
                    `${coupon.code}-${index}`
                  }
                  coupon={coupon}
                  copiedCode={copiedCode}
                  onCopy={copyCoupon}
                />
              )
            )}
          </section>
        )}


        {/* ====================================================
            CHECKOUT HINT
        ==================================================== */}

        {!loading &&
          !error &&
          coupons.length > 0 && (
            <section
              className="
                mt-4
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-indigo-100
                bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80
                p-4
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-indigo-600
                  shadow-sm
                "
              >
                <FiShoppingCart size={16} />
              </div>


              <div className="min-w-0">
                <h3
                  className="
                    text-[10px]
                    font-black
                    text-indigo-950
                  "
                >
                  Ready to save?
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[8.5px]
                    leading-4
                    text-indigo-700
                  "
                >
                  Add products to your cart,
                  then apply your copied code
                  during checkout.
                </p>
              </div>
            </section>
          )}


        {/* Bottom spacing */}
        <div className="h-5" />
      </div>
    </main>
  );
}