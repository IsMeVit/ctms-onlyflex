const bcrypt = require("bcryptjs");
const { Client } = require("pg");

async function main() {
  const email = process.argv[2];
  const nextPassword = process.argv[3];

  if (!email || !nextPassword) {
    throw new Error("Usage: reset-user-password <email> <newPassword>");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const check = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (check.rowCount === 0) {
      throw new Error(`User not found: ${email}`);
    }

    const hashedPassword = await bcrypt.hash(nextPassword, 10);

    await client.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2",
      [hashedPassword, email]
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
