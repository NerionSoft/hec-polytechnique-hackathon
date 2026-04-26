// Seed script: bootstraps a demo PE SME user with two fund theses.
//
// Run: pnpm db:seed
// Requires: DATABASE_URL, BETTER_AUTH_SECRET in .env.local.

import { PrismaClient } from "@prisma/client";
import { auth } from "@/src/infrastructure/auth/auth";

const DEMO_EMAIL = "demo@athena-pe.io";
const DEMO_PASSWORD = "DemoAthena2026!";
const DEMO_NAME = "Demo PE SME Fund";

const prisma = new PrismaClient();

async function ensureDemoUser(): Promise<{ id: string; email: string }> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`✓ Demo user already exists: ${DEMO_EMAIL}`);
    return { id: existing.id, email: existing.email };
  }

  // Better Auth handles password hashing + Account row creation.
  const result = await auth.api.signUpEmail({
    body: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: DEMO_NAME,
    },
  });

  if (!result.user) {
    throw new Error("Better Auth did not return a user from signUpEmail");
  }

  console.log(`✓ Created demo user: ${DEMO_EMAIL}`);
  return { id: result.user.id, email: result.user.email };
}

async function ensureThesis(
  ownerId: string,
  data: {
    name: string;
    sectors: string[];
    countries: string[];
    minRevenueEur: number;
    maxRevenueEur: number;
    preferences: Record<string, boolean>;
  },
): Promise<void> {
  const existing = await prisma.fundThesis.findFirst({
    where: { ownerId, name: data.name },
  });
  if (existing) {
    console.log(`  ✓ Thesis already exists: ${data.name}`);
    return;
  }
  await prisma.fundThesis.create({
    data: {
      ownerId,
      name: data.name,
      sectors: data.sectors,
      countries: data.countries,
      minRevenueEur: data.minRevenueEur,
      maxRevenueEur: data.maxRevenueEur,
      preferences: data.preferences,
      active: true,
    },
  });
  console.log(`  ✓ Created thesis: ${data.name}`);
}

async function main(): Promise<void> {
  console.log("\n🌱 Seeding Athena demo data\n");

  const user = await ensureDemoUser();

  await ensureThesis(user.id, {
    name: "Lower-mid B2B SaaS — France",
    sectors: ["Software", "B2B SaaS", "Vertical SaaS"],
    countries: ["France"],
    minRevenueEur: 5_000_000,
    maxRevenueEur: 50_000_000,
    preferences: {
      founderOwned: true,
      recurringRevenue: true,
      profitable: true,
      fragmentedMarket: false,
      successionRisk: false,
      lowCompetition: true,
    },
  });

  await ensureThesis(user.id, {
    name: "Buy-and-build — Industrial services DACH+FR",
    sectors: ["Industrial Services", "Facility Management", "Maintenance"],
    countries: ["France", "Germany", "Belgium"],
    minRevenueEur: 8_000_000,
    maxRevenueEur: 80_000_000,
    preferences: {
      founderOwned: true,
      recurringRevenue: false,
      profitable: true,
      fragmentedMarket: true,
      successionRisk: true,
      lowCompetition: false,
    },
  });

  console.log("\n✅ Seed complete.\n");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Seed failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
