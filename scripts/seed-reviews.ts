import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: true });

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl =
  process.env.RUNNING_IN_DOCKER === "true" || !rawDatabaseUrl
    ? rawDatabaseUrl ?? "postgresql://postgres:noeun@localhost:5432/moviedb"
    : rawDatabaseUrl.replace("@db:5432", "@localhost:5432");

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildReviewContent(movieTitle: string, rating: number, reviewerIndex: number) {
  const opener = reviewOpeners[reviewerIndex % reviewOpeners.length];
  const closer = reviewClosers[(reviewerIndex + rating) % reviewClosers.length];

  return `${opener} ${movieTitle} deserves ${rating}/5. ${closer}`;
}

async function ensureReviewerUsers(movieCount: number) {
  let reviewerCount = Math.max(20, Math.ceil(TARGET_REVIEWS / movieCount));
  while (reviewerCount * movieCount < TARGET_REVIEWS) {
    reviewerCount += 1;
  }

  const passwordHash = await bcrypt.hash(REVIEWER_PASSWORD, 10);
  const reviewers = [];

  for (let index = 0; index < reviewerCount; index += 1) {
    const email = `${REVIEWER_EMAIL_PREFIX}-${String(index + 1).padStart(3, "0")}@example.com`;
    const name = `Seed Reviewer ${String(index + 1).padStart(3, "0")}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: passwordHash,
        role: "USER",
        membershipTier: "NONE",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    reviewers.push(user);
  }

  return reviewers;
}

async function seedReviews() {
  try {
    const movies = await prisma.movie.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (movies.length === 0) {
      throw new Error("No movies found. Seed movies before running the review seed.");
    }

    const reviewers = await ensureReviewerUsers(movies.length);

    const existingSeedReviews = await prisma.review.findMany({
      where: {
        userId: {
          in: reviewers.map((reviewer) => reviewer.id),
        },
        movieId: {
          in: movies.map((movie) => movie.id),
        },
      },
      select: {
        movieId: true,
        userId: true,
      },
    });

    const existingPairs = new Set(
      existingSeedReviews.map((review) => `${review.movieId}:${review.userId}`),
    );

    const candidatePairs: Array<{ movieId: string; userId: string; movieTitle: string; reviewerIndex: number }> = [];

    reviewers.forEach((reviewer, reviewerIndex) => {
      movies.forEach((movie) => {
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

    const remainingSlots = TARGET_REVIEWS - existingSeedReviews.length;

    if (remainingSlots <= 0) {
      console.log(`✅ Seed reviews already exist (${existingSeedReviews.length} records).`);
      return;
    }

    if (candidatePairs.length < remainingSlots) {
      throw new Error(
        `Not enough unique movie/user combinations to create ${TARGET_REVIEWS} reviews.`,
      );
    }

    const reviewsToCreate = shuffle(candidatePairs).slice(0, remainingSlots).map((pair, index) => {
      const rating = randomInt(1, 5);
      const createdAt = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);

      return {
        movieId: pair.movieId,
        userId: pair.userId,
        rating,
        content: buildReviewContent(pair.movieTitle, rating, pair.reviewerIndex + index),
        createdAt,
      };
    });

    await prisma.review.createMany({
      data: reviewsToCreate,
    });

    const totalSeededReviews = existingSeedReviews.length + reviewsToCreate.length;
    console.log(`✅ Created ${reviewsToCreate.length} fake reviews.`);
    console.log(`📊 Total seeded reviews now: ${totalSeededReviews}`);
    console.log(`👥 Seed reviewers available: ${reviewers.length}`);
    console.log(`🎬 Movies available: ${movies.length}`);
  } catch (error) {
    console.error("❌ Error seeding reviews:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedReviews();
