import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  Trash2,
  Package,
  Truck,
  Tag,
  Heart,
  UserRound,
  Megaphone,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationApi";

/* =========================================================
   TIME AGO
========================================================= */

const timeAgo = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m ago`;
  }

  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

/* =========================================================
   NOTIFICATION ICON
========================================================= */

const notificationMeta = {
  order: {
    icon: Package,
    iconClass: "bg-blue-50 text-blue-600",
    dotClass: "bg-blue-600",
  },

  delivery: {
    icon: Truck,
    iconClass: "bg-emerald-50 text-emerald-600",
    dotClass: "bg-emerald-600",
  },

  offer: {
    icon: Tag,
    iconClass: "bg-amber-50 text-amber-600",
    dotClass: "bg-amber-500",
  },

  wishlist: {
    icon: Heart,
    iconClass: "bg-rose-50 text-rose-500",
    dotClass: "bg-rose-500",
  },

  account: {
    icon: UserRound,
    iconClass: "bg-violet-50 text-violet-600",
    dotClass: "bg-violet-600",
  },

  announcement: {
    icon: Megaphone,
    iconClass: "bg-indigo-50 text-indigo-600",
    dotClass: "bg-indigo-600",
  },

  default: {
    icon: Bell,
    iconClass: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-500",
  },
};

const getNotificationMeta = (type) => {
  return notificationMeta[type] || notificationMeta.default;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function NotificationBell() {
  const navigate = useNavigate();

  const ref = useRef(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const load = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      const data = await getNotifications(8);

      const list =
        data?.notifications ||
        data?.data?.notifications ||
        data?.data ||
        [];

      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Notification fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    load();

    const id = window.setInterval(load, 30000);

    return () => window.clearInterval(id);
  }, [load]);

  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    const close = (event) => {
      if (
        open &&
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unread = items.filter((item) => !item.isRead).length;

  /* =======================================================
     OPEN NOTIFICATION
  ======================================================= */

  const openNotification = async (item) => {
    try {
      setBusy(item._id);

      if (!item.isRead) {
        await markNotificationAsRead(item._id);

        setItems((prev) =>
          prev.map((x) =>
            x._id === item._id
              ? {
                  ...x,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : x
          )
        );
      }

      setOpen(false);

      navigate(
        item.link ||
          (item.orderId
            ? `/orders/${item.orderId}`
            : "/account/notifications")
      );
    } catch (error) {
      console.error("Notification read failed:", error);

      toast.error(
        error.message || "Unable to open notification"
      );
    } finally {
      setBusy(null);
    }
  };

  /* =======================================================
     MARK ALL
  ======================================================= */

  const markAll = async () => {
    try {
      setBusy("all");

      await markAllNotificationsAsRead();

      setItems((prev) =>
        prev.map((x) => ({
          ...x,
          isRead: true,
          readAt:
            x.readAt || new Date().toISOString(),
        }))
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(
        error.message ||
          "Unable to mark notifications as read"
      );
    } finally {
      setBusy(null);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const remove = async (event, id) => {
    event.stopPropagation();

    try {
      setBusy(id);

      await deleteNotification(id);

      setItems((prev) =>
        prev.filter((x) => x._id !== id)
      );
    } catch (error) {
      toast.error(
        error.message || "Unable to delete notification"
      );
    } finally {
      setBusy(null);
    }
  };

  /* =======================================================
     AUTH
  ======================================================= */

  if (!localStorage.getItem("token")) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      ref={ref}
      className="relative"
    >
      {/* ===================================================
          NOTIFICATION BUTTON
      =================================================== */}

      <button
        type="button"
        aria-label={`Notifications${
          unread ? `, ${unread} unread` : ""
        }`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);

          if (!open) {
            load();
          }
        }}
        className="
          group
          relative
          inline-flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-transparent
          bg-transparent
          text-slate-500
          transition-all
          duration-200
          hover:border-slate-200
          hover:bg-slate-50
          hover:text-indigo-600
          focus:outline-none
          focus:ring-4
          focus:ring-indigo-500/10
          active:scale-95
        "
      >
        <Bell
          size={19}
          strokeWidth={2}
          className="
            transition-transform
            duration-200
            group-hover:-rotate-6
          "
        />

        {/* Unread badge */}
        {unread > 0 && (
          <>
            <span
              className="
                absolute
                right-[1px]
                top-[1px]
                h-2
                w-2
                rounded-full
                bg-indigo-600
                ring-2
                ring-white
              "
            />

            <span
              className="
                absolute
                -right-1
                -top-1
                flex
                min-h-[17px]
                min-w-[17px]
                items-center
                justify-center
                rounded-full
                bg-indigo-600
                px-1
                text-[8px]
                font-black
                leading-none
                text-white
                shadow-[0_3px_10px_rgba(79,70,229,0.28)]
              "
            >
              {unread > 99 ? "99+" : unread}
            </span>
          </>
        )}
      </button>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      {open && (
     <div
  className="
    fixed
    right-2.5
    top-[69px]
    z-[100]
    w-[min(380px,calc(100vw-24px))]
    max-h-[calc(100vh-112px)]
    overflow-hidden
    rounded-[24px]
    border
    border-slate-200/80
    bg-white
    shadow-[0_24px_70px_rgba(15,23,42,0.18)]
  "
>
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              relative
              overflow-hidden
              border-b
              border-slate-100
              bg-white
              px-4
              py-4
            "
          >
            {/* subtle header glow */}
            <div
              className="
                pointer-events-none
                absolute
                -right-10
                -top-10
                h-24
                w-24
                rounded-full
                bg-indigo-100/50
                blur-2xl
              "
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                    text-indigo-600
                    ring-1
                    ring-indigo-100
                  "
                >
                  <Bell
                    size={18}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[13px] font-black tracking-[-0.01em] text-slate-900">
                    Notifications
                  </p>

                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {unread
                      ? `${unread} unread notification${
                          unread === 1 ? "" : "s"
                        }`
                      : "You're all caught up"}
                  </p>
                </div>
              </div>

              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  disabled={busy === "all"}
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-indigo-100
                    bg-indigo-50/70
                    px-2.5
                    py-2
                    text-[10px]
                    font-extrabold
                    text-indigo-600
                    transition-all
                    hover:border-indigo-200
                    hover:bg-indigo-100
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {busy === "all" ? (
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCheck size={13} />
                  )}

                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="max-h-[410px] overflow-y-auto">
            {/* LOADING */}
            {loading && !items.length ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="
                      flex
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                    "
                  >
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />

                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
                      <div className="h-2 w-1/3 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !items.length ? (
              /* EMPTY */
              <div className="px-6 py-14 text-center">
                <div
                  className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-50
                    text-slate-400
                    ring-1
                    ring-slate-200
                  "
                >
                  <Inbox
                    size={24}
                    strokeWidth={1.7}
                  />
                </div>

                <p className="mt-4 text-sm font-black text-slate-900">
                  No notifications yet
                </p>

                <p className="mx-auto mt-1.5 max-w-[250px] text-[11px] leading-5 text-slate-400">
                  Order updates, delivery information,
                  offers and important messages will
                  appear here.
                </p>
              </div>
            ) : (
              /* LIST */
              <div className="p-2">
                {items.map((item) => {
                  const meta = getNotificationMeta(
                    item.type
                  );

                  const Icon = meta.icon;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() =>
                        openNotification(item)
                      }
                      className={`
                        group
                        relative
                        flex
                        w-full
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-left
                        transition-all
                        duration-200
                        hover:bg-slate-50
                        ${
                          !item.isRead
                            ? "bg-indigo-50/50 hover:bg-indigo-50"
                            : "bg-white"
                        }
                      `}
                    >
                      {/* unread vertical indicator */}
                      {!item.isRead && (
                        <span
                          className="
                            absolute
                            left-0
                            top-3
                            bottom-3
                            w-0.5
                            rounded-full
                            bg-indigo-600
                          "
                        />
                      )}

                      {/* ICON */}
                      <span
                        className={`
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          ring-1
                          ring-black/[0.02]
                          ${meta.iconClass}
                        `}
                      >
                        <Icon
                          size={17}
                          strokeWidth={2}
                        />
                      </span>

                      {/* CONTENT */}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span
                            className={`
                              min-w-0
                              flex-1
                              truncate
                              text-[11px]
                              leading-5
                              ${
                                item.isRead
                                  ? "font-bold text-slate-700"
                                  : "font-black text-slate-900"
                              }
                            `}
                          >
                            {item.title}
                          </span>

                          {!item.isRead && (
                            <span
                              className={`
                                mt-1.5
                                h-1.5
                                w-1.5
                                shrink-0
                                rounded-full
                                ${meta.dotClass}
                              `}
                            />
                          )}
                        </span>

                        <span
                          className="
                            mt-0.5
                            block
                            line-clamp-2
                            text-[10px]
                            leading-[1.6]
                            text-slate-500
                          "
                        >
                          {item.message}
                        </span>

                        <span
                          className="
                            mt-1.5
                            flex
                            items-center
                            gap-1.5
                            text-[9px]
                            font-bold
                            text-slate-400
                          "
                        >
                          <span>
                            {timeAgo(item.createdAt)}
                          </span>

                          {!item.isRead && (
                            <>
                              <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />

                              <span className="text-indigo-500">
                                New
                              </span>
                            </>
                          )}
                        </span>
                      </span>

                      {/* DELETE */}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          remove(event, item._id)
                        }
                        className="
                          mt-1
                          inline-flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          text-slate-300
                          opacity-0
                          transition-all
                          duration-200
                          hover:bg-red-50
                          hover:text-red-500
                          group-hover:opacity-100
                          focus:opacity-100
                          focus:outline-none
                        "
                        aria-label="Delete notification"
                      >
                        {busy === item._id ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="
              border-t
              border-slate-100
              bg-slate-50/80
              p-2
            "
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/account/notifications");
              }}
              className="
                group
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-transparent
                bg-white
                py-2.5
                text-[10px]
                font-black
                text-indigo-600
                shadow-sm
                transition-all
                duration-200
                hover:border-indigo-100
                hover:bg-indigo-50
                active:scale-[0.98]
              "
            >
              View all notifications

              <ArrowRight
                size={13}
                className="
                  transition-transform
                  duration-200
                  group-hover:translate-x-0.5
                "
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}