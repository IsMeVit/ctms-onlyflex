// Copied from CTMS-Project/lib/api.ts

export interface Movie {
  id: string;
  movie_id: number;
  title: string;
  description: string;
  posterUrl: string;
  poster_url: string;
  duration: number;
  genre: string;
  rating: number;
  createdAt: string;
  created_at: string;
  releaseDate: string;
  endDate: string;
  showtimes: any[];
  showtimes_list?: string[];
  seatConfig: SeatRow[];
  seat_config?: SeatRow[];
}

export interface SeatRow {
  rowId: string;
  row_id?: string;
  label: string;
  price: number;
  seats: number;
}

export const defaultSeatConfig: SeatRow[] = [
  { rowId: "A", label: "VIP", price: 15, seats: 8 },
  { rowId: "B", label: "VIP", price: 15, seats: 8 },
  { rowId: "C", label: "Regular", price: 12, seats: 8 },
  { rowId: "D", label: "Regular", price: 12, seats: 8 },
  { rowId: "E", label: "Regular", price: 12, seats: 8 },
];

export const defaultShowtimes = ["10:00", "14:00", "18:00", "22:00"];

export function transformMovie(dbMovie: any): Movie {
  return {
    id: `movie-${dbMovie.movie_id}`,
    movie_id: dbMovie.movie_id,
    title: dbMovie.title,
    description: dbMovie.description || "",
    posterUrl: dbMovie.poster_url || "",
    poster_url: dbMovie.poster_url || "",
    duration: dbMovie.duration,
    genre: dbMovie.genre,
    rating: Number(dbMovie.rating) || 0,
    createdAt: dbMovie.created_at,
    created_at: dbMovie.created_at,
    releaseDate: dbMovie.release_date ? new Date(dbMovie.release_date).toISOString().split("T")[0] : "",
    endDate: dbMovie.end_date ? new Date(dbMovie.end_date).toISOString().split("T")[0] : "",
    showtimes: [],
    showtimes_list: defaultShowtimes,
    seatConfig: defaultSeatConfig,
    seat_config: defaultSeatConfig,
  };
}

// Stub for getMoviesAPI
export async function getMoviesAPI(): Promise<Movie[]> {
  // TODO: Replace with real API call
  return [];
}

// Stub for getUserBookingsAPI
export async function getUserBookingsAPI(): Promise<any[]> {
  // TODO: Replace with real API call
  return [];
}
