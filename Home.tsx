import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { api, type ListMediaParams, type MediaItem } from "@/api";
import {
  ImageIcon, Film, Play, Sparkles, Heart, Eye,
  TrendingUp, Clock, Star
} from "lucide-react";

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "All",    value: undefined,   icon: Sparkles },
  { label: "Images", value: "image" as const,  icon: ImageIcon },
  { label: "GIFs",   value: "gif" as const,    icon: Play },
  { label: "Videos", value: "video" as const,  icon: Film },
];

const SUBCATEGORIES = [
  { label: "All",      value: undefined },
  { label: "Anime",    value: "anime" as const },
  { label: "Realistic",value: "realistic" as const },
  { label: "Memes",    value: "meme" as const },
  { label: "Other",    value: "other" as const },
];

const SORTS = [
  { label: "Latest",   value: "latest",  icon: Clock },
  { label: "Popular",  value: "popular", icon: TrendingUp },
  { label: "Featured", value: "featured",icon: Star },
];

// ─── Media Card ─────────────────────────────────────────────────────────────
function MediaCard({ item, index }: { item: MediaItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.category === "video" && videoRef.current) {
      hovered
        ? videoRef.current.play().catch(() => {})
        : (videoRef.current.pause(), (videoRef.current.currentTime = 0));
    }
  }, [hovered, item.category]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    try {
      const res = await api.likeMedia(item.id);
      setLikesCount(res.likes);
    } catch {}
  };

  return (
    <div
      className="masonry-item"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link href={`/view/${item.id}`}>
        <div
          className="group relative rounded-2xl overflow-hidden cursor-pointer border border-border/40
                     hover:border-accent/40 transition-all duration-300
                     hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Sponsored badge */}
          {item.is_sponsored && (
            <div className="absolute top-2 left-2 z-20 bg-accent-2/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {item.sponsored_label || "Sponsored"}
            </div>
          )}

          {/* Premium badge */}
          {item.is_premium && (
            <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              ⭐ Premium
            </div>
          )}

          {/* Media */}
          {item.category === "video" ? (
            <video
              ref={videoRef}
              src={item.url}
              muted loop playsInline preload="metadata"
              className="w-full object-cover"
            />
          ) : (
            <img
              src={item.url}
              alt={item.title}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Category badge */}
          <div className="absolute top-2 right-2 z-10">
            {item.category === "video" && !item.is_premium && (
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Film className="w-3 h-3" /> VID
              </span>
            )}
            {item.category === "gif" && (
              <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                GIF
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <p className="text-white font-semibold text-sm line-clamp-2 mb-2 font-display">
              {item.title}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] bg-accent/30 text-accent border border-accent/30 px-2 py-0.5 rounded-full capitalize">
                  {item.subcategory}
                </span>
                {item.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] text-white/60 border border-white/20 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views}</span>
              </div>
            </div>
          </div>

          {/* Like button */}
          <button
            onClick={handleLike}
            className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all
                       bg-black/60 hover:bg-accent/80 rounded-full p-1.5 flex items-center gap-1"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "text-red-400 fill-red-400" : "text-white"}`} />
            <span className="text-white text-xs">{likesCount}</span>
          </button>
        </div>
      </Link>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard({ height }: { height: number }) {
  return (
    <div className="masonry-item">
      <div className="skeleton rounded-2xl" style={{ height }} />
    </div>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<"image"|"gif"|"video"|undefined>(undefined);
  const [subcategory, setSubcategory] = useState<"anime"|"realistic"|"meme"|"other"|undefined>(undefined);
  const [activeTag, setActiveTag] = useState<string|undefined>(undefined);
  const [search, setSearch] = useState<string|undefined>(undefined);

  // Sync tag from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag") || undefined;
    const s = params.get("search") || undefined;
    setActiveTag(tag);
    setSearch(s);
  }, []);

  const params: ListMediaParams = {};
  if (category) params.category = category;
  if (subcategory) params.subcategory = subcategory;
  if (activeTag) params.tag = activeTag;
  if (search) params.search = search;

  const { data: items, isLoading } = useQuery({
    queryKey: ["media", params],
    queryFn: () => api.listMedia(params),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: api.getTags,
  });

  const handleSearch = useCallback((q: string) => {
    setSearch(q || undefined);
  }, []);

  const clearTag = () => {
    setActiveTag(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("tag");
    window.history.pushState({}, "", url.toString());
  };

  const selectTag = (tag: string) => {
    setActiveTag(tag);
    const url = new URL(window.location.href);
    url.searchParams.set("tag", tag);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <Layout onSearch={handleSearch} searchValue={search || ""}>
      <div className="space-y-5">

        {/* Stats bar */}
        {stats && (
          <div className="flex items-center gap-4 text-sm animate-fade-up">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-display font-bold gradient-text">{stats.total}</span>
              <span className="text-subtle">items</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="flex gap-3 text-subtle text-xs">
              <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3 text-accent" />{stats.byCategory.image} images</span>
              <span className="flex items-center gap-1"><Play className="w-3 h-3 text-accent-2" />{stats.byCategory.gif} GIFs</span>
              <span className="flex items-center gap-1"><Film className="w-3 h-3 text-accent" />{stats.byCategory.video} videos</span>
            </div>
            {stats.pending > 0 && (
              <Link href="/admin">
                <span className="ml-auto text-xs bg-accent-2/20 text-accent-2 border border-accent-2/30 px-2 py-0.5 rounded-full cursor-pointer hover:bg-accent-2/30 transition-colors">
                  {stats.pending} pending review
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${isActive
                      ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-lg shadow-accent/30"
                      : "bg-surface border border-border text-subtle hover:text-white hover:border-accent/40"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}

            <div className="w-px bg-border self-stretch mx-1" />

            {SUBCATEGORIES.map((sub) => {
              const isActive = subcategory === sub.value;
              return (
                <button
                  key={sub.label}
                  onClick={() => setSubcategory(sub.value)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all
                    ${isActive
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-surface border border-border text-subtle hover:text-white hover:border-border"
                    }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tag filter */}
        {activeTag && (
          <div className="flex items-center gap-2 animate-fade-up">
            <span className="text-xs text-subtle">Tag:</span>
            <span className="flex items-center gap-1.5 bg-accent/20 text-accent border border-accent/30 text-xs px-3 py-1 rounded-full">
              #{activeTag}
              <button onClick={clearTag} className="hover:text-accent-2 transition-colors ml-0.5">×</button>
            </span>
          </div>
        )}

        {/* Tag cloud */}
        {tags && tags.length > 0 && (
          <div className="flex gap-2 flex-wrap animate-fade-up" style={{ animationDelay: "80ms" }}>
            {tags.slice(0, 15).map((t) => (
              <button
                key={t.tag}
                onClick={() => selectTag(t.tag)}
                className={`text-xs px-3 py-1 rounded-full transition-all border
                  ${activeTag === t.tag
                    ? "bg-accent/20 text-accent border-accent/40"
                    : "bg-surface border-border text-subtle hover:text-white hover:border-accent/30"
                  }`}
              >
                #{t.tag}
                <span className="ml-1 opacity-50">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} height={180 + (i % 4) * 80} />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="masonry-grid">
            {items.map((item, i) => (
              <MediaCard key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-accent/40" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2">Nothing here yet</h2>
            <p className="text-subtle text-sm mb-6 max-w-xs">
              {search || activeTag || category
                ? "Try changing your filters or search query"
                : "Be the first to upload something amazing!"}
            </p>
            <Link href="/upload">
              <button className="bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all hover:shadow-lg hover:shadow-accent/30">
                Upload Now
              </button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
