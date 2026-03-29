import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Admin@123", 12);

  // Super Admin
  await prisma.user.upsert({
    where: { email: "superadmin@dfs.com" },
    update: {},
    create: {
      email: "superadmin@dfs.com",
      passwordHash: password,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  // Admin (Supervisor)
  await prisma.user.upsert({
    where: { email: "admin@dfs.com" },
    update: {},
    create: {
      email: "admin@dfs.com",
      passwordHash: password,
      firstName: "Admin",
      lastName: "Supervisor",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  // Compliance User
  await prisma.user.upsert({
    where: { email: "compliance@dfs.com" },
    update: {},
    create: {
      email: "compliance@dfs.com",
      passwordHash: password,
      firstName: "Compliance",
      lastName: "Officer",
      role: "COMPLIANCE",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  // Operations User
  await prisma.user.upsert({
    where: { email: "operations@dfs.com" },
    update: {},
    create: {
      email: "operations@dfs.com",
      passwordHash: password,
      firstName: "Operations",
      lastName: "Manager",
      role: "OPERATIONS",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  console.log("Seed completed!");
  console.log("Default credentials for all users: Admin@123");
  console.log("  - superadmin@dfs.com (Super Admin)");
  console.log("  - admin@dfs.com (Admin Supervisor)");
  console.log("  - compliance@dfs.com (Compliance Officer)");
  console.log("  - operations@dfs.com (Operations Manager)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
