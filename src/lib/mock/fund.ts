export const fund = {
  name: "Athena Capital Partners",
  shortName: "Athena",
  fund: "Athena Fund III",
  aum: "€450M",
  vintage: 2024,
  thesis: {
    sectors: ["B2B SaaS", "Industrial Tech", "Healthtech", "Fintech", "Agritech"],
    geo: ["FR", "DE", "BNL", "Nordics", "Iberia"],
    revenueRange: { min: 15, max: 80, unit: "€M" },
    ebitdaMargin: { min: 0.15 },
    growth: { min: 0.2 },
    multipleCap: 12,
  },
};

export type Role = "Analyst" | "Associate" | "VP" | "Partner" | "IC Member";

export type TeamMember = {
  id: string;
  name: string;
  role: Role;
  initials: string;
  avatarHue: number;
};

export const team: TeamMember[] = [
  { id: "u1", name: "Sophie Marchand", role: "Partner", initials: "SM", avatarHue: 14 },
  { id: "u2", name: "Lucas Ehrmann", role: "VP", initials: "LE", avatarHue: 204 },
  { id: "u3", name: "Aïcha Diallo", role: "Associate", initials: "AD", avatarHue: 280 },
  { id: "u4", name: "Yann Picard", role: "Analyst", initials: "YP", avatarHue: 142 },
  { id: "u5", name: "Claire Volkov", role: "IC Member", initials: "CV", avatarHue: 42 },
];

export const currentUser = team[2]; // Aïcha (Associate) by default
