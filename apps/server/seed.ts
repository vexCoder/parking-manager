import { PrismaClient } from "@prisma/client";
import argon2 from 'argon2'
import {UserType} from 'commons'

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await argon2.hash("adminpass");
  const reference = Math.random().toString(36).substring(2, 12);

  const admin = await prisma.user.upsert({
    where: { username: "adminuser" },
    update: {},
    create: {
      username: "adminuser",
      password: hashedPassword,
      reference,
      type: UserType.ADMIN
    },
  });
  
  console.log("Seeded", {
    ...admin,
    password: "adminpass"
  });

  const hashedUserPassword = await argon2.hash("customerpass");
  const referenceUser = Math.random().toString(36).substring(2, 12);

  const user = await prisma.user.upsert({
    where: { username: "customer" },
    update: {},
    create: {
      username: "customer",
      password: hashedUserPassword,
      reference: referenceUser,
      type: UserType.USER
    },
  });
  
  console.log("Seeded", {
    ...user,
    password: "customerpass"
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
