const { Client } = require("pg");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const { rows } = await client.query(
      'SELECT id, "startTime", "endTime" FROM "Showtime" ORDER BY "startTime" ASC'
    );

    for (const row of rows) {
      const start = new Date(row.startTime);
      if (Number.isNaN(start.getTime())) {
        // Fallback to today if stored value is invalid.
        const fallback = new Date();
        start.setTime(fallback.getTime());
      }
      // Clamp start time between 10:00 and 22:00 local time.
      const hour = randInt(10, 22);
      const minute = [0, 15, 30, 45][randInt(0, 3)];

      start.setHours(hour, minute, 0, 0);

      let end = new Date(start);
      end.setMinutes(end.getMinutes() + 120);

      await client.query(
        'UPDATE "Showtime" SET "startTime" = $1, "endTime" = $2 WHERE id = $3',
        [start.toISOString(), end.toISOString(), row.id]
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
