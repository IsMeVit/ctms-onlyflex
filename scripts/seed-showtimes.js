const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Client } = require("pg");

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

function parseDurationToMinutes(duration) {
  const hours = duration.match(/(\d+)h/i);
  const minutes = duration.match(/(\d+)min/i);

  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function buildStartDate(timeString) {
  const now = new Date();
  const [time, meridiem] = timeString.split(" ");
  const [hourString, minuteString] = time.split(":");
  let hours = Number(hourString);
  const minutes = Number(minuteString);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

async function ensureHall(client, hall) {
  const existing = await client.query(
    'SELECT id, name FROM "Hall" WHERE name = $1 LIMIT 1',
    [hall.name]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0];
  }

  const created = await client.query(
    `
      INSERT INTO "Hall" (
        id, name, capacity, "hallType", "isActive", rows, columns,
        "isPublished", "publishedAt", version, "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, true, $5, $6, false, NULL, 1, NOW(), NOW()
      )
      RETURNING id, name
    `,
    [
      hall.id,
      hall.name,
      hall.capacity,
      hall.hallType,
      hall.rows,
      hall.columns,
    ]
  );

  return created.rows[0];
}

async function seedShowtimes() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const staticMovies = extractMoviesFromStaticFile();

  const halls = [
    {
      id: "hall-standard-1",
      name: "Hall 1",
      capacity: 80,
      hallType: "STANDARD",
      rows: 8,
      columns: 10,
      rowConfigs: [
        { startRow: "A", endRow: "F", seatType: "REGULAR" },
        { startRow: "G", endRow: "H", seatType: "VIP" },
      ],
    },
    {
      id: "hall-standard-2",
      name: "Hall 2",
      capacity: 96,
      hallType: "STANDARD",
      rows: 8,
      columns: 12,
      rowConfigs: [
        { startRow: "A", endRow: "F", seatType: "REGULAR" },
        { startRow: "G", endRow: "H", seatType: "VIP" },
      ],
    },
    {
      id: "hall-vip-1",
      name: "VIP Hall",
      capacity: 48,
      hallType: "VIP",
      rows: 6,
      columns: 8,
      rowConfigs: [
        { startRow: "A", endRow: "D", seatType: "REGULAR" },
        { startRow: "E", endRow: "F", seatType: "VIP" },
      ],
    },
  ];

  await client.connect();

  try {
    await client.query("BEGIN");

    const dbMovies = await client.query(
      'SELECT id, title, slug, duration FROM "Movie" WHERE slug = ANY($1::text[])',
      [staticMovies.map((movie) => movie.id)]
    );

    const movieMap = new Map(dbMovies.rows.map((movie) => [movie.slug, movie]));
    const hallRows = [];

    for (const hall of halls) {
      hallRows.push(await ensureHall(client, hall));
    }

    const seeded = [];

    for (let movieIndex = 0; movieIndex < staticMovies.length; movieIndex += 1) {
      const staticMovie = staticMovies[movieIndex];
      const movie = movieMap.get(staticMovie.id);

      if (!movie) {
        continue;
      }

      const hall = hallRows[movieIndex % hallRows.length];
      const durationMinutes =
        typeof movie.duration === "number" && movie.duration > 0
          ? movie.duration
          : parseDurationToMinutes(staticMovie.duration);

      for (const time of staticMovie.showtimes) {
        const startTime = buildStartDate(time);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
        const isWeekend = [0, 6].includes(startTime.getDay());

        const existing = await client.query(
          `
            SELECT id FROM "Showtime"
            WHERE "movieId" = $1 AND "hallId" = $2 AND "startTime" = $3
            LIMIT 1
          `,
          [movie.id, hall.id, startTime.toISOString()]
        );

        if (existing.rowCount > 0) {
          seeded.push({ title: movie.title, time, hall: hall.name, status: "existing" });
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
            `${movie.id}-${hall.id}-${startTime.getHours()}-${startTime.getMinutes()}`,
            movie.id,
            hall.id,
            startTime.toISOString(),
            endTime.toISOString(),
            hall.name === "VIP Hall" ? 14.99 : 10.99,
            isWeekend,
          ]
        );

        seeded.push({ title: movie.title, time, hall: hall.name, status: "created" });
      }
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          success: true,
          hallsEnsured: hallRows.map((hall) => hall.name),
          showtimes: seeded,
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

seedShowtimes().catch((error) => {
  console.error(error);
  process.exit(1);
});
