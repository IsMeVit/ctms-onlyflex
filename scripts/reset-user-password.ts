import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const nextPassword = process.argv[3];

  if (!email || !nextPassword) {
    throw new Error("Usage: reset-user-password <email> <newPassword>");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const hashedPassword = await bcrypt.hash(nextPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
