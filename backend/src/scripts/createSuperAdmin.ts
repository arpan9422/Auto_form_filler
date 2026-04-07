/**
 * Run once to create the first Super Admin:
 *   npx ts-node src/scripts/createSuperAdmin.ts
 */
import dotenv from "dotenv";
dotenv.config();

import prisma from "../config/database";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

  if (!email) {
    console.error("Set SUPER_ADMIN_EMAIL in .env before running this script");
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email} (${existing.role})`);
    process.exit(0);
  }

  const admin = await prisma.admin.create({
    data: { email, name, role: "SUPER_ADMIN" },
  });

  console.log(`✅ Super Admin created: ${admin.email} (id: ${admin.id})`);
  console.log("Login at POST /api/admin/auth/otp with this email.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
