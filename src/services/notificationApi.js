const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () => localStorage.getItem("token");

const request = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const getNotifications = (limit = 8) =>
  request(`/api/notifications?limit=${limit}`);

export const getUnreadNotificationCount = () =>
  request("/api/notifications/unread-count");

export const markNotificationAsRead = (id) =>
  request(`/api/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsAsRead = () =>
  request("/api/notifications/read-all", { method: "PATCH" });

export const deleteNotification = (id) =>
  request(`/api/notifications/${id}`, { method: "DELETE" });

export const updateNotificationSettings = (settings) =>
  request("/api/notifications/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
