const BASE = "";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("am_access_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(url, options = {}) {
  const res  = await fetch(`${BASE}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const fetchAssets = () =>
  request("/assets", { headers: authHeaders() });

export const fetchUsers = () =>
  request("/users", { headers: authHeaders() });

export const assignAsset = (payload) =>
  request("/assign", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const transferAsset = (assetId, payload) =>
  request(`/transfer/${assetId}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const returnAsset = (assetId) =>
  request(`/return/${assetId}`, {
    method: "POST",
    headers: authHeaders(),
  });

export const fetchHistory = (assetId) =>
  request(`/asset/${assetId}/history/json`, { headers: authHeaders() });

export const fetchActivity = () =>
  request("/activity/json", { headers: authHeaders() });

export const createAsset = (payload) =>
  request("/assets", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const bulkAddUnits = (payload) =>
  request("/assets/bulk", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const updateAsset = (assetId, payload) =>
  request(`/assets/${assetId}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const deleteAsset = (assetId) =>
  request(`/assets/${assetId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

export const fetchAllUsers = () =>
  request("/auth/users", { headers: authHeaders() });

export const createUser = (payload) =>
  request("/auth/users", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const deleteUser = (userId) =>
  request(`/auth/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

export const getProfile = () =>
  request("/auth/profile", { headers: authHeaders() });

export const updateProfile = (payload) =>
  request("/auth/profile", {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

// ── Asset Requests ────────────────────────────────────────────────────────────

export const fetchMyRequests = () =>
  request("/requests", { headers: authHeaders() });

export const fetchOpenRequests = () =>
  request("/requests/open", { headers: authHeaders() });

export const createRequest = (payload) =>
  request("/requests", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const actionRequest = (reqId, payload) =>
  request(`/requests/${reqId}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

export const cancelRequest = (reqId) =>
  request(`/requests/${reqId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
