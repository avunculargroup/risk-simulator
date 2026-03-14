import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "../src/db/client";
import { users, treasuryPositions, treasuryLots, priceHistory, alertRules } from "../src/db/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await hash("password123", 12);
  const [user] = await db
    .insert(users)
    .values({
      email: "demo@treasury.local",
      passwordHash,
      name: "Demo CFO",
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("Demo user already exists, skipping...");
    return;
  }

  console.log(`Created user: ${user.email}`);

  // Create position
  const [position] = await db
    .insert(treasuryPositions)
    .values({
      userId: user.id,
      name: "Primary Bitcoin Treasury",
      currency: "USD",
    })
    .returning();

  // Create sample lots
  const lots = [
    { btcAmount: "10.5", purchasePrice: "28000.00", purchaseDate: new Date("2023-01-15"), label: "Q1 2023 Purchase" },
    { btcAmount: "5.25", purchasePrice: "35000.00", purchaseDate: new Date("2023-06-01"), label: "H1 2023 DCA" },
    { btcAmount: "8.0", purchasePrice: "42000.00", purchaseDate: new Date("2023-10-15"), label: "Q4 2023 Purchase" },
    { btcAmount: "3.75", purchasePrice: "52000.00", purchaseDate: new Date("2024-02-01"), label: "2024 Opening" },
    { btcAmount: "2.5", purchasePrice: "65000.00", purchaseDate: new Date("2024-10-01"), label: "Q4 2024" },
  ];

  await db.insert(treasuryLots).values(
    lots.map(l => ({ ...l, positionId: position.id }))
  );

  console.log(`Created ${lots.length} treasury lots`);

  // Seed some historical price data (30 days)
  const now = Date.now();
  const pricePoints = [];
  let price = 60000;
  for (let i = 30; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.48) * 0.04);
    pricePoints.push({
      timestamp: new Date(now - i * 86400000),
      close: price.toFixed(2),
      source: "seed",
    });
  }

  await db.insert(priceHistory).values(pricePoints).onConflictDoNothing();
  console.log("Seeded 30 days of price history");

  // Create sample alert rule
  await db.insert(alertRules).values({
    userId: user.id,
    positionId: position.id,
    ruleType: "price_below",
    severity: "warning",
    threshold: "50000.00",
    label: "BTC Below $50K",
  });

  console.log("Created sample alert rule");
  console.log("\n✅ Seed complete!");
  console.log("Login: demo@treasury.local / password123");
}

seed().catch(console.error).finally(() => process.exit(0));
