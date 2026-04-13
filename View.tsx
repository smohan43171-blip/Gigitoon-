import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ArrowLeft, Trash2, Heart, Eye, Calendar, Film, ImageIcon, Tag, Share2 } from "lucide-react";

export default function ViewPage() {
  const params = useParams<{id: string}>();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMedia(id),
    enabled: !!id,
  });

  const handleLike = async () => {
    if (liked || !item) return;
    setLiked(true);
    const res = await api.likeMedia(item.id);
    setLikesCount(res.likes);
  };

  const handleDelete = async () => {
    if (!item || !confirm("Delete this item?")) return;
    setDeleting(true);
    try {
      await api.deleteMedia(item.id);
      qc.invalidateQueries({queryKey:["media"]});
      qc.invalidateQueries({queryKey:["stats"]});
      setLocation("/");
    } catch { setDeleting(false); }
  };

  const handleTagClick = (tag: string) => {
    const url = new URL(window.location.origin);
    url.searchParams.set("tag", tag);
    setLocation(`/?tag=${encodeURIComponent(tag)}`);
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-up">
        <div className="skeleton h-8 w-40 rounded-xl" />
        <div className="skeleton h-[500px] w-full rounded-2xl" />
        <div className="skeleton h-6 w-60 rounded-xl" />
      </div>
    </Layout>
  );

  if (!item) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted" />
        </div>
        <h2 className="text-xl font-display font-semibold mb-2">Not found</h2>
        <p className="text-subtle text-sm mb-6">This item may have been removed.</p>
        <Link href="/"><button className="bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold px-6 py-3 rounded-full">Back to Gallery</button></Link>
      </div>
    </Layout>
  );

  const date = new Date(item.created_at).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"});
  const currentLikes = likesCount ?? item.likes;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-subtle hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to gallery
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="flex items-center gap-1.5 bg-surface border border-border text-subtle hover:text-white text-xs px-3 py-2 rounded-full transition-all">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-3 py-2 rounded-full transition-all disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-black flex items-center justify-center min-h-[300px] max-h-[70vh]">
            {item.category === "video" ? (
              <video src={item.url} controls autoPlay muted loop playsInline className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <img src={item.url} alt={item.title} className="max-w-full max-h-[70vh] object-contain" />
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">{item.title}</h1>
                {item.description && <p className="text-subtle leading-relaxed">{item.description}</p>}
              </div>
              <button onClick={handleLike} disabled={liked}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shrink-0 ${liked ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-surface border-border text-subtle hover:text-red-400 hover:border-red-500/30"}`}>
                <Heart className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`} />
                <span className="text-sm font-medium">{currentLikes}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 text-xs px-3 py-1.5 rounded-full capitalize">
                {item.category === "video" ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                {item.category}
              </span>
              <span className="bg-surface border border-border text-subtle text-xs px-3 py-1.5 rounded-full capitalize">{item.subcategory}</span>
              <span className="flex items-center gap-1.5 bg-surface border border-border text-subtle text-xs px-3 py-1.5 rounded-full">
                <Eye className="w-3 h-3" />{item.views} views
              </span>
              <span className="flex items-center gap-1.5 bg-surface border border-border text-subtle text-xs px-3 py-1.5 rounded-full">
                <Calendar className="w-3 h-3" />{date}
              </span>
              {item.is_premium && <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-3 py-1.5 rounded-full">⭐ Premium</span>}
            </div>

            {item.tags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-subtle"><Tag className="w-3.5 h-3.5" /> Tags</div>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <button key={tag} onClick={() => handleTagClick(tag)}
                      className="bg-surface border border-border text-subtle hover:text-accent hover:border-accent/30 text-xs px-3 py-1.5 rounded-full transition-all">
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
