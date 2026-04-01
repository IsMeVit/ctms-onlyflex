import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import fs from "fs";
import path from "path";
import vm from "vm";

type StaticMovie = {
  id: string;
  title: string;
  image: string;
  duration: string;
  rating: number;
  genre: string;
  description: string;
  releaseDate: string;
  certification: string;
  language: string;
  director: string;
  cast: string[];
  showtimes: string[];
};

type CatalogMovie = {
  slug: string;
  title: string;
  description: string;
  releaseDate: string;
  durationMinutes: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  language: string;
  status: "RELEASED";
  genres: string[];
  cast: Array<{ name: string; role: "ACTOR" | "DIRECTOR" | "WRITER" | "PRODUCER"; characterName?: string }>;
  showtimes: string[];
  runDays: number;
  preferredHall?: string;
};

const prisma = new PrismaClient();

function extractMoviesFromStaticFile(): StaticMovie[] {
  const filePath = path.join(process.cwd(), "lib", "now-showing-movies.ts");
  const source = fs.readFileSync(filePath, "utf8");
  const match = source.match(
    /export const nowShowingMovies: NowShowingMovie\[\] = (\[[\s\S]*?\]);/
  );

  if (!match) {
    throw new Error("Could not find nowShowingMovies array in lib/now-showing-movies.ts");
  }

  return vm.runInNewContext(`(${match[1]})`) as StaticMovie[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDurationToMinutes(duration: string) {
  const hours = duration.match(/(\d+)h/i);
  const minutes = duration.match(/(\d+)min/i);

  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function buildCatalog(): CatalogMovie[] {
  const staticMovies = extractMoviesFromStaticFile();

  const existingMovies: CatalogMovie[] = staticMovies.map((movie, index) => {
    const genres = movie.genre.split("/").map((genre) => genre.trim());
    const showtimePatterns =
      index % 2 === 0
        ? movie.showtimes
        : [...movie.showtimes, "11:15 AM"];

    return {
      slug: movie.id,
      title: movie.title,
      description: movie.description,
      releaseDate: movie.releaseDate,
      durationMinutes: parseDurationToMinutes(movie.duration),
      rating: movie.rating,
      posterUrl: movie.image,
      backdropUrl: movie.image,
      language: movie.language,
      status: "RELEASED",
      genres,
      cast: [
        { name: movie.director, role: "DIRECTOR" },
        ...movie.cast.slice(0, 3).map((name, castIndex) => ({
          name,
          role: "ACTOR" as const,
          characterName: `Lead ${castIndex + 1}`,
        })),
      ],
      showtimes: showtimePatterns,
      runDays: index % 2 === 0 ? 14 : 7,
      preferredHall: index % 3 === 0 ? "VIP Hall" : undefined,
    };
  });

  const newMovies: CatalogMovie[] = [
    {
      slug: "the-night-mother-returns-home",
      title: "The Night Mother Returns Home",
      description:
        "A tense supernatural thriller about a family reunion that awakens a long-buried curse.",
      releaseDate: "2026-04-03",
      durationMinutes: 112,
      rating: 7.6,
      posterUrl:
        "https://m.media-amazon.com/images/M/MV5BMjgxZWRiMGUtNTYyYi00OWE4LTgzNDktZTUwYjMzM2Q0ZTI4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      backdropUrl:
        "https://m.media-amazon.com/images/M/MV5BMjgxZWRiMGUtNTYyYi00OWE4LTgzNDktZTUwYjMzM2Q0ZTI4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      language: "English",
      status: "RELEASED",
      genres: ["Horror", "Thriller"],
      cast: [
        { name: "Ariane Solis", role: "DIRECTOR" },
        { name: "Mara Velez", role: "ACTOR", characterName: "Elena Ward" },
        { name: "Jonah Pike", role: "ACTOR", characterName: "Father Tomas" },
        { name: "Selene Hart", role: "ACTOR", characterName: "The Night Mother" },
      ],
      showtimes: ["1:30 PM", "6:00 PM", "9:40 PM"],
      runDays: 14,
      preferredHall: "VIP Hall",
    },
    {
      slug: "the-last-ritual-road-to-hell",
      title: "The Last Ritual: Road to Hell",
      description:
        "A desperate road trip turns into an occult nightmare as survivors race toward the final exorcism.",
      releaseDate: "2026-04-10",
      durationMinutes: 104,
      rating: 7.1,
      posterUrl:
        "https://m.media-amazon.com/images/M/MV5BYTUyYWNjYTAtZWRkNC00YjNjLWEzYzctYjIwMzY3MmMxYTg5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      backdropUrl:
        "https://m.media-amazon.com/images/M/MV5BYTUyYWNjYTAtZWRkNC00YjNjLWEzYzctYjIwMzY3MmMxYTg5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      language: "English",
      status: "RELEASED",
      genres: ["Horror", "Action"],
      cast: [
        { name: "Damien Rowe", role: "DIRECTOR" },
        { name: "Lena Cross", role: "ACTOR", characterName: "Sister Miriam" },
        { name: "Ty Reese", role: "ACTOR", characterName: "Cole Mercer" },
        { name: "Victor Han", role: "ACTOR", characterName: "The Pilgrim" },
      ],
      showtimes: ["12:15 PM", "4:20 PM", "8:50 PM"],
      runDays: 10,
      preferredHall: "Hall 2",
    },
    {
      slug: "sunshine-womens-choir",
      title: "Sunshine Women's Choir",
      description:
        "A heartfelt musical drama following a small-town choir fighting to keep their community center alive.",
      releaseDate: "2026-04-17",
      durationMinutes: 118,
      rating: 8.1,
      posterUrl:
        "https://m.media-amazon.com/images/M/MV5BMDI1ZTkyNDctNGY1My00NjAwLTg0OWEtODAxZWE5MGVhOTllXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      backdropUrl:
        "https://m.media-amazon.com/images/M/MV5BMDI1ZTkyNDctNGY1My00NjAwLTg0OWEtODAxZWE5MGVhOTllXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      language: "Korean",
      status: "RELEASED",
      genres: ["Drama", "Music"],
      cast: [
        { name: "Han Seori", role: "DIRECTOR" },
        { name: "Kim Yejin", role: "ACTOR", characterName: "Jiyoon" },
        { name: "Park Sora", role: "ACTOR", characterName: "Ms. Oh" },
        { name: "Lee Nari", role: "ACTOR", characterName: "Minhee" },
      ],
      showtimes: ["11:00 AM", "2:40 PM", "7:10 PM"],
      runDays: 7,
      preferredHall: "Hall 1",
    },
  ];

  return [...existingMovies, ...newMovies];
}

function buildShowtimeDate(dayOffset: number, timeString: string) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);

  const [time, meridiem] = timeString.split(" ");
  const [hourString, minuteString] = time.split(":");
  let hours = Number(hourString);
  const minutes = Number(minuteString);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  const catalog = buildCatalog();
  const halls = await prisma.hall.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          seats: true,
        },
      },
    },
  });

  if (halls.length === 0) {
    throw new Error("No halls found. Seed halls/seats before running this catalog seed.");
  }

  const summary = {
    moviesUpserted: [] as string[],
    peopleUpserted: new Set<string>(),
    castMembersCreated: 0,
    showtimesCreated: 0,
    dateRange: {
      first: "",
      last: "",
    },
  };

  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  for (const movie of catalog) {
    const movieRecord = await prisma.movie.upsert({
      where: { slug: movie.slug },
      update: {
        title: movie.title,
        description: movie.description,
        releaseDate: new Date(movie.releaseDate),
        duration: movie.durationMinutes,
        rating: new Prisma.Decimal(movie.rating),
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        language: movie.language,
        status: movie.status,
      },
      create: {
        id: movie.slug,
        slug: movie.slug,
        title: movie.title,
        description: movie.description,
        releaseDate: new Date(movie.releaseDate),
        duration: movie.durationMinutes,
        rating: new Prisma.Decimal(movie.rating),
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        language: movie.language,
        status: movie.status,
      },
    });

    summary.moviesUpserted.push(movie.title);

    for (const genreName of movie.genres) {
      const genre = await prisma.genre.upsert({
        where: { slug: slugify(genreName) },
        update: { name: genreName },
        create: {
          name: genreName,
          slug: slugify(genreName),
        },
      });

      await prisma.movie.update({
        where: { id: movieRecord.id },
        data: {
          genres: {
            connect: { id: genre.id },
          },
        },
      });
    }

    await prisma.castMember.deleteMany({
      where: { movieId: movieRecord.id },
    });

    for (const member of movie.cast) {
      const person = await prisma.person.upsert({
        where: { slug: slugify(member.name) },
        update: { name: member.name },
        create: {
          name: member.name,
          slug: slugify(member.name),
        },
      });

      summary.peopleUpserted.add(member.name);

      await prisma.castMember.create({
        data: {
          movieId: movieRecord.id,
          personId: person.id,
          role: member.role,
          characterName: member.characterName ?? null,
        },
      });

      summary.castMembersCreated += 1;
    }

    const preferredHallIndex = halls.findIndex((hall) => hall.name === movie.preferredHall);
    const movieHallRotation =
      preferredHallIndex >= 0
        ? [...halls.slice(preferredHallIndex), ...halls.slice(0, preferredHallIndex)]
        : halls;

    for (let dayOffset = 0; dayOffset < movie.runDays; dayOffset += 1) {
      const hall = movieHallRotation[dayOffset % movieHallRotation.length];
      const selectedTimes =
        dayOffset % 3 === 0
          ? movie.showtimes
          : movie.showtimes.slice(0, Math.max(2, movie.showtimes.length - 1));

      for (const time of selectedTimes) {
        const startTime = buildShowtimeDate(dayOffset, time);
        const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60 * 1000);
        const isWeekend = [0, 6].includes(startTime.getDay());
        const existing = await prisma.showtime.findFirst({
          where: {
            movieId: movieRecord.id,
            hallId: hall.id,
            startTime,
          },
          select: { id: true },
        });

        if (existing) {
          continue;
        }

        await prisma.showtime.create({
          data: {
            id: `${movie.slug}-${hall.id}-${startTime.toISOString().slice(0, 16).replace(/[:-]/g, "")}`,
            movieId: movieRecord.id,
            hallId: hall.id,
            startTime,
            endTime,
            basePrice: new Prisma.Decimal(hall.name === "VIP Hall" ? 14.99 : 10.99),
            isWeekend,
            weekendMultiplier: new Prisma.Decimal(1.3),
            status: "ACTIVE",
          },
        });

        summary.showtimesCreated += 1;

        if (!earliestDate || startTime < earliestDate) {
          earliestDate = startTime;
        }

        if (!latestDate || startTime > latestDate) {
          latestDate = startTime;
        }
      }
    }
  }

  summary.dateRange.first = earliestDate?.toISOString() ?? "";
  summary.dateRange.last = latestDate?.toISOString() ?? "";

  console.log(
    JSON.stringify(
      {
        ...summary,
        peopleUpserted: Array.from(summary.peopleUpserted),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
