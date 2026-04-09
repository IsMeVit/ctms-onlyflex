/* eslint-disable @typescript-eslint/no-require-imports */

const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

dotenv.config({ path: ".env", override: false });
dotenv.config({ path: ".env.local", override: true });

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl =
  process.env.RUNNING_IN_DOCKER === "true" || !rawDatabaseUrl
    ? rawDatabaseUrl ?? "postgresql://postgres:noeun@localhost:5432/moviedb"
    : rawDatabaseUrl.replace("@db:5432", "@localhost:5432");

const pool = new Pool({ connectionString: databaseUrl });

const TARGET_REVIEWS = 200;
const REVIEWER_EMAIL_PREFIX = "seed-reviewer";
const REVIEWER_PASSWORD = "password123";

const reviewOpeners = [
  "A solid watch with great pacing.",
  "The cast carried the film beautifully.",
  "It had a few rough spots, but I still enjoyed it.",
  "A memorable theater experience from start to finish.",
  "Visually striking and emotionally engaging.",
  "The soundtrack and atmosphere really stood out.",
  "An easy recommendation for a movie night.",
  "It kept me invested the whole way through.",
];

const reviewClosers = [
  "I would happily watch it again.",
  "It was worth the ticket price.",
  "I’d recommend it to friends.",
  "The ending made it even better.",
  "I left the theater feeling satisfied.",
  "It delivered exactly what I wanted.",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildReviewContent(movieTitle, rating, reviewerIndex) {
  const opener = reviewOpeners[reviewerIndex % reviewOpeners.length];
  const closer = reviewClosers[(reviewerIndex + rating) % reviewClosers.length];

  return `${opener} ${movieTitle} deserves ${rating}/5. ${closer}`;
}

async function ensureReviewerUsers(client, movieCount) {
  let reviewerCount = Math.max(20, Math.ceil(TARGET_REVIEWS / movieCount));
  while (reviewerCount * movieCount < TARGET_REVIEWS) {
    reviewerCount += 1;
  }

  const passwordHash = await bcrypt.hash(REVIEWER_PASSWORD, 10);
  const reviewers = [];

  for (let index = 0; index < reviewerCount; index += 1) {
    const email = `${REVIEWER_EMAIL_PREFIX}-${String(index + 1).padStart(3, "0")}@example.com`;
    const name = `Seed Reviewer ${String(index + 1).padStart(3, "0")}`;
    const id = `${REVIEWER_EMAIL_PREFIX}-${String(index + 1).padStart(3, "0")}`;

    const result = await client.query(
      `
        INSERT INTO users (id, name, email, password, role, "membershipTier", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          "membershipTier" = EXCLUDED."membershipTier",
          updated_at = NOW()
        RETURNING id, email, name
      `,
      [id, name, email, passwordHash, "USER", "NONE"],
    );

    reviewers.push(result.rows[0]);
  }

  return reviewers;
}

async function seedReviews() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const movieResult = await client.query(
      `
        SELECT id, title
        FROM "Movie"
        ORDER BY "createdAt" ASC
      `,
    );

    if (movieResult.rows.length === 0) {
      throw new Error("No movies found. Seed movies before running the review seed.");
    }

    const reviewers = await ensureReviewerUsers(client, movieResult.rows.length);
    const reviewerIds = reviewers.map((reviewer) => reviewer.id);
    const movieIds = movieResult.rows.map((movie) => movie.id);

    const existingSeedReviews = await client.query(
      `
        SELECT "movieId", "userId"
        FROM "Review"
        WHERE "userId" = ANY($1::text[])
          AND "movieId" = ANY($2::text[])
      `,
      [reviewerIds, movieIds],
    );

    const existingPairs = new Set(
      existingSeedReviews.rows.map((review) => `${review.movieId}:${review.userId}`),
    );

    const candidatePairs = [];
    reviewers.forEach((reviewer, reviewerIndex) => {
      movieResult.rows.forEach((movie) => {
        const key = `${movie.id}:${reviewer.id}`;
        if (!existingPairs.has(key)) {
          candidatePairs.push({
            movieId: movie.id,
            userId: reviewer.id,
            movieTitle: movie.title,
            reviewerIndex,
          });
        }
      });
    });

    const remainingSlots = TARGET_REVIEWS - existingSeedReviews.rows.length;

    if (remainingSlots <= 0) {
      console.log(`✅ Seed reviews already exist (${existingSeedReviews.rows.length} records).`);
      await client.query("COMMIT");
      return;
    }

    if (candidatePairs.length < remainingSlots) {
      throw new Error(
        `Not enough unique movie/user combinations to create ${TARGET_REVIEWS} reviews.`,
      );
    }

    const reviewsToCreate = shuffle(candidatePairs)
      .slice(0, remainingSlots)
      .map((pair, index) => {
        const rating = randomInt(1, 5);
        const createdAt = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);

        return {
          id: randomUUID(),
          movieId: pair.movieId,
          userId: pair.userId,
          rating,
          content: buildReviewContent(pair.movieTitle, rating, pair.reviewerIndex + index),
          createdAt,
        };
      });

    for (const review of reviewsToCreate) {
      await client.query(
        `
          INSERT INTO "Review" ("id", "rating", "content", "movieId", "userId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $6)
        `,
        [
          review.id,
          review.rating,
          review.content,
          review.movieId,
          review.userId,
          review.createdAt,
        ],
      );
    }

    await client.query("COMMIT");

    const totalSeededReviews = existingSeedReviews.rows.length + reviewsToCreate.length;
    console.log(`✅ Created ${reviewsToCreate.length} fake reviews.`);
    console.log(`📊 Total seeded reviews now: ${totalSeededReviews}`);
    console.log(`👥 Seed reviewers available: ${reviewers.length}`);
    console.log(`🎬 Movies available: ${movieResult.rows.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding reviews:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedReviews();
