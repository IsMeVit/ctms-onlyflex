"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Star, 
  Globe, 
  Type, 
  AlignLeft, 
  Link as LinkIcon 
} from "lucide-react";

// --- Types ---
interface Genre {
  id: string;
  name: string;
}

interface MovieFormData {
  title: string;
  slug: string;
  description: string;
  releaseDate: string;
  duration: string;
  rating: string;
  posterUrl: string;
  backdropUrl: string;
  language: string;
  status: string;
  genreIds: string[];
}

interface MovieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MovieFormData) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  movie?: any | null; 
  isLoading: boolean;
}

// --- Constants ---
const initialFormData: MovieFormData = {
  title: "",
  slug: "",
  description: "",
  releaseDate: "",
  duration: "",
  rating: "",
  posterUrl: "",
  backdropUrl: "",
  language: "en",
  status: "RELEASED",
  genreIds: [],
};

const movieStatuses = [
  { value: "ANNOUNCED", label: "Announced" },
  { value: "POST_PRODUCTION", label: "Post Production" },
  { value: "RELEASED", label: "Released" },
  { value: "CANCELLED", label: "Cancelled" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "vi", label: "Vietnamese" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MovieForm({ isOpen, onClose, onSubmit, movie, isLoading }: MovieFormProps) {
  const [formData, setFormData] = useState<MovieFormData>(initialFormData);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");
  const [genreSearch, setGenreSearch] = useState("");
  
  // Image Upload Toggles
  const [uploadType, setUploadType] = useState<{poster: 'local' | 'link', backdrop: 'local' | 'link'}>({
    poster: 'link',
    backdrop: 'link'
  });
  const [uploading, setUploading] = useState({ poster: false, backdrop: false });

  // Genre Dropdown State
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  const fetchGenres = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/genres");
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (err) {
      console.error("Genre fetch error:", err);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (!isOpen) return;
    fetchGenres();
    
    if (movie) {
      setFormData({
        title: movie.title || "",
        slug: movie.slug || "",
        description: movie.description || "",
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split("T")[0] : "",
        duration: movie.duration?.toString() || "",
        rating: movie.rating?.toString() || "",
        posterUrl: movie.posterUrl || "",
        backdropUrl: movie.backdropUrl || "",
        language: movie.language || "en",
        status: movie.status || "RELEASED",
        genreIds: movie.genres?.map((g: Genre) => g.id) || [],
      });
    } else {
      setFormData(initialFormData);
    }
  }, [movie, isOpen, fetchGenres]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "title" && !movie) next.slug = generateSlug(value);
      return next;
    });
  };

  const handleFileUpload = async (file: File, type: "poster" | "backdrop") => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const resData = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, [type === "poster" ? "posterUrl" : "backdropUrl"]: resData.url }));
      } else {
        setError(resData.error || "Upload failed");
      }
    } catch {
      setError("Server error during upload");
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const toggleGenre = (id: string) => {
    setFormData(prev => ({
      ...prev,
      genreIds: prev.genreIds.includes(id)
        ? prev.genreIds.filter(gid => gid !== id)
        : [...prev.genreIds, id]
    }));
  };

  const filteredGenres = useMemo(() => 
    genres.filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase())), 
    [genres, genreSearch]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{movie ? "Edit Movie Entry" : "Create New Movie"}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fill in the details below to update the catalog.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-lg">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" /> Movie Title
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g. Interstellar" 
                    className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" /> URL Slug
                  </label>
                  <input 
                    type="text" 
                    name="slug" 
                    disabled={!!movie} 
                    value={formData.slug} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 italic cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Description / Synopsis
                </label>
                <textarea 
                  name="description" 
                  rows={4} 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600" 
                  placeholder="Write a short summary..." 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Release
                  </label>
                  <input 
                    type="date" 
                    name="releaseDate" 
                    value={formData.releaseDate} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-red-500 outline-none dark:[color-scheme:dark]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Mins
                  </label>
                  <input 
                    type="number" 
                    name="duration" 
                    value={formData.duration} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-red-500 outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Rating
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="rating" 
                    value={formData.rating} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-red-500 outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language
                  </label>
                  <select 
                    name="language" 
                    value={formData.language} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-red-500 outline-none dark:bg-[#09090b]"
                  >
                    {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Categories & Status */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:border-red-500 outline-none dark:bg-[#09090b]"
                >
                  {movieStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="relative" ref={genreDropdownRef}>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 block">Genres</label>
                <div 
                  onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                  className="min-h-32 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent cursor-pointer hover:border-red-400 dark:hover:border-red-500/50 transition-all flex flex-wrap gap-2 content-start"
                >
                  {formData.genreIds.length === 0 ? (
                    <span className="text-zinc-400 dark:text-zinc-600 text-sm p-1 italic">Click to select genres...</span>
                  ) : (
                    formData.genreIds.map(id => (
                      <span key={id} className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5">
                        {genres.find(g => g.id === id)?.name}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleGenre(id); }} className="hover:text-red-800 dark:hover:text-red-200 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {isGenreDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-150">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Search genres..." 
                        className="w-full px-3 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-red-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                      {filteredGenres.map(g => (
                        <div 
                          key={g.id} 
                          onClick={() => toggleGenre(g.id)}
                          className={`px-4 py-2.5 text-sm cursor-pointer rounded-lg mb-0.5 flex justify-between items-center transition-colors ${
                            formData.genreIds.includes(g.id) 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium' 
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {g.name}
                          {formData.genreIds.includes(g.id) && <span className="text-red-600 dark:text-red-400">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Media Section: Posters & Backdrops */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {['poster', 'backdrop'].map((type) => (
              <div key={type} className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> {type} Media
                  </label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    {['local', 'link'].map((m) => (
                      <button 
                        key={m}
                        type="button" 
                        onClick={() => setUploadType(p => ({...p, [type]: m}))}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                          uploadType[type as 'poster' | 'backdrop'] === m 
                            ? 'bg-white dark:bg-[#09090b] text-red-600 dark:text-red-400 shadow-sm' 
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {uploadType[type as 'poster' | 'backdrop'] === 'local' ? (
                  <div className="relative h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col items-center justify-center overflow-hidden group hover:border-red-300 dark:hover:border-red-500/30 transition-all">
                    {formData[`${type}Url` as keyof MovieFormData] ? (
                      <>
                        <Image src={formData[`${type}Url` as keyof MovieFormData] as string} alt="Preview" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button type="button" onClick={() => setFormData(p => ({...p, [`${type}Url`]: ""}))} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">Remove</button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">Upload {type}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">JPG, PNG or WebP (Max 5MB)</span>
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], type as 'poster' | 'backdrop')} />
                      </label>
                    )}
                    {uploading[type as 'poster' | 'backdrop'] && <div className="absolute inset-0 bg-white/90 dark:bg-black/80 flex items-center justify-center font-bold text-red-600 animate-pulse">Uploading...</div>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      name={`${type}Url`} 
                      placeholder="Paste external image URL here..." 
                      value={formData[`${type}Url` as keyof MovieFormData] as string} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:border-red-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600" 
                    />
                    {formData[`${type}Url` as keyof MovieFormData] && (
                      <div className="relative h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                         <Image src={formData[`${type}Url` as keyof MovieFormData] as string} alt="URL Preview" fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form Footer Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800 items-center">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Discard Changes</button>
             <button 
              type="submit" 
              disabled={isLoading || uploading.poster || uploading.backdrop} 
              className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              {isLoading ? "Processsing..." : movie ? "Update Movie" : "Save Movie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
