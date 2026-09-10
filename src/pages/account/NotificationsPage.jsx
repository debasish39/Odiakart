import React, { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBox,
  FaTag,
  FaTruck,
  FaHeart,
  FaCheckCircle,
  FaInfoCircle,
  FaTrash,
  FaCheckDouble,
  FaExternalLinkAlt,
  FaBullhorn,
  FaCog,
  FaTimes,
  FaSyncAlt,
  FaEnvelope,
  FaMobileAlt,
  FaDesktop,
  FaComments,
  FaCommentAlt,
} from "react-icons/fa";

import { AccountShell, api } from "./AccountShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationSettings,
} from "../../services/notificationApi";

import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const initial = {
  inApp: true,
  email: true,
  sms: true,
  push: true,
  promotionalEmail: true,
  promotionalSms: true,
  promotionalPush: true,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsRefreshing, setNotificationsRefreshing] =
    useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");

  const navigate = useNavigate();

  /* =========================================================
     NOTIFICATIONS
     Shared cache:
       ["notifications", token, 100]
     ========================================================= */

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsQueryError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications", token, 100],
    queryFn: async () => {
      const data = await getNotifications(100);
      return data?.notifications || [];
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const notificationsError =
    notificationsQueryError?.message ||
    (!token
      ? "Please sign in to view your notifications."
      : "");

  /* =========================================================
     SETTINGS
     Reuse the same current-user cache used by ProfilePage and
     wishlistContext instead of calling /api/auth/me again.
     ========================================================= */

  const {
    data: currentUser = null,
    isLoading: loading,
    error: currentUserError,
  } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      const data = await api("/api/auth/me");

      if (!data?.success) {
        throw new Error(
          data?.message || "Failed to load notification settings."
        );
      }

      return data.user || null;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    const settings = currentUser?.notificationSettings;

    if (!settings) return;

    setS({
      inApp: settings.inApp !== false,
      email: settings.email !== false,
      sms: settings.sms !== false,
      push: settings.push !== false,
      promotionalEmail: settings.promotionalEmail !== false,
      promotionalSms: settings.promotionalSms !== false,
      promotionalPush: settings.promotionalPush !== false,
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUserError) return;

    console.error(
      "Failed to load notification settings:",
      currentUserError
    );

    toast.error(
      currentUserError.message ||
        "Could not load notification preferences."
    );
  }, [currentUserError]);

  const loadNotifications = async (showRefresh = false) => {
    try {
      if (showRefresh) setNotificationsRefreshing(true);

      await refetchNotifications();
    } catch (error) {
      console.error(
        "Failed to refresh notifications:",
        error
      );
    } finally {
      if (showRefresh) setNotificationsRefreshing(false);
    }
  };

  /* =========================================================
     NOTIFICATION HELPERS
  ========================================================= */

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }

    if (notificationFilter === "read") {
      return notifications.filter((item) => item.isRead);
    }

    return notifications;
  }, [notifications, notificationFilter]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return FaBox;
      case "delivery":
        return FaTruck;
      case "wishlist":
        return FaHeart;
      case "offer":
        return FaTag;
      case "announcement":
        return FaBullhorn;
      case "account":
        return FaCog;
      default:
        return FaBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "order":
        return "purple";
      case "delivery":
        return "blue";
      case "wishlist":
        return "pink";
      case "offer":
      case "announcement":
        return "orange";
      case "account":
        return "slate";
      default:
        return "purple";
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      order: "Order",
      delivery: "Delivery",
      wishlist: "Wishlist",
      offer: "Offer",
      announcement: "Announcement",
      account: "Account",
      system: "System",
    };

    return labels[type] || "Notification";
  };

  const formatNotificationTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  /* =========================================================
     NOTIFICATION ACTIONS
  ========================================================= */

  const notificationQueryKey = ["notifications", token, 100];

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);

        queryClient.setQueryData(
          notificationQueryKey,
          (prev = []) =>
            prev.map((item) =>
              item._id === notification._id
                ? {
                    ...item,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : item
            )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    // Order notifications should always open the related order page.
    if (notification.orderId) {
      navigate(`/account/orders/${notification.orderId}`);
      return;
    }

    if (notification.link) {
      if (notification.link.startsWith("http")) {
        window.location.href = notification.link;
      } else {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!unreadNotifications.length) return;

    try {
      await markAllNotificationsAsRead();

      queryClient.setQueryData(
        notificationQueryKey,
        (prev = []) =>
          prev.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt || new Date().toISOString(),
          }))
      );

      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(
        error.message || "Could not mark notifications as read."
      );
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);

      queryClient.setQueryData(
        notificationQueryKey,
        (prev = []) =>
          prev.filter((item) => item._id !== id)
      );

      toast.success("Notification deleted.");
    } catch (error) {
      toast.error(
        error.message || "Could not delete notification."
      );
    }
  };

  /* =========================================================
     SETTINGS
  ========================================================= */

  const notificationOptions = [
    {
      key: "inApp",
      title: "Website notifications",
      description: "Updates inside your OdiKart account",
      Icon: FaDesktop,
    },
    {
      key: "email",
      title: "Email notifications",
      description: "Important account and order updates",
      Icon: FaEnvelope,
    },
    {
      key: "sms",
      title: "SMS notifications",
      description: "Order and delivery alerts by SMS",
      Icon: FaComments,
    },
    {
      key: "push",
      title: "Push notifications",
      description: "Real-time alerts on supported devices",
      Icon: FaMobileAlt,
    },
  ];

  const promotionalOptions = [
    {
      key: "promotionalEmail",
      title: "Promotional emails",
      description: "Offers, deals and product promotions",
      Icon: FaEnvelope,
    },
    {
      key: "promotionalSms",
      title: "Promotional SMS",
      description: "Selected offers and promotions",
      Icon: FaCommentAlt,
    },
    {
      key: "promotionalPush",
      title: "Promotional push alerts",
      description: "Deals and promotional notifications",
      Icon: FaBullhorn,
    },
  ];

  const enabledCount = useMemo(
    () => Object.values(s).filter(Boolean).length,
    [s]
  );

  const toggle = async (key) => {
    const previous = s;

    const next = {
      ...s,
      [key]: !s[key],
    };

    setS(next);

    try {
      setSaving(true);

      await updateNotificationSettings(next);

      // Keep the shared current-user cache in sync so ProfilePage
      // and other consumers don't need another /api/auth/me call.
      queryClient.setQueryData(
        ["currentUser", token],
        (user) =>
          user
            ? {
                ...user,
                notificationSettings: next,
              }
            : user
      );

      toast.success("Notification preference updated.");
    } catch (error) {
      setS(previous);

      console.error(
        "Failed to update notification setting:",
        error
      );

      toast.error(
        error.message ||
          "Could not update notification preference."
      );
    } finally {
      setSaving(false);
    }
  };

  const closeSettings = () => {
    if (!saving) {
      setSettingsOpen(false);
    }
  };

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    if (!settingsOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen, saving]);

  return (
    <AccountShell title="Notifications">
      <div className="notifications-page">

        {/* =====================================================
            HEADER
        ===================================================== */}

        {/* =====================================================
            SUMMARY BAR
        ===================================================== */}

        <section className="notifications-summary mt-18">

          <div className="summary-left">

            <span className="summary-status-dot" />

            <div>
              <strong>
                {unreadNotifications.length
                  ? `${unreadNotifications.length} unread`
                  : "You're all caught up"}
              </strong>

              <span>
                {notifications.length} notification
                {notifications.length === 1 ? "" : "s"} in your account
              </span>
            </div>

          </div>

          <button
            type="button"
            className="mark-read-button"
            onClick={handleMarkAllRead}
            disabled={
              !unreadNotifications.length ||
              notificationsLoading
            }
          >
            <FaCheckDouble />
            Mark all read
          </button>

        </section>

        {/* =====================================================
            NOTIFICATION HISTORY
        ===================================================== */}

        <section className="notifications-history">

          <div className="history-heading">

            <div>
              <h2>Recent activity</h2>
              <p>
                Your latest orders, deliveries and account updates.
              </p>
            </div>

          </div>

          {/* FILTERS */}

          <div className="notification-filters">

            {[
              ["all", "All", notifications.length],
              [
                "unread",
                "Unread",
                unreadNotifications.length,
              ],
              [
                "read",
                "Read",
                notifications.length -
                  unreadNotifications.length,
              ],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className={
                  notificationFilter === key
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setNotificationFilter(key)
                }
              >
                {label}
                <span>{count}</span>
              </button>
            ))}

          </div>

          {/* LOADING */}

          {notificationsLoading ? (
            <div className="notification-state">

              <div className="loading-ring" />

              <strong>
                Loading notifications...
              </strong>

              <span>
                Getting your latest OdiKart updates.
              </span>

            </div>
          ) : notificationsError ? (
            <div className="notification-state error">

              <div className="empty-icon">
                <FaTimes />
              </div>

              <strong>
                Couldn't load notifications
              </strong>

              <span>{notificationsError}</span>

              <button
                type="button"
                onClick={() => loadNotifications(true)}
              >
                Try again
              </button>

            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-state">

              <div className="empty-icon">
                <FaBell />
              </div>

              <strong>
                {notificationFilter === "unread"
                  ? "You're all caught up"
                  : notificationFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </strong>

              <span>
                New order, delivery and account updates
                will appear here.
              </span>

            </div>
          ) : (
            <div className="notification-history-list">

              {filteredNotifications.map((notification) => {

                const Icon = getNotificationIcon(
                  notification.type
                );

                const color = getNotificationColor(
                  notification.type
                );

                return (
                  <article
                    key={notification._id}
                    className={`notification-card ${
                      notification.isRead
                        ? "read"
                        : "unread"
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    role={
                      notification.link ||
                      notification.orderId
                        ? "button"
                        : undefined
                    }
                    tabIndex={
                      notification.link ||
                      notification.orderId
                        ? 0
                        : undefined
                    }
                    onKeyDown={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        (notification.link || notification.orderId)
                      ) {
                        event.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                  >

                    <div
                      className={`notification-type-icon ${color}`}
                    >
                      <Icon />
                    </div>

                    <div className="notification-body">

                      <div className="notification-top">

                        <div className="notification-title">

                          {!notification.isRead && (
                            <span className="unread-dot" />
                          )}

                          <h3>
                            {notification.title}
                          </h3>

                        </div>

                        <span className="notification-time">
                          {formatNotificationTime(
                            notification.createdAt
                          )}
                        </span>

                      </div>

                      <p>
                        {notification.message}
                      </p>

                      <div className="notification-bottom">

                        <span
                          className={`notification-category ${color}`}
                        >
                          {getTypeLabel(
                            notification.type
                          )}
                        </span>

                        {(notification.link ||
                          notification.orderId) && (
                          <button
                            type="button"
                            className="open-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            aria-label={
                              notification.orderId
                                ? "Open order"
                                : "Open notification"
                            }
                          >
                            {notification.orderId ? "Open order" : "Open"}
                            <FaExternalLinkAlt />
                          </button>
                        )}

                      </div>

                    </div>

                    <button
                      type="button"
                      className="delete-button"
                      aria-label="Delete notification"
                      onClick={(event) => {
                        event.stopPropagation();

                        handleDeleteNotification(
                          notification._id
                        );
                      }}
                    >
                      <FaTrash />
                    </button>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* =====================================================
            SETTINGS MODAL
        ===================================================== */}

        {settingsOpen && (
          <div
            className="settings-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeSettings();
              }
            }}
          >

            <div
              className="settings-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-settings-title"
            >

              {/* MODAL HEADER */}

              <div className="settings-modal-header">

                <div className="settings-modal-title">

                  <div className="settings-modal-icon">
                    <FaCog />
                  </div>

                  <div>
                    <h2 id="notification-settings-title">
                      Notification settings
                    </h2>

                    <p>
                      Choose how OdiKart keeps you updated.
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="modal-close-button"
                  onClick={closeSettings}
                  disabled={saving}
                  aria-label="Close settings"
                >
                  <FaTimes />
                </button>

              </div>

              {/* MODAL STATUS */}

              <div className="settings-status">

                <div className="settings-status-left">

                  <span className="status-check">
                    <FaCheckCircle />
                  </span>

                  <div>
                    <strong>
                      {enabledCount} of 7 enabled
                    </strong>

                    <span>
                      {saving
                        ? "Saving your preferences..."
                        : "Your preferences are synced"}
                    </span>
                  </div>

                </div>

                <span
                  className={`sync-pill ${
                    saving ? "saving" : ""
                  }`}
                >
                  {saving ? "Saving…" : "Synced"}
                </span>

              </div>

              {/* GENERAL */}

              <div className="settings-section">

                <div className="settings-section-heading">

                  <div>
                    <span className="settings-section-label">
                      GENERAL
                    </span>

                    <h3>
                      Where should we notify you?
                    </h3>
                  </div>

                </div>

                <div className="settings-options">

                  {notificationOptions.map(
                    ({
                      key,
                      title,
                      description,
                      Icon,
                    }) => {

                      const enabled = s[key];

                      return (
                        <div
                          key={key}
                          className={`settings-option ${
                            enabled ? "enabled" : ""
                          }`}
                        >

                          <div
                            className={`settings-option-icon ${
                              enabled ? "active" : ""
                            }`}
                          >
                            <Icon />
                          </div>

                          <div className="settings-option-content">

                            <div className="settings-option-title">

                              <strong>
                                {title}
                              </strong>

                              {enabled && (
                                <span>
                                  Active
                                </span>
                              )}

                            </div>

                            <p>
                              {description}
                            </p>

                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`Toggle ${title}`}
                            className={`modern-switch ${
                              enabled ? "on" : ""
                            }`}
                            onClick={() => toggle(key)}
                            disabled={loading || saving}
                          >
                            <span />
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* PROMOTIONS */}

              <div className="settings-section promotions-section">

                <div className="settings-section-heading">

                  <div>
                    <span className="settings-section-label">
                      OFFERS & PROMOTIONS
                    </span>

                    <h3>
                      Discover more from OdiKart
                    </h3>

                    <p>
                      Get deals, offers and product
                      recommendations.
                    </p>
                  </div>

                </div>

                <div className="settings-options">

                  {promotionalOptions.map(
                    ({
                      key,
                      title,
                      description,
                      Icon,
                    }) => {

                      const enabled = s[key];

                      return (
                        <div
                          key={key}
                          className={`settings-option ${
                            enabled ? "enabled" : ""
                          }`}
                        >

                          <div
                            className={`settings-option-icon promotion ${
                              enabled ? "active" : ""
                            }`}
                          >
                            <Icon />
                          </div>

                          <div className="settings-option-content">

                            <div className="settings-option-title">

                              <strong>
                                {title}
                              </strong>

                              {enabled && (
                                <span>
                                  Active
                                </span>
                              )}

                            </div>

                            <p>
                              {description}
                            </p>

                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`Toggle ${title}`}
                            className={`modern-switch ${
                              enabled ? "on" : ""
                            }`}
                            onClick={() => toggle(key)}
                            disabled={loading || saving}
                          >
                            <span />
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="settings-modal-footer">

                <div className="footer-info">
                  <FaInfoCircle />

                  <span>
                    You can change these preferences anytime.
                  </span>
                </div>

                <button
                  type="button"
                  className="done-button"
                  onClick={closeSettings}
                  disabled={saving}
                >
                  Done
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .notifications-page {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          color: #17181d;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin: 18px 0 15px;
        }

        .notifications-header-left {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .notifications-header-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          flex: none;
          border: 1px solid #dedcff;
          border-radius: 15px;
          color: #4f46e5;
          background: linear-gradient(
            145deg,
            #f3f2ff,
            #eae9ff
          );
          box-shadow:
            0 8px 22px rgba(79,70,229,.10);
        }

        .notifications-eyebrow {
          margin-bottom: 3px;
          color: #6366f1;
          font-size: 14px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .notifications-header h1 {
          margin: 0;
          color: #17181d;
          font-size: 28px;
          line-height: 1.15;
          font-weight: 850;
          letter-spacing: -.7px;
        }

        .notifications-header p {
          margin: 4px 0 0;
          color: #858690;
          font-size: 13px;
        }

        .notifications-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: none;
        }

        .notification-icon-button,
        .notification-settings-button {
          height: 38px;
          border: 1px solid #e5e5eb;
          border-radius: 11px;
          color: #666773;
          background: #fff;
          font: inherit;
          cursor: pointer;
          transition: .18s ease;
        }

        .notification-icon-button {
          width: 38px;
          display: grid;
          place-items: center;
        }

        .notification-settings-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          font-size: 12px;
          font-weight: 800;
        }

        .notification-icon-button:hover,
        .notification-settings-button:hover {
          border-color: #d7d4ff;
          color: #4f46e5;
          background: #f8f7ff;
          transform: translateY(-1px);
        }

        .notification-icon-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        /* =====================================================
           SUMMARY
        ===================================================== */

        .notifications-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 14px;
          margin-bottom: 13px;
          border: 1px solid #e9e9ef;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 4px 18px rgba(22,24,45,.035);
        }

        .summary-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .summary-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,.09);
        }

        .summary-left strong,
        .summary-left span {
          display: block;
        }

        .summary-left strong {
          color: #30313a;
          font-size: 13px;
          font-weight: 850;
        }

        .summary-left span {
          margin-top: 2px;
          color: #92939d;
          font-size: 14px;
        }

        .mark-read-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 31px;
          padding: 0 10px;
          border: 1px solid #dfddff;
          border-radius: 9px;
          color: #4f46e5;
          background: #f7f6ff;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .mark-read-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* =====================================================
           HISTORY
        ===================================================== */

        .notifications-history {
          padding: 19px;
          border: 1px solid #e9e9ef;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 6px 25px rgba(22,24,45,.035);
        }

        .history-heading {
          margin-bottom: 13px;
        }

        .history-heading h2 {
          margin: 0;
          color: #282932;
          font-size: 16px;
          font-weight: 850;
        }

        .history-heading p {
          margin: 4px 0 0;
          color: #90919a;
          font-size: 12px;
        }

        /* =====================================================
           FILTERS
        ===================================================== */

        .notification-filters {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }

        .notification-filters button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 29px;
          padding: 0 10px;
          border: 1px solid #e8e8ee;
          border-radius: 999px;
          color: #7c7d87;
          background: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: .16s ease;
        }

        .notification-filters button span {
          min-width: 17px;
          padding: 2px 5px;
          border-radius: 999px;
          color: #8b8c96;
          background: #f1f1f5;
          font-size: 10px;
        }

        .notification-filters button:hover {
          border-color: #dcd9ff;
          color: #4f46e5;
        }

        .notification-filters button.active {
          border-color: #dcd9ff;
          color: #4f46e5;
          background: #f5f4ff;
        }

        /* =====================================================
           NOTIFICATION CARD
        ===================================================== */

        .notification-history-list {
          display: grid;
          gap: 8px;
        }

        .notification-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 11px;
          min-width: 0;
          padding: 13px;
          border: 1px solid #ededf2;
          border-radius: 15px;
          background: #fff;
          transition:
            border-color .18s ease,
            box-shadow .18s ease,
            transform .18s ease;
        }

        .notification-card[role="button"] {
          cursor: pointer;
        }

        .notification-card:hover {
          transform: translateY(-1px);
          border-color: #ddddeb;
          box-shadow: 0 8px 22px rgba(22,24,45,.055);
        }

        .notification-card.unread {
          border-color: #e0ddfa;
          background: linear-gradient(
            90deg,
            #fbfaff,
            #fff
          );
        }

        .notification-type-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 12px;
        }

        .notification-type-icon.purple {
          color: #4f46e5;
          background: #eeedff;
          border: 1px solid #e4e2ff;
        }

        .notification-type-icon.blue {
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #dbeafe;
        }

        .notification-type-icon.orange {
          color: #ea580c;
          background: #fff7ed;
          border: 1px solid #ffedd5;
        }

        .notification-type-icon.pink {
          color: #db2777;
          background: #fdf2f8;
          border: 1px solid #fce7f3;
        }

        .notification-type-icon.slate {
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .notification-body {
          min-width: 0;
          flex: 1;
        }

        .notification-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .notification-title {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .notification-title h3 {
          margin: 0;
          color: #282932;
          font-size: 14px;
          font-weight: 850;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          flex: none;
          border-radius: 50%;
          background: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79,70,229,.08);
        }

        .notification-time {
          flex: none;
          color: #a0a1aa;
          font-size: 14px;
          white-space: nowrap;
        }

        .notification-body > p {
          margin: 4px 0 8px;
          color: #777984;
          font-size: 12px;
          line-height: 1.55;
        }

        .notification-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .notification-category {
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          padding: 0 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 850;
        }

        .notification-category.purple {
          color: #4f46e5;
          background: #f0efff;
        }

        .notification-category.blue {
          color: #2563eb;
          background: #eff6ff;
        }

        .notification-category.orange {
          color: #c2410c;
          background: #fff7ed;
        }

        .notification-category.pink {
          color: #be185d;
          background: #fdf2f8;
        }

        .notification-category.slate {
          color: #475569;
          background: #f1f5f9;
        }

        .open-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid #e1dfff;
          border-radius: 8px;
          color: #5b54e8;
          background: #f7f6ff;
          font: inherit;
          font-size: 10px;
          font-weight: 850;
          line-height: 1;
          cursor: pointer;
          transition:
            background .16s ease,
            border-color .16s ease,
            color .16s ease,
            transform .16s ease,
            box-shadow .16s ease;
        }

        .open-link:hover {
          border-color: #cbc6ff;
          color: #4338ca;
          background: #efedff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79,70,229,.10);
        }

        .open-link:active {
          transform: translateY(0);
        }

        .open-link:focus-visible {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.14);
        }

        .open-link svg {
          font-size: 10px;
        }

        .delete-button {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          flex: none;
          border: 1px solid #eeeef2;
          border-radius: 8px;
          color: #a1a1aa;
          background: #fafafa;
          cursor: pointer;
          transition: .16s ease;
        }

        .delete-button:hover {
          border-color: #fecdd3;
          color: #e11d48;
          background: #fff1f2;
        }

        /* =====================================================
           STATES
        ===================================================== */

        .notification-state {
          min-height: 230px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          border: 1px dashed #e6e6ec;
          border-radius: 15px;
          background: #fcfcfd;
        }

        .notification-state strong {
          margin-top: 10px;
          color: #383941;
          font-size: 14px;
          font-weight: 850;
        }

        .notification-state > span {
          max-width: 390px;
          margin-top: 4px;
          color: #90919a;
          font-size: 11px;
        }

        .notification-state button {
          margin-top: 12px;
          height: 30px;
          padding: 0 12px;
          border: 1px solid #ddd9ff;
          border-radius: 9px;
          color: #4f46e5;
          background: #f6f5ff;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .empty-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid #e7e7ed;
          border-radius: 13px;
          color: #777884;
          background: #f5f5f8;
        }

        .loading-ring {
          width: 28px;
          height: 28px;
          border: 3px solid #e8e7f2;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: notification-spin .8s linear infinite;
        }

        .spin {
          animation: notification-spin .8s linear infinite;
        }

        @keyframes notification-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           SETTINGS MODAL
        ===================================================== */

        .settings-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 16, 28, .45);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          animation: modal-fade-in .18s ease;
        }

        .settings-modal {
          width: min(580px, 100%);
          max-height: min(760px, calc(100vh - 40px));
          overflow: auto;
          border: 1px solid rgba(255,255,255,.7);
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 30px 80px rgba(17,18,38,.20),
            0 8px 30px rgba(17,18,38,.10);
          animation: modal-slide-up .22s cubic-bezier(.2,.8,.2,1);
          scrollbar-width: thin;
        }

        @keyframes modal-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(14px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* =====================================================
           MODAL HEADER
        ===================================================== */

        .settings-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 21px 22px 18px;
          border-bottom: 1px solid #f0f0f4;
        }

        .settings-modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-modal-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          flex: none;
          border: 1px solid #dedcff;
          border-radius: 13px;
          color: #4f46e5;
          background: linear-gradient(
            145deg,
            #f2f1ff,
            #eae9ff
          );
          box-shadow:
            0 7px 18px rgba(79,70,229,.10);
        }

        .settings-modal-title h2 {
          margin: 0;
          color: #202129;
          font-size: 15px;
          font-weight: 850;
          letter-spacing: -.25px;
        }

        .settings-modal-title p {
          margin: 4px 0 0;
          color: #8b8c96;
          font-size: 12px;
        }

        .modal-close-button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex: none;
          border: 1px solid #e8e8ee;
          border-radius: 10px;
          color: #858691;
          background: #fafafa;
          cursor: pointer;
          transition: .16s ease;
        }

        .modal-close-button:hover {
          color: #272832;
          background: #f3f3f6;
        }

        .modal-close-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* =====================================================
           SETTINGS STATUS
        ===================================================== */

        .settings-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 15px 22px;
          padding: 11px 12px;
          border: 1px solid #e9e8f6;
          border-radius: 13px;
          background:
            linear-gradient(
              100deg,
              #fafaff,
              #fff
            );
        }

        .settings-status-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .status-check {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          color: #059669;
          background: #ecfdf5;
        }

        .settings-status-left strong,
        .settings-status-left span {
          display: block;
        }

        .settings-status-left strong {
          color: #363741;
          font-size: 12px;
          font-weight: 850;
        }

        .settings-status-left span {
          margin-top: 2px;
          color: #90919a;
          font-size: 10px;
        }

        .sync-pill {
          padding: 5px 8px;
          border: 1px solid #d8f2e5;
          border-radius: 999px;
          color: #087443;
          background: #effcf6;
          font-size: 10px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .sync-pill.saving {
          color: #4f46e5;
          border-color: #dedcff;
          background: #f5f4ff;
        }

        /* =====================================================
           SETTINGS SECTION
        ===================================================== */

        .settings-section {
          padding: 0 22px;
          margin-bottom: 18px;
        }

        .settings-section-heading {
          margin-bottom: 9px;
        }

        .settings-section-label {
          display: block;
          margin-bottom: 4px;
          color: #8b8c96;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .settings-section-heading h3 {
          margin: 0;
          color: #30313a;
          font-size: 14px;
          font-weight: 850;
        }

        .settings-section-heading p {
          margin: 3px 0 0;
          color: #90919a;
          font-size: 14px;
        }

        .settings-options {
          display: grid;
          gap: 7px;
        }

        .settings-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border: 1px solid #ededf1;
          border-radius: 13px;
          background: #fff;
          transition:
            border-color .17s ease,
            background .17s ease,
            box-shadow .17s ease;
        }

        .settings-option:hover {
          border-color: #deddf0;
          background: #fdfdff;
        }

        .settings-option.enabled {
          border-color: #e4e1fb;
          background: #fcfbff;
        }

        .settings-option-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: none;
          border: 1px solid #e7e7ee;
          border-radius: 11px;
          color: #71727d;
          background: linear-gradient(145deg, #f8f8fa, #f1f1f4);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.85),
            0 3px 9px rgba(20,21,40,.04);
          transition:
            color .18s ease,
            background .18s ease,
            border-color .18s ease,
            transform .18s ease,
            box-shadow .18s ease;
        }

        .settings-option:hover .settings-option-icon {
          transform: translateY(-1px) scale(1.02);
          border-color: #dcdbe8;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.9),
            0 6px 14px rgba(20,21,40,.07);
        }

        .settings-option-icon.active {
          border-color: #dedbff;
          color: #4f46e5;
          background: linear-gradient(145deg, #f2f1ff, #eae9ff);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.9),
            0 5px 13px rgba(79,70,229,.10);
        }

        .settings-option-icon.promotion.active {
          border-color: #ffe0c2;
          color: #ea580c;
          background: linear-gradient(145deg, #fff8f1, #fff0e2);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.9),
            0 5px 13px rgba(234,88,12,.10);
        }

        .settings-option-icon svg {
          font-size: 16px;
        }

        .settings-option-content {
          min-width: 0;
          flex: 1;
        }

        .settings-option-title {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
        }

        .settings-option-title strong {
          color: #30313a;
          font-size: 12px;
          font-weight: 850;
        }

        .settings-option-title span {
          padding: 2px 5px;
          border: 1px solid #d7f2e4;
          border-radius: 999px;
          color: #087443;
          background: #effcf6;
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .settings-option-content p {
          margin: 3px 0 0;
          color: #92939c;
          font-size: 10px;
          line-height: 1.4;
        }

        /* =====================================================
           MODERN SWITCH
        ===================================================== */

        .modern-switch {
          position: relative;
          width: 39px;
          height: 23px;
          flex: none;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #e4e5e9;
          cursor: pointer;
          transition:
            background .2s ease,
            box-shadow .2s ease;
        }

        .modern-switch:hover {
          box-shadow:
            0 0 0 4px rgba(79,70,229,.07);
        }

        .modern-switch.on {
          background: #4f46e5;
          box-shadow:
            0 4px 12px rgba(79,70,229,.20);
        }

        .modern-switch span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #fff;
          box-shadow:
            0 2px 5px rgba(0,0,0,.14);
          transition:
            transform .2s cubic-bezier(.4,0,.2,1);
        }

        .modern-switch.on span {
          transform: translateX(16px);
        }

        .modern-switch:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* =====================================================
           MODAL FOOTER
        ===================================================== */

        .settings-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 15px 22px;
          border-top: 1px solid #f0f0f4;
          background: #fcfcfd;
          border-radius: 0 0 24px 24px;
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #9697a0;
          font-size: 10px;
        }

        .footer-info svg {
          color: #7b7c87;
        }

        .done-button {
          min-width: 65px;
          height: 31px;
          padding: 0 12px;
          border: 0;
          border-radius: 9px;
          color: #fff;
          background: #4f46e5;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          box-shadow:
            0 5px 13px rgba(79,70,229,.20);
          transition: .16s ease;
        }

        .done-button:hover {
          background: #4338ca;
          transform: translateY(-1px);
        }

        .done-button:disabled {
          opacity: .5;
          cursor: not-allowed;
          transform: none;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {
          /* APP-FRIENDLY MOBILE TYPOGRAPHY */
          .notifications-header h1 { font-size: 25px; line-height: 1.2; }
          .notifications-header p { font-size: 13px; line-height: 1.45; }
          .summary-left strong { font-size: 15px; }
          .summary-left span { font-size: 12px; }
          .mark-read-button { min-height: 44px; font-size: 13px; }
          .history-heading h2 { font-size: 20px; }
          .history-heading p { font-size: 13px; line-height: 1.45; }
          .notification-filters button { min-height: 40px; padding: 0 13px; font-size: 12px; }
          .notification-filters button span { min-width: 22px; padding: 3px 6px; font-size: 11px; }
          .notification-card { gap: 12px; padding: 14px; }
          .notification-type-icon { width: 46px; height: 46px; }
          .notification-title h3 { font-size: 16px; line-height: 1.3; }
          .notification-time { font-size: 11px; }
          .notification-body > p { margin: 6px 0 10px; font-size: 14px; line-height: 1.55; }
          .notification-category { min-height: 26px; padding: 0 9px; font-size: 11px; }
          .open-link {
            min-height: 32px;
            padding: 0 9px;
            gap: 6px;
            font-size: 11px;
          }
          .open-link svg { font-size: 10px; }
          .delete-button { width: 36px; height: 36px; }
          .notification-state strong { font-size: 15px; }
          .notification-state > span { font-size: 12px; line-height: 1.5; }
          .notification-state button { min-height: 40px; font-size: 12px; }
          .settings-modal-title h2 { font-size: 19px; }
          .settings-modal-title p { font-size: 12px; }
          .settings-status-left strong { font-size: 12px; }
          .settings-status-left span { font-size: 10px; }
          .settings-section-label { font-size: 10px; }
          .settings-section-heading h3 { font-size: 15px; }
          .settings-section-heading p { font-size: 12px; line-height: 1.45; }
          .settings-option { gap: 12px; padding: 13px; }
          .settings-option-icon { width: 42px; height: 42px; }
          .settings-option-icon svg { font-size: 16px; }
          .settings-option-title strong { font-size: 14px; }
          .settings-option-title span { font-size: 9px; }
          .settings-option-content p { font-size: 12px; line-height: 1.45; }
          .modern-switch { width: 44px; height: 26px; }
          .modern-switch span { width: 20px; height: 20px; }
          .modern-switch.on span { transform: translateX(18px); }
          .footer-info { font-size: 11px; }
          .done-button { min-width: 78px; min-height: 40px; font-size: 13px; }


          .notifications-header {
            align-items: flex-start;
          }

          .notifications-header-left {
            align-items: flex-start;
          }

          .notifications-header-icon {
            width: 43px;
            height: 43px;
          }

          .notifications-header h1 {
            font-size: 22px;
          }

          .notification-settings-button {
            width: 38px;
            padding: 0;
          }

          .notification-settings-button span {
            display: none;
          }

          .notifications-summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .mark-read-button {
            width: 100%;
          }

          .notifications-history {
            padding: 13px;
            border-radius: 17px;
          }

          .notification-card {
            padding: 11px;
          }

          .notification-top {
            flex-direction: column;
            gap: 3px;
          }

          .notification-time {
            order: 2;
          }

          /* Modal becomes bottom sheet */

          .settings-modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .settings-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
            animation: modal-bottom-sheet .22s
              cubic-bezier(.2,.8,.2,1);
          }

          @keyframes modal-bottom-sheet {
            from {
              opacity: 0;
              transform: translateY(30px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .settings-modal-header {
            padding: 18px 16px 15px;
          }

          .settings-status {
            margin: 13px 16px;
          }

          .settings-section {
            padding: 0 16px;
          }

          .settings-modal-footer {
            padding: 13px 16px;
          }

        }

        @media (max-width: 390px) {
          /* COMPACT PHONE READABILITY */
          .notifications-header h1 { font-size: 23px; }
          .notifications-header p { font-size: 12px; }
          .history-heading h2 { font-size: 19px; }
          .history-heading p { font-size: 12px; }
          .notification-title h3 { font-size: 15px; }
          .notification-body > p { font-size: 13px; }
          .settings-modal-title h2 { font-size: 18px; }
          .settings-option-title strong { font-size: 13px; }
          .settings-option-content p { font-size: 11px; }


          .notifications-header {
            gap: 10px;
          }

          .notifications-header-icon {
            width: 39px;
            height: 39px;
          }

          .notifications-header h1 {
            font-size: 20px;
          }

          .notifications-header p {
            font-size: 11px;
          }

          .notification-icon-button {
            width: 35px;
            height: 35px;
          }

          .notification-settings-button {
            width: 35px;
            height: 35px;
          }

          .settings-modal-title h2 {
            font-size: 13px;
          }

          .settings-option {
            padding: 9px;
          }

          .settings-option-icon {
            width: 35px;
            height: 35px;
          }

        }

        /* =====================================================
           ACCESSIBILITY
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .notification-card,
          .notification-icon-button,
          .notification-settings-button,
          .settings-option,
          .modern-switch,
          .modern-switch span,
          .done-button {
            transition: none !important;
          }

          .settings-modal-backdrop,
          .settings-modal {
            animation: none !important;
          }

          .spin,
          .loading-ring {
            animation: none !important;
          }

        }

      `}</style>
    </AccountShell>
  );
}

