// Thin wrapper around the existing Flask API
const BASE = "";  // proxy handles it (see package.json)

export async function fetchAssets() {
  const res = await fetch(`${BASE}/assets`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function assignAsset(payload) {
  const res = await fetch(`${BASE}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Assignment failed");
  return data;
}

export async function returnAsset(assetId) {
  const res = await fetch(`${BASE}/return/${assetId}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Return failed");
  return data;
}

export async function fetchHistory(assetId) {
  const res = await fetch(`${BASE}/asset/${assetId}/history/json`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function fetchActivity() {
  const res = await fetch(`${BASE}/activity/json`);
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

export async function createAsset(payload) {
  const res = await fetch(`${BASE}/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create asset");
  return data;
}

export async function deleteAsset(assetId) {
  const res = await fetch(`${BASE}/assets/${assetId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete asset");
  return data;
}
