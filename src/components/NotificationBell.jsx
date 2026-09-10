import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationApi";

const timeAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const iconFor = (type) => ({
  order: "📦",
  delivery: "🚚",
  offer: "🏷️",
  wishlist: "❤️",
  account: "👤",
  announcement: "📢",
}[type] || "🔔");

export default function NotificationBell() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getNotifications(8);
      const list = data?.notifications || data?.data?.notifications || data?.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Notification fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const close = (event) => {
      if (open && ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const unread = items.filter((item) => !item.isRead).length;

  const openNotification = async (item) => {
    try {
      setBusy(item._id);
      if (!item.isRead) {
        await markNotificationAsRead(item._id);
        setItems((prev) =>
          prev.map((x) =>
            x._id === item._id
              ? { ...x, isRead: true, readAt: new Date().toISOString() }
              : x
          )
        );
      }
      setOpen(false);
      navigate(item.link || (item.orderId ? `/orders/${item.orderId}` : "/account/notifications"));
    } catch (error) {
      console.error("Notification read failed:", error);
      toast.error(error.message || "Unable to open notification");
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    try {
      setBusy("all");
      await markAllNotificationsAsRead();
      setItems((prev) =>
        prev.map((x) => ({ ...x, isRead: true, readAt: x.readAt || new Date().toISOString() }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.message || "Unable to mark notifications as read");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (event, id) => {
    event.stopPropagation();
    try {
      setBusy(id);
      await deleteNotification(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (error) {
      toast.error(error.message || "Unable to delete notification");
    } finally {
      setBusy(null);
    }
  };

  if (!localStorage.getItem("token")) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black leading-none text-white shadow-md shadow-indigo-200">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-900">Notifications</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                {unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={busy === "all"}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-extrabold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
              >
                {busy === "all" ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            {loading && !items.length ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs font-semibold text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            ) : !items.length ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl">🔔</div>
                <p className="mt-3 text-sm font-black text-slate-900">No notifications yet</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Order updates and important messages will appear here.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={`group flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 ${!item.isRead ? "bg-indigo-50/45" : "bg-white"}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
                    {iconFor(item.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className={`min-w-0 flex-1 text-xs font-extrabold ${item.isRead ? "text-slate-700" : "text-slate-900"}`}>
                        {item.title}
                      </span>
                      {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">{item.message}</span>
                    <span className="mt-1.5 block text-[9px] font-bold text-slate-400">{timeAgo(item.createdAt)}</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => remove(event, item._id)}
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Delete notification"
                  >
                    {busy === item._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/account/notifications");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black text-indigo-600 hover:bg-white"
            >
              View all notifications <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
