// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create 10 users
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Charlie", email: "charlie@example.com" },
      { name: "David", email: "david@example.com" },
      { name: "Eve", email: "eve@example.com" },
      { name: "Frank", email: "frank@example.com" },
      { name: "Grace", email: "grace@example.com" },
      { name: "Heidi", email: "heidi@example.com" },
      { name: "Ivan", email: "ivan@example.com" },
      { name: "Judy", email: "judy@example.com" },
    ],
  });

  // Create 20 movies
  await prisma.item.createMany({
    data: [
      { title: "The Matrix", category: "Sci-Fi" },
      { title: "Inception", category: "Sci-Fi" },
      { title: "Interstellar", category: "Sci-Fi" },
      { title: "The Dark Knight", category: "Action" },
      { title: "Avengers", category: "Action" },
      { title: "Iron Man", category: "Action" },
      { title: "Thor", category: "Fantasy" },
      { title: "Doctor Strange", category: "Fantasy" },
      { title: "Black Panther", category: "Action" },
      { title: "Captain America", category: "Action" },
      { title: "Guardians of the Galaxy", category: "Sci-Fi" },
      { title: "Spider-Man: Homecoming", category: "Action" },
      { title: "Shutter Island", category: "Thriller" },
      { title: "Memento", category: "Thriller" },
      { title: "Dunkirk", category: "War" },
      { title: "Tenet", category: "Sci-Fi" },
      { title: "The Prestige", category: "Drama" },
      { title: "Joker", category: "Drama" },
      { title: "Logan", category: "Action" },
      { title: "Deadpool", category: "Comedy" },
    ],
  });

  // Fetch back users and items because createMany doesn't return IDs
  const allUsers = await prisma.user.findMany();
  const allItems = await prisma.item.findMany();
// Old ratings system
// Ratings
// await prisma.rating.createMany({
//     data: [
//       { userId: allUsers[0].id, itemId: allItems[0].id, rating: 5 },
//       { userId: allUsers[0].id, itemId: allItems[1].id, rating: 4 },
//       { userId: allUsers[1].id, itemId: allItems[1].id, rating: 5 },
//       { userId: allUsers[1].id, itemId: allItems[2].id, rating: 4 },
//       { userId: allUsers[2].id, itemId: allItems[0].id, rating: 4 },
//       { userId: allUsers[2].id, itemId: allItems[3].id, rating: 5 },
//     ],
//   });
//New ratings system
  // Generate ratings (each user rates each movie randomly between 1–5)
  const ratings: { userId: string; itemId: string; rating: number }[] = [];

  for (const user of allUsers) {
    for (const item of allItems) {
      // 80% chance that a user has rated a movie
      if (Math.random() < 0.8) {
        ratings.push({
          userId: user.id,
          itemId: item.id,
          rating: Math.floor(Math.random() * 5) + 1, // rating 1-5
        });
      }
    }
  }

  // Insert ratings in bulk
  await prisma.rating.createMany({
    data: ratings,
  });

  console.log("✅ Database seeded successfully with 10 users, 20 movies, and ratings!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
