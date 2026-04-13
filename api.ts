const BASE = import.meta.env.VITE_API_URL || "";

export interface MediaItem {
  id: number;
  title: string;
  description: string;
  url: string;
  category: "image" | "gif" | "video";
  subcategory: "anime" | "realistic" | "meme" | "other";
  status: "pending" | "approved" | "rejected";
  is_premium: boolean;
  is_sponsored: boolean;
  sponsored_label: string | null;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
}

export interface MediaStats {
  total: number;
  byCategory: { image: number; gif: number; video: number };
  pending: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ListMediaParams {
  category?: "image" | "gif" | "video";
  subcategory?: "anime" | "realistic" | "meme" | "other";
  tag?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  listMedia: (params: ListMediaParams = {}): Promise<MediaItem[]> => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.subcategory) q.set("subcategory", params.subcategory);
    if (params.tag) q.set("tag", params.tag);
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.offset) q.set("offset", String(params.offset));
    const qs = q.toString();
    return req(`/api/media${qs ? `?${qs}` : ""}`);
  },

  getMedia: (id: number): Promise<MediaItem> =>
    req(`/api/media/${id}`),

  createMedia: (formData: FormData): Promise<MediaItem> =>
    req("/api/media", { method: "POST", body: formData }),

  deleteMedia: (id: number): Promise<{ success: boolean }> =>
    req(`/api/media/${id}`, { method: "DELETE" }),

  likeMedia: (id: number): Promise<{ likes: number }> =>
    req(`/api/media/${id}/like`, { method: "POST" }),

  getTags: (): Promise<TagCount[]> =>
    req("/api/tags"),

  getStats: (): Promise<MediaStats> =>
    req("/api/stats"),

  // Admin
  adminListMedia: (status = "pending"): Promise<MediaItem[]> =>
    req(`/api/admin/media?status=${status}`),

  approveMedia: (id: number): Promise<{ success: boolean }> =>
    req(`/api/admin/media/${id}/approve`, { method: "POST" }),

  rejectMedia: (id: number): Promise<{ success: boolean }> =>
    req(`/api/admin/media/${id}/reject`, { method: "POST" }),

  sponsorMedia: (id: number, label: string): Promise<{ success: boolean }> =>
    req(`/api/admin/media/${id}/sponsor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }),
};
