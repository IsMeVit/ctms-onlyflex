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

async function seedMovies() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const movies = extractMoviesFromStaticFile();

  await client.connect();

  try {
    await client.query("BEGIN");

    for (const movie of movies) {
      await client.query(
        `
          INSERT INTO "Movie" (
            "id",
            "title",
            "slug",
            "description",
            "releaseDate",
            "duration",
            "rating",
            "posterUrl",
            "backdropUrl",
            "language",
            "status",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RELEASED', NOW(), NOW()
          )
          ON CONFLICT ("slug") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "releaseDate" = EXCLUDED."releaseDate",
            "duration" = EXCLUDED."duration",
            "rating" = EXCLUDED."rating",
            "posterUrl" = EXCLUDED."posterUrl",
            "backdropUrl" = EXCLUDED."backdropUrl",
            "language" = EXCLUDED."language",
            "status" = EXCLUDED."status",
            "updatedAt" = NOW()
        `,
        [
          movie.id,
          movie.title,
          movie.id,
          movie.description,
          new Date(movie.releaseDate),
          parseDurationToMinutes(movie.duration),
          movie.rating,
          movie.image,
          movie.image,
          movie.language,
        ]
      );
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          success: true,
          seededMovies: movies.map((movie) => movie.title),
          count: movies.length,
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

seedMovies().catch((error) => {
  console.error(error);
  process.exit(1);
});
