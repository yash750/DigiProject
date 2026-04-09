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

export const deleteAsset = (assetId) =>
  request(`/assets/${assetId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
