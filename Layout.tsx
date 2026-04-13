import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Upload, Search, Zap, Menu, X } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (q: string) => void;
  searchValue?: string;
}

export function Layout({ children, onSearch, searchValue = "" }: LayoutProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput);
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-2/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center animate-pulse-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text tracking-tight">
                GifVault
              </span>
            </div>
          </Link>

          {/* Search bar */}
          {location === "/" && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden sm:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search GIFs, videos, images..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-surface border border-border rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>
            </form>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/upload">
              <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-all hover:shadow-lg hover:shadow-accent/30">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </Link>
            <Link href="/admin">
              <button className="hidden sm:flex items-center gap-1.5 text-subtle hover:text-white text-xs px-3 py-2 rounded-full border border-border hover:border-accent/40 transition-all">
                Admin
              </button>
            </Link>
            <button
              className="sm:hidden p-2 text-subtle hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden glass border-t border-border/50 px-4 py-3 flex flex-col gap-3">
            {location === "/" && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-surface border border-border rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60"
                  />
                </div>
              </form>
            )}
            <Link href="/upload" onClick={() => setMenuOpen(false)}>
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold px-4 py-2.5 rounded-full">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            </Link>
            <Link href="/admin" onClick={() => setMenuOpen(false)}>
              <button className="w-full text-subtle text-sm py-2">Admin Panel</button>
            </Link>
          </div>
        )}
      </header>

      {/* Ad banner placeholder */}
      <div className="max-w-7xl mx-auto px-4 pt-3">
        <div className="w-full h-[60px] rounded-xl border border-dashed border-border/50 flex items-center justify-center text-xs text-muted/50 bg-surface/30">
          📢 Advertisement — Google AdSense Banner (728×90)
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="font-display font-semibold text-subtle">GifVault</span>
            <span>· Free GIFs, Images & Videos</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://t.me/" target="_blank" rel="noopener" className="hover:text-accent transition-colors">Telegram</a>
            <a href="https://youtube.com/" target="_blank" rel="noopener" className="hover:text-accent-2 transition-colors">YouTube</a>
            <a href="https://instagram.com/" target="_blank" rel="noopener" className="hover:text-accent transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
