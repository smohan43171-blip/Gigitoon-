import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { api } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Upload as UploadIcon, Link as LinkIcon, X, Plus, Image as ImgIcon, Film, Play, Eye, CheckCircle, AlertCircle } from "lucide-react";

type UploadMode = "file" | "url";
type Category = "image" | "gif" | "video";
type Subcategory = "anime" | "realistic" | "meme" | "other";

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [mode, setMode] = useState<UploadMode>("url");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("gif");
  const [subcategory, setSubcategory] = useState<Subcategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{type:"success"|"error";msg:string}|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success"|"error", msg: string) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileChange = (f: File) => {
    setFile(f);
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (["mp4","webm","mov"].includes(ext)) setCategory("video");
    else if (ext === "gif") setCategory("gif");
    else setCategory("image");
    setFilePreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g,"-");
    if (t && !tags.includes(t) && tags.length < 10) { setTags([...tags, t]); setTagInput(""); }
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return showToast("error", "Title is required");
    if (mode === "url" && !url.trim()) return showToast("error", "URL is required");
    if (mode === "file" && !file) return showToast("error", "Please select a file");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("category", category);
      fd.append("subcategory", subcategory);
      fd.append("tags", tags.join(","));
      if (mode === "file" && file) fd.append("file", file);
      else fd.append("url", url.trim());
      const item = await api.createMedia(fd);
      qc.invalidateQueries({queryKey:["media"]});
      qc.invalidateQueries({queryKey:["stats"]});
      qc.invalidateQueries({queryKey:["tags"]});
      showToast("success", "Submitted for review!");
      setTimeout(() => setLocation(`/view/${item.id}`), 1200);
    } catch (err: any) {
      showToast("error", err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = mode === "file" ? filePreview : url;
  const isVideo = category === "video";

  return (
    <Layout>
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl toast ${toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      <div className="max-w-2xl mx-auto animate-fade-up">
        <button onClick={() => setLocation("/")} className="text-subtle hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
          <- Back to gallery
        </button>
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">Add Media</h1>
              <p className="text-subtle text-sm">Submitted content goes for admin review</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-surface rounded-xl p-1 gap-1">
              {(["url","file"] as UploadMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === m ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-lg" : "text-subtle hover:text-white"}`}>
                  {m === "url" ? <LinkIcon className="w-3.5 h-3.5" /> : <UploadIcon className="w-3.5 h-3.5" />}
                  {m === "url" ? "Paste URL" : "Upload File"}
                </button>
              ))}
            </div>

            {mode === "url" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Media URL</label>
                <input type="url" placeholder="https://example.com/image.gif" value={url} onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 transition-colors" />
              </div>
            )}

            {mode === "file" && (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-accent/5">
                <input ref={fileInputRef} type="file" accept="image/*,video/*,.gif" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-white font-medium">{file.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(""); }} className="text-muted hover:text-accent-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadIcon className="w-8 h-8 text-muted mx-auto mb-3" />
                    <p className="text-white text-sm font-medium mb-1">Drop file here or click to browse</p>
                    <p className="text-muted text-xs">PNG, JPG, GIF, WEBP, MP4, WEBM up to 100MB</p>
                  </>
                )}
              </div>
            )}

            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-border bg-surface">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <Eye className="w-3.5 h-3.5 text-muted" /><span className="text-xs text-subtle">Preview</span>
                </div>
                <div className="p-3 flex justify-center max-h-64 overflow-hidden">
                  {isVideo ? <video src={previewUrl} muted loop autoPlay playsInline className="max-h-56 rounded-lg object-contain" />
                    : <img src={previewUrl} alt="Preview" className="max-h-56 rounded-lg object-contain" onError={(e) => {(e.target as HTMLImageElement).style.display="none";}} />}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-subtle">Title *</label>
              <input type="text" placeholder="Give it a catchy title..." value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 transition-colors" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-subtle">Description</label>
              <textarea placeholder="Describe your media..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 transition-colors resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Category</label>
                <div className="flex flex-col gap-1.5">
                  {([["image","Image",<ImgIcon className="w-4 h-4"/>],["gif","GIF",<Play className="w-4 h-4"/>],["video","Video",<Film className="w-4 h-4"/>]] as [Category,string,React.ReactNode][]).map(([v,label,icon]) => (
                    <button key={v} type="button" onClick={() => setCategory(v)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${category===v ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface border-border text-subtle hover:text-white"}`}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Style</label>
                <div className="flex flex-col gap-1.5">
                  {(["anime","realistic","meme","other"] as Subcategory[]).map((v) => (
                    <button key={v} type="button" onClick={() => setSubcategory(v)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all border text-left capitalize ${subcategory===v ? "bg-accent-2/20 border-accent-2/40 text-accent-2" : "bg-surface border-border text-subtle hover:text-white"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-subtle">Tags</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Add tags (press Enter)..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey}
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 transition-colors" />
                <button type="button" onClick={addTag} className="bg-surface border border-border text-subtle hover:text-white p-2.5 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-accent/10 text-accent border border-accent/20 text-xs px-3 py-1 rounded-full">
                      #{tag}
                      <button type="button" onClick={() => setTags(tags.filter(t=>t!==tag))} className="hover:text-accent-2 ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-accent to-accent-2 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all hover:shadow-xl hover:shadow-accent/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
