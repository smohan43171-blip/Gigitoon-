import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type MediaItem } from "@/api";
import { CheckCircle, XCircle, Star, Eye, BarChart2, Clock, ImageIcon, Film, Play } from "lucide-react";

type Tab = "pending" | "approved" | "rejected";

function AdminCard({ item, onApprove, onReject, onSponsor, showActions }: {
  item: MediaItem;
  onApprove?: () => void;
  onReject?: () => void;
  onSponsor?: () => void;
  showActions: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
        {item.category === "video"
          ? <video src={item.url} muted playsInline className="max-h-full max-w-full object-contain" />
          : <img src={item.url} alt={item.title} className="max-h-full max-w-full object-contain" />}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
            item.category === "video" ? "bg-accent/10 text-accent" :
            item.category === "gif" ? "bg-accent-2/10 text-accent-2" : "bg-green-500/10 text-green-400"
          }`}>
            {item.category.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{item.views}</span>
          <span className="capitalize">{item.subcategory}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0,3).map(t => <span key={t} className="text-[10px] bg-surface border border-border text-subtle px-2 py-0.5 rounded-full">#{t}</span>)}
          </div>
        )}
        {showActions && (
          <div className="flex gap-2 pt-1">
            <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs py-1.5 rounded-lg transition-all">
              <CheckCircle className="w-3.5 h-3.5"/> Approve
            </button>
            <button onClick={onReject} className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs py-1.5 rounded-lg transition-all">
              <XCircle className="w-3.5 h-3.5"/> Reject
            </button>
          </div>
        )}
        {!showActions && (
          <div className="flex gap-2 pt-1">
            <Link href={`/view/${item.id}`} className="flex-1">
              <button className="w-full flex items-center justify-center gap-1 bg-surface hover:bg-card border border-border text-subtle text-xs py-1.5 rounded-lg transition-all">
                <Eye className="w-3.5 h-3.5"/> View
              </button>
            </Link>
            <button onClick={onSponsor} className="flex-1 flex items-center justify-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 text-xs py-1.5 rounded-lg transition-all">
              <Star className="w-3.5 h-3.5"/> Sponsor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-media", tab],
    queryFn: () => api.adminListMedia(tab),
  });

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.getStats });

  const approve = async (id: number) => {
    await api.approveMedia(id);
    qc.invalidateQueries({queryKey:["admin-media"]});
    qc.invalidateQueries({queryKey:["stats"]});
    qc.invalidateQueries({queryKey:["media"]});
  };
  const reject = async (id: number) => {
    await api.rejectMedia(id);
    qc.invalidateQueries({queryKey:["admin-media"]});
    qc.invalidateQueries({queryKey:["stats"]});
  };
  const sponsor = async (id: number) => {
    const label = prompt("Sponsor label:", "Sponsored") || "Sponsored";
    await api.sponsorMedia(id, label);
    qc.invalidateQueries({queryKey:["admin-media"]});
    qc.invalidateQueries({queryKey:["media"]});
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">Admin Panel</h1>
            <p className="text-subtle text-sm mt-1">Review and manage submitted content</p>
          </div>
          <Link href="/">
            <button className="text-subtle hover:text-white text-sm border border-border px-4 py-2 rounded-full transition-colors">
              View Site
            </button>
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              {label:"Total",value:stats.total,icon:<BarChart2 className="w-4 h-4"/>,color:"text-accent"},
              {label:"Pending",value:stats.pending,icon:<Clock className="w-4 h-4"/>,color:"text-yellow-400"},
              {label:"Images",value:stats.byCategory.image,icon:<ImageIcon className="w-4 h-4"/>,color:"text-green-400"},
              {label:"Videos",value:stats.byCategory.video,icon:<Film className="w-4 h-4"/>,color:"text-accent-2"},
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <div className={`${s.color} mb-2`}>{s.icon}</div>
                <div className="text-2xl font-display font-bold text-white">{s.value}</div>
                <div className="text-xs text-subtle">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 w-fit">
          {(["pending","approved","rejected"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab===t ? "bg-gradient-to-r from-accent to-accent-2 text-white" : "text-subtle hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({length:8}).map((_,i) => <div key={i} className="skeleton rounded-xl h-64" />)}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-16 text-subtle">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400/30" />
            <p className="text-sm">No {tab} items</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <AdminCard key={item.id} item={item}
                showActions={tab === "pending"}
                onApprove={() => approve(item.id)}
                onReject={() => reject(item.id)}
                onSponsor={() => sponsor(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
