// Seed script: bootstraps a demo PE SME user with two fund theses
// and one Lead → Deal pair so /pipeline/[dealId]/data-room is testable.
//
// Run: pnpm db:seed
// Requires: DATABASE_URL, BETTER_AUTH_SECRET in .env.local.

import { PrismaClient } from "@prisma/client";
import { auth } from "@/src/infrastructure/auth/auth";

const DEMO_EMAIL = "demo@athena-pe.io";
const DEMO_PASSWORD = "DemoAthena2026!";
const DEMO_NAME = "Demo PE SME Fund";

const DEMO_LEAD_NAME = "Helios AgriTech";
const DEMO_LEAD_KEY = "seed-helios-agritech";

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

async function ensureDemoDeal(ownerId: string): Promise<{ dealId: string; created: boolean }> {
  // Lead is keyed by (source, sourceRef) — composite unique. We use MANUAL +
  // a fixed key so re-running the seed is idempotent.
  const lead = await prisma.lead.upsert({
    where: { source_dedupe: { source: "MANUAL", sourceRef: DEMO_LEAD_KEY } },
    update: {},
    create: {
      source: "MANUAL",
      sourceRef: DEMO_LEAD_KEY,
      companyName: DEMO_LEAD_NAME,
      legalName: "Helios AgriTech SAS",
      website: "https://helios-agritech.example",
      country: "FR",
      sector: "Agritech",
      employeeCount: 142,
      estimatedRevenue: 31_000_000,
      founderName: "Camille Laurent",
      status: "DATA_ROOM_OPENED",
    },
  });

  const existing = await prisma.deal.findUnique({ where: { leadId: lead.id } });
  if (existing) {
    console.log(`  ✓ Deal already exists: ${existing.id}`);
    return { dealId: existing.id, created: false };
  }

  const deal = await prisma.deal.create({
    data: {
      leadId: lead.id,
      ownerId,
      stage: "IN_DD",
      revenueEur: 31_000_000,
      ebitdaEur: 4_200_000,
      ebitdaMargin: 0.135,
      growthYoy: 0.18,
      netDebtEbitda: 3.4,
      employees: 142,
      founded: 2014,
      thesisFit: 87,
      timeSavedDays: 4.2,
      coverage: 0.92,
      nextAction: "Upload remaining VDR documents",
    },
  });

  console.log(`  ✓ Created deal: ${deal.id}`);
  return { dealId: deal.id, created: true };
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

  const { dealId } = await ensureDemoDeal(user.id);

  console.log("\n✅ Seed complete.\n");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Deal:     /pipeline/${dealId}/data-room\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Seed failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
