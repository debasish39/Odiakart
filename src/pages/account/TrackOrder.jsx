import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import {
  FaSearch, FaBoxOpen, FaCheckCircle, FaTruck,
  FaTimesCircle, FaClock, FaMapMarkerAlt,
  FaRupeeSign, FaShoppingBag, FaEnvelope,
  FaPhoneAlt, FaUser, FaCreditCard, FaTimes,
  FaBarcode, FaTruckMoving, FaBox,
} from "react-icons/fa";
import { BsBoxSeam } from "react-icons/bs";
import { MdLocalShipping, MdAutoAwesome } from "react-icons/md";
import { useNavigate } from "react-router-dom";
/* ── ORDER STATUS PIPELINE ── */
/* ===============================
   ORDER STATUS TIMELINE
================================ */

const STATUS_STEPS = [
  {
    key: "Pending Payment",
    label: "Pending Payment",
    icon: <FaClock size={14} />,
    color: "#f59e0b",
  },
  {
    key: "Confirmed",
    label: "Confirmed",
    icon: <FaCheckCircle size={14} />,
    color: "#3b82f6",
  },
  {
    key: "Processing",
    label: "Processing",
    icon: <BsBoxSeam size={14} />,
    color: "#6366f1",
  },
  {
    key: "Packed",
    label: "Packed",
    icon: <FaBox size={14} />,
    color: "#8b5cf6",
  },
  {
    key: "Ready for Pickup",
    label: "Ready",
    icon: <FaShoppingBag size={14} />,
    color: "#7c3aed",
  },
  {
    key: "Shipped",
    label: "Shipped",
    icon: <FaTruckMoving size={14} />,
    color: "#2563eb",
  },
  {
    key: "In Transit",
    label: "In Transit",
    icon: <MdLocalShipping size={16} />,
    color: "#0ea5e9",
  },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    icon: <FaTruck size={14} />,
    color: "#f97316",
  },
  {
    key: "Delivered",
    label: "Delivered",
    icon: <FaCheckCircle size={14} />,
    color: "#10b981",
  },
];

const STATUS_ORDER = STATUS_STEPS.map((step) => step.key);

const STATUS_CFG = {
  "Pending Payment": {
    bg: "#fef3c7",
    border: "#fbbf24",
    text: "#92400e",
    dot: "#f59e0b",
  },

  Confirmed: {
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1d4ed8",
    dot: "#3b82f6",
  },

  Processing: {
    bg: "#eef2ff",
    border: "#a5b4fc",
    text: "#4338ca",
    dot: "#6366f1",
  },

  Packed: {
    bg: "#f5f3ff",
    border: "#c4b5fd",
    text: "#6d28d9",
    dot: "#8b5cf6",
  },

  "Ready for Pickup": {
    bg: "#ede9fe",
    border: "#c4b5fd",
    text: "#5b21b6",
    dot: "#7c3aed",
  },

  Shipped: {
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1e40af",
    dot: "#2563eb",
  },

  "In Transit": {
    bg: "#ecfeff",
    border: "#67e8f9",
    text: "#155e75",
    dot: "#06b6d4",
  },

  "Out for Delivery": {
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#c2410c",
    dot: "#f97316",
  },

  Delivered: {
    bg: "#f0fdf4",
    border: "#6ee7b7",
    text: "#065f46",
    dot: "#10b981",
  },

  Cancelled: {
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#b91c1c",
    dot: "#ef4444",
  },

  "Return Requested": {
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#9a3412",
    dot: "#fb923c",
  },

  "Return Approved": {
    bg: "#f5f3ff",
    border: "#c4b5fd",
    text: "#6d28d9",
    dot: "#8b5cf6",
  },

  "Return Pickup Scheduled": {
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1d4ed8",
    dot: "#3b82f6",
  },

  "Return Picked Up": {
    bg: "#ecfeff",
    border: "#67e8f9",
    text: "#155e75",
    dot: "#06b6d4",
  },

  "Received by Admin": {
    bg: "#eef2ff",
    border: "#a5b4fc",
    text: "#4338ca",
    dot: "#6366f1",
  },

  Inspection: {
    bg: "#faf5ff",
    border: "#d8b4fe",
    text: "#7e22ce",
    dot: "#a855f7",
  },

  "Return Rejected": {
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#b91c1c",
    dot: "#ef4444",
  },

  Returned: {
    bg: "#f3f4f6",
    border: "#d1d5db",
    text: "#374151",
    dot: "#6b7280",
  },

  "Refund Processing": {
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#9a3412",
    dot: "#fb923c",
  },

  "Refund Completed": {
    bg: "#ecfdf5",
    border: "#6ee7b7",
    text: "#047857",
    dot: "#10b981",
  },
};



const TrackOrder = () => {
 const [searchParams] = useSearchParams();

const id = searchParams.get("id");
  const [orderId, setOrderId] = useState(id || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(true);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const fetchOrder =
  async (customId) => {

    if (

      !customId ||

      customId.trim() === ""

    ) {

      toast.error(

        " Odikart Order Number required",

        {

          description:
            "Enter the  Odikart Order Number sent to your email.",

        }

      );

      return;

    }

    try {

      setLoading(true);

      setOrder(null);

      setSearched(true);

      const token =
        localStorage.getItem(
          "token"
        );
        if (!token) {

  navigate("/sign-in");

  return;

}

      const res =
        await fetch(

          `${BACKEND_URL}/api/track-order/${customId}`,

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      const data =
        await res.json();

      if (data.success) {

        setOrder(
          data.order
        );

      } else {

        setOrder(null);

        toast.error(

          data.message ||

          "Order not found",

          {

            description:
              "Please check your  Odikart Order Number.",

          }

        );

      }

    } catch (e) {

      console.error(e);

      toast.error(
        "Failed to fetch order"
      );

      setOrder(null);

    } finally {

      setLoading(false);

    }

  };

useEffect(() => {

  if (id) {

    setOrderId(id);

    fetchOrder(id);

  }

}, [id]);

 const handleCancel =
  async () => {

    if (!order)
      return;

    try {

      setCancelLoading(true);

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {

        navigate(
          "/sign-in"
        );

        return;

      }

      const res =
        await fetch(

          `${BACKEND_URL}/api/order/cancel/${order._id}`,

          {

            method: "PUT",

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }

        );

      const data =
        await res.json();

      if (data.success) {

        toast.success(

          "Order cancelled",

          {

            description:
              "Your order has been successfully cancelled.",

          }

        );

      setOrder(data.order);
setShowCancelModal(false);

// refresh page
window.location.reload();

      } else {

        toast.error(

          data.message ||

          "Failed to cancel order"

        );

      }

    } catch (error) {

      console.error(
        error
      );

      toast.error(
        "Error cancelling order"
      );

    } finally {

      setCancelLoading(
        false
      );

    }

  };

  const canCancel =
  order &&
  order.cancellation?.allowed &&
  !order.cancellation?.cancelled &&
  new Date() < new Date(order.cancellation?.cancelBefore) &&
  order.status !== "Cancelled" &&
  order.status !== "Delivered";

  const currentStepIdx = STATUS_ORDER.indexOf(order?.status);
const isCancelled =
  order?.status === "Cancelled" ||
  order?.cancellation?.cancelled;
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      : "—";
  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNoticeModal(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="result-enter result-card w-full space-y-6 p-6 sm:p-7">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded-lg bg-gradient-to-r from-indigo-200 to-blue-200 animate-pulse" />
        <div className="h-6 w-64 rounded-lg bg-gradient-to-r from-indigo-200 to-blue-200 animate-pulse" />
      </div>
      <div className="h-32 w-full rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        

        :root {
          --ind: #4f46e5;
          --blue: #2563eb;
          --lt: #eef2ff;
        }

        .to-root * {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .to-serif {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes blobDrift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
          }
          40% {
            transform: translate(20px, -18px) scale(1.05);
          }
          70% {
            transform: translate(-12px, 12px) scale(0.96);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes stepIn {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes lineGrow {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .blob1 {
          animation: blobDrift 10s ease-in-out infinite;
        }
        .blob2 {
          animation: blobDrift 13s ease-in-out infinite reverse;
        }
        .page-enter {
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .result-enter {
          animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }

        /* Search Card */
        .search-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
          transition: all 0.3s;
        }

        .search-card:hover {
          border-color: rgba(99, 102, 241, 0.28);
          box-shadow: 0 16px 56px rgba(79, 70, 229, 0.15);
        }

        /* Input */
        .s-input {
          flex: 1;
          min-width: 0;
          background: #f8faff;
          border: 1.5px solid rgba(99, 102, 241, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #1e1b4b;
          transition: all 0.24s;
        }

        .s-input::placeholder {
          color: #a5b4fc;
        }

        .s-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3.5px rgba(99, 102, 241, 0.16);
          background: white;
        }

        /* Button */
        .s-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #4f46e5, #2563eb);
          color: white;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          transition: all 0.24s;
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.32);
        }

        .s-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(79, 70, 229, 0.42);
        }

        .s-btn:active {
          transform: scale(0.96);
        }

        .s-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.2) 50%, transparent 65%);
          background-size: 200% 100%;
          animation: shimmer 2.4s infinite;
        }

        /* Result Card */
        .result-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 10px 35px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        /* Timeline */
        .timeline-wrap {
          display: flex;
          align-items: flex-start;
          gap: 0;
          position: relative;
          padding: 18px 12px;
          background: #f8fafc;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .tl-step {
          flex: 0 0 92px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .tl-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #e5e7eb;
          background: white;
          transition: all 0.4s ease;
          position: relative;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .tl-circle.done {
          background: linear-gradient(135deg, #4f46e5, #2563eb);
          border-color: transparent;
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
          animation: stepIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .tl-circle.current {
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.18);
          animation: pulse 2s ease-in-out infinite;
        }

        .tl-line {
          position: absolute;
          top: 22px;
          left: calc(50% + 22px);
          right: calc(-50% + 22px);
          height: 2.5px;
          background: #e5e7eb;
          z-index: 0;
          border-radius: 2px;
          overflow: hidden;
        }

        .tl-line-fill {
          height: 100%;
          background: linear-gradient(90deg, #4f46e5, #2563eb);
          animation: lineGrow 0.6s ease both;
          border-radius: 2px;
        }

        .tl-label {
          margin-top: 10px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          max-width: 88px;
          line-height: 1.3;
        }

        .tl-label.done {
          color: #4f46e5;
        }

        .tl-label.current {
          color: #4f46e5;
          font-weight: 800;
        }

        /* Info Chip */
        .info-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 13px 14px;
          transition: all 0.24s;
        }

        .info-chip:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(99, 102, 241, 0.28);
          transform: translateY(-2px);
        }

        /* Item Row */
        .item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          font-size: 13px;
        }

        .item-row:last-child {
          border-bottom: none;
        }

        /* Cancel Button */
        .cancel-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #ef4444, #f43f5e);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.24s;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }

        .cancel-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(239, 68, 68, 0.42);
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 16px;
          height: 16px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* Address Box */
        .addr-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 15px 16px;
        }

        /* Empty State */
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border: 3px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .track-app-input-error {
          border-color: #f87171 !important;
          background: #fff7f7 !important;
          box-shadow: 0 0 0 3px rgba(248,113,113,.10) !important;
        }

        .track-section-label {
          letter-spacing: .14em;
        }

        .track-safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        @media (max-width: 640px) {
          .result-card {
            border-radius: 20px;
          }

          .timeline-wrap {
            margin-inline: -2px;
            padding-inline: 8px;
          }

          .tl-circle {
            width: 40px;
            height: 40px;
          }

          .tl-line {
            top: 20px;
            left: calc(50% + 20px);
            right: calc(-50% + 20px);
          }

          .result-card > div:last-child {
            padding: 1rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .blob1,
          .blob2,
          .page-enter,
          .result-enter,
          .s-btn::after,
          .tl-circle.current,
          .tl-circle.done,
          .tl-line-fill,
          .spinner {
            animation: none !important;
          }
        }

        /* Modern Odikart app polish */
        .to-root {
          min-height: 100dvh;
          background: radial-gradient(circle at 50% -10%, rgba(99,102,241,.10), transparent 34%), #f8fafc !important;
          color: #0f172a;
        }
        .to-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: linear-gradient(rgba(15,23,42,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.018) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom, black, transparent 72%);
        }
        .to-root .search-card {
          position: relative;
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,255,255,.90);
          border: 1px solid rgba(226,232,240,.92);
          box-shadow: 0 1px 2px rgba(15,23,42,.03), 0 14px 38px rgba(15,23,42,.055);
          backdrop-filter: blur(18px);
        }
        .to-root .search-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,255,255,.75), transparent 42%);
        }
        .to-root .s-input {
          height: 48px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding-inline: 14px;
          color: #0f172a;
          box-shadow: inset 0 1px 2px rgba(15,23,42,.02);
        }
        .to-root .s-input::placeholder { color: #94a3b8; }
        .to-root .s-input:focus {
          border-color: #818cf8;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(99,102,241,.10);
        }
        .to-root .s-btn {
          min-height: 48px;
          border-radius: 14px;
          padding-inline: 18px;
          background: #4f46e5;
          box-shadow: 0 8px 20px rgba(79,70,229,.20);
        }
        .to-root .s-btn:hover {
          transform: translateY(-1px);
          background: #4338ca;
          box-shadow: 0 12px 26px rgba(79,70,229,.25);
        }
        .to-root .result-card {
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          background: rgba(255,255,255,.96);
          box-shadow: 0 1px 2px rgba(15,23,42,.03), 0 18px 50px rgba(15,23,42,.065);
        }
        .to-root .timeline-wrap {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e8edf3;
          padding-block: 16px;
        }
        .to-root .tl-circle.done {
          background: #4f46e5;
          box-shadow: 0 5px 16px rgba(79,70,229,.22);
        }
        .to-root .tl-circle.current {
          box-shadow: 0 0 0 5px rgba(99,102,241,.10);
          border-width: 2px;
        }
        .to-root .info-chip {
          min-height: 84px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #e8edf3;
          box-shadow: 0 3px 12px rgba(15,23,42,.025);
        }
        .to-root .info-chip:hover {
          transform: translateY(-1px);
          border-color: #dbe3ef;
          box-shadow: 0 7px 18px rgba(15,23,42,.05);
        }
        .to-root .addr-box {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e8edf3;
        }
        .to-root .item-row {
          min-height: 50px;
          border-bottom-color: #eef2f7;
        }
        .to-root .cancel-btn {
          min-height: 44px;
          border-radius: 13px;
          padding-inline: 18px;
          background: #fff;
          color: #dc2626;
          border: 1px solid #fecaca;
          box-shadow: none;
        }
        .to-root .cancel-btn:hover:not(:disabled) {
          background: #fef2f2;
          border-color: #fca5a5;
          box-shadow: none;
          transform: translateY(-1px);
        }
        .track-top-icon {
          position: relative;
          overflow: hidden;
        }
        .track-top-icon::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.32) 50%, transparent 65%);
          transform: translateX(-120%);
          animation: trackIconShine 3.2s ease-in-out infinite;
        }
        @keyframes trackIconShine {
          0%, 55%, 100% { transform: translateX(-120%); }
          75% { transform: translateX(120%); }
        }
        .track-search-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .to-root > .relative.z-10 {
            padding-top: 18px !important;
            padding-bottom: max(24px, env(safe-area-inset-bottom)) !important;
          }
          .to-root .search-card { padding: 14px; border-radius: 18px; margin-bottom: 14px; }
          .to-root .s-input, .to-root .s-btn { min-height: 46px; }
          .to-root .result-card { border-radius: 20px; }
          .to-root .result-card > .p-6 { padding: 16px !important; }
          .to-root .info-chip { min-height: 78px; padding: 11px 12px; }
          .to-root .tl-step { flex-basis: 86px; }
          .to-root .tl-label { font-size: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .track-top-icon::after { animation: none !important; }
        }
      `}</style>

      <div
        className="to-root min-h-screen relative overflow-x-hidden"
        style={{
          background: "#f8fafc",
        }}
      >
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-72 overflow-hidden">
          <div className="absolute left-1/2 top-[-170px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-indigo-100/45 blur-3xl" />
          <div className="absolute right-[-120px] top-24 h-48 w-48 rounded-full bg-blue-100/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col items-center">
          {/* ── HEADER ── */}
          <div className="page-enter mb-5 w-full">
            <div className="flex items-center gap-3">
              <div className="track-top-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_8px_24px_rgba(79,70,229,.20)]">
                <FaTruck size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-600">
                  Order tracking
                </p>
                <h1 className="mt-0.5 text-[23px] font-extrabold tracking-[-.035em] text-slate-900 sm:text-[28px]">
                  Track your order
                </h1>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">
                  Enter your Odikart Order Number to see delivery updates.
                </p>
              </div>
            </div>
          </div>

          {/* ── SEARCH CARD ── */}
          <div className="page-enter search-card w-full p-4 sm:p-5 mb-5">
            <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">
              <MdAutoAwesome size={12} style={{ display: "inline-block", marginRight: "6px" }} />
               Odikart Order Number
            </label>

            <div className="flex gap-3 items-center flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Enter ODK order number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchOrder(orderId)}
                className="s-input w-full sm:flex-1"
              />
              <button className="s-btn w-full sm:w-auto" onClick={() => fetchOrder(orderId)}>
                {loading ? (
                  <div className="spinner relative z-10" />
                ) : (
                  <FaSearch size={16} className="relative z-10" />
                )}
                <span className="relative z-10">{loading ? "Searching…" : "Track"}</span>
              </button>
            </div>
          </div>

          {/* ── NOT FOUND ── */}
          {!loading && searched && !order && (
            <div className="result-enter text-center py-16 w-full">
              <div className="empty-icon mx-auto mb-4">
                <FaTimesCircle size={36} style={{ color: "#ef4444" }} />
              </div>
              <h2 className="to-serif text-2xl font-bold text-indigo-950 mb-2">Order Not Found</h2>
              <p className="text-slate-400 text-sm mb-6">
                Double-check your  Odikart Order Number and try again. You can find it in your confirmation email.
              </p>
              <button
                onClick={() => setSearched(false)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── LOADING ── */}
          {loading && searched && <SkeletonLoader />}

          {/* ── ORDER RESULT ── */}
          {order && (
            <div className="result-enter result-card w-full">
              {/* ── TOP ACCENT ── */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${isCancelled ? "#ef4444" : STATUS_CFG[order.status]?.dot || "#6366f1"
                    }, rgba(99, 102, 241, 0.3))`,
                }}
              />

              <div className="p-6 sm:p-8 space-y-7">
                {/* ── TOP ROW ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-2">
                      <FaBarcode size={11} style={{ display: "inline-block", marginRight: "6px" }} />
                       Odikart Order Number
                    </p>
                    <p className="font-mono text-sm font-bold text-indigo-950 break-all">{order._id}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                      <FaClock size={11} />
                      {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full flex-shrink-0 whitespace-nowrap"
                    style={{
                      background: STATUS_CFG[order.status]?.bg || "#eef2ff",
                      color: STATUS_CFG[order.status]?.text || "#3730a3",
                      border: `1.5px solid ${STATUS_CFG[order.status]?.border || "#a5b4fc"}`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: STATUS_CFG[order.status]?.dot || "#6366f1" }}
                    />
                    {order.status}
                  </span>
                </div>

                {/* ── STATUS TIMELINE ── */}
                {!isCancelled && (
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase mb-5">
                      📦 Shipment Progress
                    </p>
                    <div className="timeline-wrap">
                      {STATUS_STEPS.map((step, i) => {
                        const isDone = currentStepIdx > i;
                        const isCurrent = currentStepIdx === i;
                        const isLast = i === STATUS_STEPS.length - 1;

                        return (
                          <div key={step.key} className="tl-step">
                            {/* ── CONNECTOR LINE ── */}
                            {!isLast && (
                              <div className="tl-line">
                                {isDone && (
                                  <div
                                    className="tl-line-fill"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                  />
                                )}
                              </div>
                            )}

                            {/* ── CIRCLE ── */}
                            <div
                              className={`tl-circle ${isDone ? "done" : isCurrent ? "current" : ""}`}
                              style={isDone ? { animationDelay: `${i * 0.12}s` } : {}}
                            >
                              {isDone ? (
                                <FaCheckCircle size={16} color="white" />
                              ) : (
                                <span style={{ color: isCurrent ? "#6366f1" : "#cbd5e1" }}>
                                  {step.icon}
                                </span>
                              )}
                            </div>

                            {/* ── LABEL ── */}
                            <p className={`tl-label ${isDone ? "done" : isCurrent ? "current" : ""}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="flex items-center gap-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 rounded-2xl px-5 py-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <FaTimesCircle size={18} style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <p className="font-bold text-red-700 text-sm">Order Cancelled</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        This order has been cancelled. A refund will be processed soon.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── INFO GRID ── */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: <FaUser size={12} style={{ color: "#6366f1" }} />,
                      label: "Customer",
                      value: order.fullname,
                    },
                    {
                      icon: <FaEnvelope size={12} style={{ color: "#2563eb" }} />,
                      label: "Email",
                      value: order.deliveryAddress?.customer?.email,
                    },
                    {
                      icon: <FaPhoneAlt size={12} style={{ color: "#10b981" }} />,
                      label: "Phone",
                      value: order.deliveryAddress?.customer?.phone,
                    },
                    {
                      icon: <FaCreditCard size={12} style={{ color: "#8b5cf6" }} />,
                      label: "Payment",
                      value: `${order.payment?.method} · ${order.payment?.status}`,
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="info-chip">
                      <div className="flex items-center gap-2 mb-2">
                        {icon}
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* ── TOTAL ── */}
                <div className="flex items-center justify-between bg-slate-900 rounded-2xl px-5 py-4 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "14px 14px",
                    }}
                  />
                  <div className="relative">
                    <p className="text-indigo-200 text-[10px] font-bold tracking-widest uppercase mb-1">
                      Order Total
                    </p>
                    <p className="text-white/70 text-xs">Incl. taxes & handling</p>
                  </div>
                  <p className="relative to-serif text-3xl font-extrabold text-white flex items-baseline gap-1">
                    <FaRupeeSign size={18} />
                    {order.pricing?.total?.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* ── DELIVERY ADDRESS ── */}
                {order.deliveryAddress && (
                  <div className="addr-box">
                    <div className="flex items-center gap-2 mb-3">
                      <FaMapMarkerAlt size={13} style={{ color: "#6366f1" }} />
                      <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">
                        Delivery Address
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
        {order.deliveryAddress?.address?.addressLine1}

{order.deliveryAddress?.address?.addressLine2 && (
  <>
    <br />
    {order.deliveryAddress.address.addressLine2}
  </>
)}

{order.deliveryAddress?.address?.landmark && (
  <>
    <br />
    {order.deliveryAddress.address.landmark}
  </>
)}

<br />

{order.deliveryAddress?.address?.area},{" "}
{order.deliveryAddress?.address?.city}

<br />

{order.deliveryAddress?.address?.district},{" "}
{order.deliveryAddress?.address?.state}

{" - "}

{order.deliveryAddress?.address?.postalCode}

<br />

{order.deliveryAddress?.address?.country}
                    </p>
                  </div>
                )}

                {/* ── ORDER ITEMS ── */}
                {order.items?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase mb-3">
                      📦 Items ({order.items.length})
                    </p>
                    <div className="bg-gradient-to-br from-white/60 to-indigo-50/30 border border-indigo-100/50 rounded-2xl px-4 py-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="item-row">
                          <span className="flex items-center gap-2 text-slate-700 font-medium min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="line-clamp-1 text-sm">{item.title}</span>
                            <span className="text-slate-400 text-xs font-normal flex-shrink-0">
                              ×{item.quantity}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-indigo-600 text-sm flex-shrink-0 ml-3">
                            <FaRupeeSign size={10} />
                            {(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── CANCEL BUTTON ── */}
                <div className="flex justify-center pt-3">
                  {canCancel ? (
                    <button
                      className="cancel-btn"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <div className="spinner" />
                          Cancelling…
                        </>
                      ) : (
                        <>
                          <FaTimes size={13} />
                          Cancel Order
                        </>
                      )}
                    </button>
                  ) : !isCancelled ? (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <FaClock size={11} />
                      Cancellation window has passed (7 days)
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CANCEL MODAL ── */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        hideCloseButton
        backdrop="blur"
        size="sm"
      >
        <ModalContent className="rounded-2xl bg-white shadow-2xl border border-red-100">
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-4 pt-6 pb-2">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FaTimesCircle size={18} style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-indigo-950">Cancel Order?</h2>
                  <p className="text-xs text-red-500 font-semibold mt-0.5">This action cannot be undone</p>
                </div>
              </ModalHeader>

              <ModalBody className="py-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to cancel this order? You will receive a refund according to our refund policy.
                </p>

                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-800 mb-2">⏰ Refund Timeline</p>
                  <p className="text-xs text-amber-700">
                    Refunds are processed within 5–7 business days after cancellation approval.
                  </p>
                </div>
              </ModalBody>

              <ModalFooter className="gap-2 pb-6">
                <Button
                  className="flex-1 border-2 border-indigo-200 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50"
                  variant="bordered"
                  onPress={onClose}
                >
                  Keep Order
                </Button>

                <Button
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl shadow-lg"
                  onPress={handleCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── INFO NOTICE MODAL ── */}
      <Modal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        backdrop="blur"
        placement="center"
        size="md"
        hideCloseButton
      >
        <ModalContent className="rounded-3xl overflow-hidden border bg-white border-amber-100 shadow-2xl">
          {(onClose) => (
            <>
              {/* ── TOP ACCENT ── */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)",
                }}
              />

              <ModalHeader className="pt-7 pb-3 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FaEnvelope size={24} style={{ color: "#d97706" }} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Save Your  Odikart Order Number</h2>
                  <p className="text-xs text-amber-600 font-bold mt-1 tracking-widest uppercase">
                    Important Notice
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="pb-4">
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5 space-y-3">
                  <p className="text-sm leading-relaxed text-slate-700 font-medium">
                    Your  Odikart Order Number has been sent to your registered email address. Please copy and save it for:
                  </p>

                  <div className="space-y-2">
                    {["📍 Tracking your order", "💬 Requesting support", "❌ Cancelling your order", "📄 Invoice verification"].map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-sm text-slate-700 font-medium"
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                          {item}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-center text-slate-400 mt-3 font-medium">
                  This message will close automatically in a few seconds
                </p>
              </ModalBody>

              <ModalFooter className="pb-6 pt-3">
                <Button
                  onPress={onClose}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold py-6 text-sm shadow-lg hover:shadow-xl transition"
                >
                  Got It
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default TrackOrder;