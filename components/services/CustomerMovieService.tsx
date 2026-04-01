import useSWR from "swr";
import apiService from "./apiService/apiService";
import { getNowShowingMovieById } from "@/lib/now-showing-movies";

const path = "/api/admin/movies/";

type FetchAllParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
};

type AdminMovie = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  releaseDate?: string | null;
  duration?: number | null;
  rating?: number | string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  language?: string | null;
  status?: string | null;
  genres?: Array<{ id: string; name: string }>;
  showtimes?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    basePrice?: number | string | null;
    status?: string | null;
    hall: {
      id: string;
      name: string;
      hallType?: string | null;
      capacity?: number | null;
      _count?: {
        seats?: number;
      };
    };
    _count?: {
      tickets?: number;
    };
  }>;
  _count?: {
    showtimes?: number;
  };
};

export type CustomerMovieShowtime = {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  screen: string;
  type: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  price: number | null;
};

export type CustomerMovie = {
  id: string;
  title: string;
  genre: string;
  genres: string[];
  rating: number;
  duration: string;
  durationMinutes: number;
  image: string;
  posterUrl: string;
  backdropUrl: string;
  showtimes: string[];
  description: string;
  certification: string;
  language: string;
  releaseDate: string;
  director: string;
  cast: string[];
  slug: string;
  status: string;
  showtimeCount: number;
  showtimeDetails: CustomerMovieShowtime[];
};

function formatDuration(duration?: number | null) {
  if (!duration || duration <= 0) {
    return "TBA";
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (!hours) {
    return `${minutes}min`;
  }

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function formatReleaseDate(date?: string | null) {
  if (!date) {
    return "Coming Soon";
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShowtimeTime(date?: string | null) {
  if (!date) {
    return "TBA";
  }

  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function parsePrice(price?: number | string | null) {
  if (typeof price === "number") {
    return price;
  }

  if (typeof price === "string") {
    const parsed = Number(price);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function normalizeMovie(movie: AdminMovie): CustomerMovie {
  const staticMovie = getNowShowingMovieById(movie.id);
  const genres = movie.genres?.map((genre) => genre.name) ?? [];
  const showtimeDetails = (movie.showtimes ?? []).map((showtime) => {
    const totalSeats = showtime.hall._count?.seats ?? showtime.hall.capacity ?? 0;
    const bookedSeats = showtime._count?.tickets ?? 0;

    return {
      id: showtime.id,
      time: formatShowtimeTime(showtime.startTime),
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      screen: showtime.hall.name,
      type:
        showtime.hall.hallType === "VIP"
          ? "VIP"
          : showtime.hall.hallType === "STANDARD"
            ? "Standard"
            : showtime.hall.hallType || "Standard",
      totalSeats,
      bookedSeats,
      availableSeats: Math.max(totalSeats - bookedSeats, 0),
      price: parsePrice(showtime.basePrice),
    };
  });

  return {
    id: movie.id,
    title: movie.title,
    genre: genres.join(" / ") || staticMovie?.genre || "Uncategorized",
    genres,
    rating:
      typeof movie.rating === "number"
        ? movie.rating
        : typeof movie.rating === "string"
          ? Number(movie.rating)
          : staticMovie?.rating || 0,
    duration: formatDuration(movie.duration),
    durationMinutes: movie.duration || 0,
    image: movie.posterUrl || movie.backdropUrl || staticMovie?.image || "",
    posterUrl: movie.posterUrl || staticMovie?.image || "",
    backdropUrl: movie.backdropUrl || movie.posterUrl || staticMovie?.image || "",
    showtimes:
      showtimeDetails.length > 0
        ? showtimeDetails.map((showtime) => showtime.time)
        : staticMovie?.showtimes || [],
    description: movie.description || staticMovie?.description || "No description available.",
    certification: staticMovie?.certification || "NR",
    language: movie.language || staticMovie?.language || "English",
    releaseDate: formatReleaseDate(movie.releaseDate),
    director: staticMovie?.director || "TBA",
    cast: staticMovie?.cast || [],
    slug: movie.slug,
    status: movie.status || "RELEASED",
    showtimeCount: movie._count?.showtimes || 0,
    showtimeDetails,
  };
}

async function fetchMovieList(url: string) {
  const response = await apiService(url, { method: "GET" });

  if (!response.success) {
    throw new Error(response.errors?.error || response.errors?.message || "Failed to fetch movies");
  }

  return {
    ...response.data,
    movies: (response.data.movies || []).map(normalizeMovie),
  };
}

async function fetchMovie(url: string) {
  const response = await apiService(url, { method: "GET" });

  if (!response.success) {
    throw new Error(response.errors?.error || response.errors?.message || "Failed to fetch movie");
  }

  return normalizeMovie(response.data as AdminMovie);
}

const CustomerMovieService = {
  FetchAll: (params: FetchAllParams = {}) => {
    const query: string[] = [];

    if (params.page) query.push(`page=${params.page}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.search) query.push(`search=${encodeURIComponent(params.search)}`);
    if (params.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params.sortBy) query.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.sortOrder) query.push(`sortOrder=${encodeURIComponent(params.sortOrder)}`);

    const url = path + (query.length ? `?${query.join("&")}` : "");
    return useSWR(url, fetchMovieList);
  },

  FetchById: (id?: string) => {
    return useSWR(id ? `${path}${id}` : null, fetchMovie);
  },

  fetchOne: async (id: string) => {
    return fetchMovie(`${path}${id}`);
  },
};

export default CustomerMovieService;
