export interface NowShowingMovie {
  id: string;
  title: string;
  genre: string;
  rating: number;
  duration: string;
  image: string;
  showtimes: string[];
  description: string;
  certification: string;
  language: string;
  releaseDate: string;
  director: string;
  cast: string[];
}

export const nowShowingMovies: NowShowingMovie[] = [
  {
    id: "far-away-close-to-you",
    title: "Far Away Close To You",
    genre: "Action / Thriller",
    rating: 8.7,
    duration: "2h 15min",
    image: "https://www.khmertimeskh.com/wp-content/uploads/2026/02/116960.jpg",
    showtimes: ["2:00 PM", "5:30 PM", "9:00 PM"],
    description:
      "A relentless chase pulls two strangers across a city on edge, forcing them to choose between survival and trust.",
    certification: "PG-13",
    language: "English",
    releaseDate: "February 14, 2026",
    director: "K. Somnang",
    cast: ["Dara Visal", "Malis Sokha", "Rin Chenda"],
  },
  {
    id: "nebula-chronicles",
    title: "Nebula Chronicles",
    genre: "Sci-Fi / Adventure",
    rating: 8.9,
    duration: "2h 30min",
    image:
      "https://images.unsplash.com/photo-1655006852875-7912caa28e8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBzcGFjZSUyMG1vdmllfGVufDF8fHx8MTc3MDM0OTgxMHww&ixlib=rb-4.1.0&q=80&w=1080",
    showtimes: ["1:30 PM", "6:00 PM", "10:00 PM"],
    description:
      "A fractured crew races through deep space to recover a vanished signal that may rewrite the future of humanity.",
    certification: "PG",
    language: "English",
    releaseDate: "March 1, 2026",
    director: "Ariana Wells",
    cast: ["Jace Rowan", "Mina Vale", "Theo Grant"],
  },
  {
    id: "midnight-whispers",
    title: "Midnight Whispers",
    genre: "Horror / Mystery",
    rating: 7.8,
    duration: "1h 55min",
    image:
      "https://images.unsplash.com/photo-1563905463861-7d77975b3a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aHJpbGxlciUyMHN1c3BlbnNlJTIwZGFya3xlbnwxfHx8fDE3NzAyOTY1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    showtimes: ["4:00 PM", "7:30 PM", "10:45 PM"],
    description:
      "When a missing-person case leads into an abandoned estate, a journalist uncovers a pattern no one survived long enough to explain.",
    certification: "R",
    language: "English",
    releaseDate: "January 30, 2026",
    director: "Lena Hart",
    cast: ["Ivy Cole", "Marcus Finn", "Noah Price"],
  },
  {
    id: "enchanted-dreams",
    title: "Enchanted Dreams",
    genre: "Fantasy / Animation",
    rating: 8.3,
    duration: "1h 45min",
    image:
      "https://images.unsplash.com/photo-1769008301392-3567c972c437?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYXRlZCUyMGZhbnRhc3klMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzAzODMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    showtimes: ["12:00 PM", "3:30 PM", "6:30 PM"],
    description:
      "A young dream-weaver enters a painted kingdom where forgotten wishes can either heal a world or break it forever.",
    certification: "G",
    language: "English",
    releaseDate: "February 22, 2026",
    director: "Emi Laurent",
    cast: ["Piper Lane", "Jonah Bloom", "Sara Vale"],
  },
];

export function getNowShowingMovieById(id: string) {
  return nowShowingMovies.find((movie) => movie.id === id);
}
