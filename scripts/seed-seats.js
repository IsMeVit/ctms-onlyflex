const { Client } = require("pg");
const crypto = require("crypto");

function getRowLabel(index) {
  if (index < 0) return "";

  let label = "";
  let n = index;

  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return label;
}

function inferRowConfigs(hall) {
  if (Array.isArray(hall.row_configs) && hall.row_configs.length > 0) {
    return hall.row_configs;
  }

  if (hall.name === "VIP Hall") {
    return [
      { startRow: "A", endRow: "D", seatType: "REGULAR" },
      { startRow: "E", endRow: getRowLabel(hall.rows - 1), seatType: "VIP" },
    ];
  }

  const vipStartRow = Math.max(hall.rows - 2, 0);

  return [
    {
      startRow: "A",
      endRow: getRowLabel(Math.max(vipStartRow - 1, 0)),
      seatType: "REGULAR",
    },
    {
      startRow: getRowLabel(vipStartRow),
      endRow: getRowLabel(hall.rows - 1),
      seatType: "VIP",
    },
  ].filter((config, index, array) => {
    if (index === 0 && config.startRow === array[1]?.startRow) {
      return false;
    }
    return true;
  });
}

function getSeatTypeForRow(rowIndex, rowConfigs) {
  const rowLabel = getRowLabel(rowIndex);

  for (const config of rowConfigs) {
    if (rowLabel >= config.startRow && rowLabel <= config.endRow) {
      return config.seatType;
    }
  }

  return "REGULAR";
}

function buildSeatsForHall(hall, rowConfigs) {
  const seats = [];

  for (let rowIndex = 0; rowIndex < hall.rows; rowIndex += 1) {
    const rowLabel = getRowLabel(rowIndex);
    const seatType = getSeatTypeForRow(rowIndex, rowConfigs);

    for (let column = 0; column < hall.columns; column += 1) {
      seats.push({
        id: crypto.randomUUID(),
        hallId: hall.id,
        row: rowLabel,
        number: column + 1,
        seatType,
        isActive: true,
        column,
        seatNumber: column + 1,
        status: "AVAILABLE",
      });
    }
  }

  return seats;
}

async function seedSeats() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    const hallsResult = await client.query(`
      SELECT id, name, rows, columns, capacity, "hallType", row_configs
      FROM "Hall"
      ORDER BY name
    `);

    const summary = [];

    for (const hall of hallsResult.rows) {
      const existingSeatsResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM "Seat" WHERE "hallId" = $1',
        [hall.id]
      );

      const existingCount = existingSeatsResult.rows[0]?.count ?? 0;
      const rowConfigs = inferRowConfigs(hall);

      if (!hall.row_configs || hall.row_configs.length === 0) {
        await client.query(
          'UPDATE "Hall" SET row_configs = $2::jsonb, "updatedAt" = NOW() WHERE id = $1',
          [hall.id, JSON.stringify(rowConfigs)]
        );
      }

      if (existingCount > 0) {
        summary.push({
          hall: hall.name,
          status: "existing",
          seats: existingCount,
        });
        continue;
      }

      const seats = buildSeatsForHall(hall, rowConfigs);

      for (const seat of seats) {
        await client.query(
          `
            INSERT INTO "Seat" (
              id, "hallId", row, number, "seatType", "isActive",
              "column", "seatNumber", status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            seat.id,
            seat.hallId,
            seat.row,
            seat.number,
            seat.seatType,
            seat.isActive,
            seat.column,
            seat.seatNumber,
            seat.status,
          ]
        );
      }

      summary.push({
        hall: hall.name,
        status: "created",
        seats: seats.length,
      });
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({ success: true, halls: summary }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

seedSeats().catch((error) => {
  console.error(error);
  process.exit(1);
});
