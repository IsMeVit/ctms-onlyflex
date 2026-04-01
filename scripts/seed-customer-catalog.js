const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function extractMoviesFromStaticFile() {
  const filePath = path.join(process.cwd(), "lib", "now-showing-movies.ts");
  const source = fs.readFileSync(filePath, "utf8");
  const match = source.match(
    /export const nowShowingMovies: NowShowingMovie\[\] = (\[[\s\S]*?\]);/
  );

  if (!match) {
    throw new Error("Could not find nowShowingMovies array in lib/now-showing-movies.ts");
  }

  return vm.runInNewContext(`(${match[1]})`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDurationToMinutes(duration) {
  const hours = duration.match(/(\d+)h/i);
  const minutes = duration.match(/(\d+)min/i);

  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function buildCatalog() {
  const staticMovies = extractMoviesFromStaticFile();

  const existingMovies = staticMovies.map((movie, index) => {
    const genres = movie.genre.split("/").map((genre) => genre.trim());
    const showtimePatterns =
      index % 2 === 0 ? movie.showtimes : [...movie.showtimes, "11:15 AM"];

    return {
      id: movie.id,
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
          role: "ACTOR",
          characterName: `Lead ${castIndex + 1}`,
        })),
      ],
      showtimes: showtimePatterns,
      runDays: index % 2 === 0 ? 14 : 7,
      preferredHall: index % 3 === 0 ? "VIP Hall" : null,
    };
  });

  const newMovies = [
    {
      id: "the-night-mother-returns-home",
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
      id: "the-last-ritual-road-to-hell",
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
      id: "sunshine-womens-choir",
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

function buildShowtimeDate(dayOffset, timeString) {
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

async function upsertMovie(client, movie) {
  await client.query(
    `
      INSERT INTO "Movie" (
        id, title, slug, description, "releaseDate", duration, rating,
        "posterUrl", "backdropUrl", language, status, "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        "releaseDate" = EXCLUDED."releaseDate",
        duration = EXCLUDED.duration,
        rating = EXCLUDED.rating,
        "posterUrl" = EXCLUDED."posterUrl",
        "backdropUrl" = EXCLUDED."backdropUrl",
        language = EXCLUDED.language,
        status = EXCLUDED.status,
        "updatedAt" = NOW()
    `,
    [
      movie.id,
      movie.title,
      movie.slug,
      movie.description,
      new Date(movie.releaseDate),
      movie.durationMinutes,
      movie.rating,
      movie.posterUrl,
      movie.backdropUrl,
      movie.language,
      movie.status,
    ]
  );
}

async function ensureGenre(client, genreName) {
  const slug = slugify(genreName);
  const result = await client.query(
    `
      INSERT INTO "Genre" (id, name, slug)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [slug, genreName, slug]
  );

  return result.rows[0].id;
}

async function connectGenreToMovie(client, genreId, movieId) {
  await client.query(
    `
      INSERT INTO "_GenreToMovie" ("A", "B")
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [genreId, movieId]
  );
}

async function ensurePerson(client, name) {
  const slug = slugify(name);
  const result = await client.query(
    `
      INSERT INTO "Person" (id, name, slug)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [slug, name, slug]
  );

  return result.rows[0].id;
}

async function replaceCastForMovie(client, movieId, cast) {
  await client.query('DELETE FROM "CastMember" WHERE "movieId" = $1', [movieId]);

  for (const member of cast) {
    const personId = await ensurePerson(client, member.name);

    await client.query(
      `
        INSERT INTO "CastMember" (id, "movieId", "personId", role, "characterName")
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        `${movieId}-${personId}-${member.role}-${member.characterName || "na"}`,
        movieId,
        personId,
        member.role,
        member.characterName || null,
      ]
    );
  }
}

async function seedShowtimesForMovie(client, movie, halls) {
  let created = 0;
  let earliest = null;
  let latest = null;

  const preferredHallIndex = halls.findIndex((hall) => hall.name === movie.preferredHall);
  const hallRotation =
    preferredHallIndex >= 0
      ? [...halls.slice(preferredHallIndex), ...halls.slice(0, preferredHallIndex)]
      : halls;

  for (let dayOffset = 0; dayOffset < movie.runDays; dayOffset += 1) {
    const hall = hallRotation[dayOffset % hallRotation.length];
    const selectedTimes =
      dayOffset % 3 === 0
        ? movie.showtimes
        : movie.showtimes.slice(0, Math.max(2, movie.showtimes.length - 1));

    for (const time of selectedTimes) {
      const startTime = buildShowtimeDate(dayOffset, time);
      const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60 * 1000);
      const isWeekend = [0, 6].includes(startTime.getDay());
      const exists = await client.query(
        `
          SELECT id
          FROM "Showtime"
          WHERE "movieId" = $1 AND "hallId" = $2 AND "startTime" = $3
          LIMIT 1
        `,
        [movie.id, hall.id, startTime.toISOString()]
      );

      if (exists.rowCount > 0) {
        continue;
      }

      await client.query(
        `
          INSERT INTO "Showtime" (
            id, "movieId", "hallId", "startTime", "endTime", "basePrice",
            "isWeekend", "weekendMultiplier", status, "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1.3, 'ACTIVE', NOW())
        `,
        [
          `${movie.slug}-${hall.id}-${startTime.toISOString().slice(0, 16).replace(/[:-]/g, "")}`,
          movie.id,
          hall.id,
          startTime.toISOString(),
          endTime.toISOString(),
          hall.name === "VIP Hall" ? 14.99 : 10.99,
          isWeekend,
        ]
      );

      created += 1;
      if (!earliest || startTime < earliest) earliest = startTime;
      if (!latest || startTime > latest) latest = startTime;
    }
  }

  return { created, earliest, latest };
}

async function seedCatalog() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const catalog = buildCatalog();

  await client.connect();

  try {
    await client.query("BEGIN");

    const hallsResult = await client.query(
      'SELECT id, name FROM "Hall" ORDER BY name'
    );
    const halls = hallsResult.rows;

    if (halls.length === 0) {
      throw new Error("No halls found. Seed halls first.");
    }

    const summary = {
      moviesUpserted: [],
      castMembersCreated: 0,
      showtimesCreated: 0,
      earliestShowtime: null,
      latestShowtime: null,
    };

    for (const movie of catalog) {
      await upsertMovie(client, movie);
      summary.moviesUpserted.push(movie.title);

      for (const genreName of movie.genres) {
        const genreId = await ensureGenre(client, genreName);
        await connectGenreToMovie(client, genreId, movie.id);
      }

      await replaceCastForMovie(client, movie.id, movie.cast);
      summary.castMembersCreated += movie.cast.length;

      const showtimeSummary = await seedShowtimesForMovie(client, movie, halls);
      summary.showtimesCreated += showtimeSummary.created;

      if (
        showtimeSummary.earliest &&
        (!summary.earliestShowtime || showtimeSummary.earliest < summary.earliestShowtime)
      ) {
        summary.earliestShowtime = showtimeSummary.earliest;
      }

      if (
        showtimeSummary.latest &&
        (!summary.latestShowtime || showtimeSummary.latest > summary.latestShowtime)
      ) {
        summary.latestShowtime = showtimeSummary.latest;
      }
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          ...summary,
          earliestShowtime: summary.earliestShowtime
            ? summary.earliestShowtime.toISOString()
            : null,
          latestShowtime: summary.latestShowtime
            ? summary.latestShowtime.toISOString()
            : null,
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

seedCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
