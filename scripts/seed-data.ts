import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface MovieData {
  title: string;
  slug: string;
  description: string;
  duration: number;
  rating: number;
  status: "RELEASED" | "ANNOUNCED" | "POST_PRODUCTION";
  genreNames: string[];
  posterUrl?: string;
  backdropUrl?: string;
}

interface HallData {
  name: string;
  hallType: "STANDARD" | "VIP";
  rows: number;
  columns: number;
  rowConfigs: Array<{ startRow: string; endRow: string; seatType: string }>;
}

const genres = [
  { name: "Action", slug: "action" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Horror", slug: "horror" },
  { name: "Sci-Fi", slug: "sci-fi" },
  { name: "Romance", slug: "romance" },
];

const movies: MovieData[] = [
  {
    title: "Dune: Part Three",
    slug: "dune-part-three",
    description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    duration: 166,
    rating: 8.5,
    status: "RELEASED",
    genreNames: ["Sci-Fi", "Action"],
    posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9T9J4RwqIdXqzKQe.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2k2.jpg",
  },
  {
    title: "The Marvels",
    slug: "the-marvels",
    description: "Carol Danvers aka Captain Marvel has reclaimed her identity from the tyrannical Kree and is living her life as a pilot.",
    duration: 105,
    rating: 6.0,
    status: "RELEASED",
    genreNames: ["Action", "Sci-Fi"],
    posterUrl: "https://image.tmdb.org/t/p/w500/tBaXZcwqYVXOoKlCabR2eYqNpq0.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/uqE4yH5cFjJ8QTF5O2sqaL2pFNp.jpg",
  },
  {
    title: "Oppenheimer",
    slug: "oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    duration: 180,
    rating: 8.4,
    status: "RELEASED",
    genreNames: ["Drama", "Action"],
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
  },
  {
    title: "Barbie",
    slug: "barbie",
    description: "Barbie and Ken are having the time of their lives in the colorful and perfect-seeming world of Barbie Land.",
    duration: 114,
    rating: 7.0,
    status: "RELEASED",
    genreNames: ["Comedy", "Action"],
    posterUrl: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIhugBTusqV.jpg",
  },
  {
    title: "The Dark Knight",
    slug: "the-dark-knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    duration: 152,
    rating: 9.0,
    status: "RELEASED",
    genreNames: ["Action", "Drama"],
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
  },
  {
    title: "Inception",
    slug: "inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
    duration: 148,
    rating: 8.8,
    status: "RELEASED",
    genreNames: ["Sci-Fi", "Action"],
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
  },
  {
    title: "Interstellar",
    slug: "interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    duration: 169,
    rating: 8.6,
    status: "RELEASED",
    genreNames: ["Sci-Fi", "Drama"],
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniL6E8ahDaPCb6JuWyVDF.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
  },
  {
    title: "The Conjuring",
    slug: "the-conjuring",
    description: "Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.",
    duration: 112,
    rating: 7.5,
    status: "RELEASED",
    genreNames: ["Horror"],
    posterUrl: "https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/wZ2pXUcHXh9nWrQJkjdUDXU0k3l.jpg",
  },
  {
    title: "La La Land",
    slug: "la-la-land",
    description: "A jazz musician and an aspiring actress fall in love while working together in Los Angeles.",
    duration: 128,
    rating: 8.0,
    status: "RELEASED",
    genreNames: ["Romance", "Drama"],
    posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fhP2dU3rW5jEtDZYYa3pTk4qqqZ.jpg",
  },
  {
    title: "Avatar: The Way of Water",
    slug: "avatar-the-way-of-water",
    description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.",
    duration: 192,
    rating: 7.6,
    status: "RELEASED",
    genreNames: ["Sci-Fi", "Action"],
    posterUrl: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
  },
];

const halls: HallData[] = [
  {
    name: "Cinema 1 - Standard",
    hallType: "STANDARD",
    rows: 8,
    columns: 12,
    rowConfigs: [
      { startRow: "A", endRow: "H", seatType: "REGULAR" },
    ],
  },
  {
    name: "Cinema 2 - VIP",
    hallType: "VIP",
    rows: 6,
    columns: 10,
    rowConfigs: [
      { startRow: "A", endRow: "B", seatType: "VIP" },
      { startRow: "C", endRow: "F", seatType: "REGULAR" },
    ],
  },
  {
    name: "Cinema 3 - Premium",
    hallType: "STANDARD",
    rows: 10,
    columns: 14,
    rowConfigs: [
      { startRow: "A", endRow: "A", seatType: "VIP" },
      { startRow: "B", endRow: "C", seatType: "TWINSEAT" },
      { startRow: "D", endRow: "J", seatType: "REGULAR" },
    ],
  },
];

const customerNames = [
  "John Smith",
  "Emma Johnson",
  "Michael Brown",
  "Sarah Davis",
  "David Wilson",
];

function generateShowtimes(hallsData: Awaited<ReturnType<typeof prisma.hall.findMany>>, moviesData: Awaited<ReturnType<typeof prisma.movie.findMany>>) {
  const showtimes = [];
  const now = new Date();
  
  // Generate showtimes over the past 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    
    // 2-3 showtimes per day
    const showtimesPerDay = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < showtimesPerDay; i++) {
      const randomHall = hallsData[Math.floor(Math.random() * hallsData.length)];
      const randomMovie = moviesData[Math.floor(Math.random() * moviesData.length)];
      
      // Evening showtimes (6PM, 7:30PM, 9PM)
      const hours = [18, 19, 21];
      const hour = hours[Math.floor(Math.random() * hours.length)];
      const minute = hour === 19 ? 30 : 0;
      
      const showtimeDate = new Date(date);
      showtimeDate.setHours(hour, minute, 0, 0);
      
      // End time based on movie duration
      const endTime = new Date(showtimeDate);
      endTime.setMinutes(endTime.getMinutes() + (randomMovie.duration || 120));
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6;
      
      showtimes.push({
        movieId: randomMovie.id,
        hallId: randomHall.id,
        startTime: showtimeDate,
        endTime: endTime,
        basePrice: isWeekend ? 15.00 : 12.00,
        isWeekend: isWeekend,
        status: "ACTIVE" as const,
      });
    }
  }
  
  return showtimes;
}

async function seedData() {
  try {
    console.log("🌱 Starting data seed...\n");

    // Create genres
    console.log("Creating genres...");
    const createdGenres = await Promise.all(
      genres.map((genre) =>
        prisma.genre.upsert({
          where: { slug: genre.slug },
          update: {},
          create: genre,
        })
      )
    );
    console.log(`✅ Created ${createdGenres.length} genres`);

    // Create movies
    console.log("\nCreating movies...");
    const createdMovies = await Promise.all(
      movies.map(async (movie) => {
        const created = await prisma.movie.upsert({
          where: { slug: movie.slug },
          update: {
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
          },
          create: {
            title: movie.title,
            slug: movie.slug,
            description: movie.description,
            duration: movie.duration,
            rating: movie.rating,
            status: movie.status,
            releaseDate: new Date("2024-01-15"),
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
          },
        });

        // Connect genres
        const genreIds = createdGenres
          .filter((g) => movie.genreNames.includes(g.name))
          .map((g) => g.id);

        await prisma.movie.update({
          where: { id: created.id },
          data: {
            genres: {
              connect: genreIds.map((id) => ({ id })),
            },
          },
        });

        return created;
      })
    );
    console.log(`✅ Created ${createdMovies.length} movies`);

    // Create halls
    console.log("\nCreating halls...");
    const createdHalls = await Promise.all(
      halls.map(async (hall) => {
        const capacity = hall.rows * hall.columns;
        
        const created = await prisma.hall.upsert({
          where: { id: hall.name.toLowerCase().replace(/\s+/g, "-") },
          update: {},
          create: {
            name: hall.name,
            hallType: hall.hallType,
            screenType: "STANDARD_2D",
            capacity,
            rows: hall.rows,
            columns: hall.columns,
            isActive: true,
            isPublished: true,
            rowConfigs: hall.rowConfigs as unknown as object,
          },
        });

        return created;
      })
    );
    console.log(`✅ Created ${createdHalls.length} halls`);

    // Generate and create seats for each hall
    console.log("\nGenerating seats for halls...");
    for (const hall of createdHalls) {
      const existingSeats = await prisma.seat.count({ where: { hallId: hall.id } });
      if (existingSeats > 0) {
        console.log(`  - ${hall.name}: ${existingSeats} seats already exist, skipping`);
        continue;
      }

      const seats = [];
      const rowConfigs = (hall.rowConfigs as Array<{ startRow: string; endRow: string; seatType: string }>) || [];
      
      for (let rowIdx = 0; rowIdx < hall.rows; rowIdx++) {
        const rowLabel = String.fromCharCode(65 + rowIdx);
        
        // Find matching row config
        const matchingConfig = rowConfigs.find((config) => {
          const startIdx = config.startRow.charCodeAt(0) - 65;
          const endIdx = config.endRow.charCodeAt(0) - 65;
          return rowIdx >= startIdx && rowIdx <= endIdx;
        });
        
        const seatType = matchingConfig?.seatType || "REGULAR";
        
        for (let col = 0; col < hall.columns; col++) {
          seats.push({
            id: `${hall.id}-${rowLabel}-${col}`,
            hallId: hall.id,
            row: rowLabel,
            column: col,
            number: col + 1,
            seatNumber: col + 1,
            seatType: seatType as "REGULAR" | "VIP" | "TWINSEAT",
            isActive: true,
            status: "AVAILABLE" as const,
          });
        }
      }

      await prisma.seat.createMany({ data: seats });
      console.log(`  - ${hall.name}: Created ${seats.length} seats`);
    }

    // Create customers
    console.log("\nCreating customers...");
    const createdUsers = await Promise.all(
      customerNames.map(async (name, idx) => {
        const email = `customer${idx + 1}@example.com`;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return existingUser;
        }
        
        const hashedPassword = await bcrypt.hash("password123", 10);
        
        return prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "USER",
            membershipTier: idx < 2 ? "MEMBER" : "NONE",
          },
        });
      })
    );
    console.log(`✅ Created ${createdUsers.length} customers`);

    // Generate showtimes
    console.log("\nGenerating showtimes...");
    const showtimesData = generateShowtimes(createdHalls, createdMovies);
    const createdShowtimes = await Promise.all(
      showtimesData.map((st) =>
        prisma.showtime.create({
          data: st,
        })
      )
    );
    console.log(`✅ Created ${createdShowtimes.length} showtimes`);

    // Generate bookings
    console.log("\nGenerating bookings and payments...");
    const bookings = [];
    const now = new Date();
    
    for (let i = 0; i < 28; i++) {
      const randomShowtime = createdShowtimes[Math.floor(Math.random() * createdShowtimes.length)];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      // Get seats for this showtime
      const showtimeSeats = await prisma.seat.findMany({
        where: { hallId: randomShowtime.hallId },
        take: 4,
        skip: Math.floor(Math.random() * 20),
      });
      
      if (showtimeSeats.length === 0) continue;
      
      // Random number of seats (1-4)
      const numSeats = Math.min(showtimeSeats.length, 1 + Math.floor(Math.random() * 3));
      const selectedSeats = showtimeSeats.slice(0, numSeats);
      
      // Generate booking date (within showtime date range)
      const bookingDate = new Date(randomShowtime.startTime);
      bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 7));
      
      // 85% confirmed, 10% pending, 5% cancelled
      const rand = Math.random();
      const status = rand < 0.85 ? "CONFIRMED" : rand < 0.95 ? "PENDING" : "CANCELLED";
      
      const ticketPrice = Number(randomShowtime.basePrice);
      const vipMultiplier = selectedSeats.some(s => s.seatType === "VIP") ? 1.5 : 1;
      const twinMultiplier = selectedSeats.some(s => s.seatType === "TWINSEAT") ? 1.5 : 1;
      const weekendMultiplier = randomShowtime.isWeekend ? 1.3 : 1;
      
      const subtotal = ticketPrice * numSeats * vipMultiplier * twinMultiplier * weekendMultiplier;
      const discount = status === "CANCELLED" ? subtotal * 0.1 : 0;
      const finalAmount = subtotal - discount;
      
      const booking = await prisma.booking.create({
        data: {
          userId: randomUser.id,
          showtimeId: randomShowtime.id,
          subtotal: subtotal,
          totalDiscount: discount,
          finalAmount: finalAmount,
          bookingStatus: status,
          createdAt: bookingDate,
        },
      });
      
      // Create payment
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: finalAmount,
          paymentMethod: Math.random() > 0.5 ? "ONLINE" : "CARD",
          status: status === "CONFIRMED" ? "COMPLETED" : status === "PENDING" ? "PENDING" : "REFUNDED",
          paidAt: status === "CONFIRMED" ? bookingDate : null,
          createdAt: bookingDate,
        },
      });
      
      // Create tickets
      for (const seat of selectedSeats) {
        await prisma.ticket.create({
          data: {
            bookingId: booking.id,
            showtimeId: randomShowtime.id,
            seatId: seat.id,
            ticketType: "ADULT",
            originalPrice: ticketPrice * vipMultiplier * weekendMultiplier,
            discountAmount: 0,
            finalPrice: ticketPrice * vipMultiplier * weekendMultiplier,
            status: status === "CONFIRMED" ? "CONFIRMED" : status === "PENDING" ? "RESERVED" : "CANCELLED",
          },
        });
      }
      
      bookings.push(booking);
    }
    console.log(`✅ Created ${bookings.length} bookings with payments and tickets`);

    // Summary
    console.log("\n📊 Data Summary:");
    console.log(`   - Genres: ${createdGenres.length}`);
    console.log(`   - Movies: ${createdMovies.length}`);
    console.log(`   - Halls: ${createdHalls.length}`);
    const totalSeats = await prisma.seat.count();
    console.log(`   - Seats: ${totalSeats}`);
    console.log(`   - Showtimes: ${createdShowtimes.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    
    const confirmedBookings = bookings.filter(b => b.bookingStatus === "CONFIRMED").length;
    const cancelledBookings = bookings.filter(b => b.bookingStatus === "CANCELLED").length;
    console.log(`   - Confirmed: ${confirmedBookings}, Cancelled: ${cancelledBookings}`);

    console.log("\n✅ Data seed completed successfully!");
    
    // Login info
    console.log("\n📧 Login credentials:");
    console.log("   Admin: admin@movietickets.com / admin123");
    console.log("   Customers: customer1@example.com / password123 (and customer2-5)");

  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
