import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { LogAction, LogType, UserType } from "@app/commons";
import _ from "lodash";
import pMap from "p-map";
import moment from "moment";

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
      type: UserType.ADMIN,
      approved: true,
    },
  });

  console.log("Seeded", {
    ...admin,
    password: "adminpass",
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
      type: UserType.USER,
      approved: true,
    },
  });

  await prisma.lot.deleteMany();

  await pMap(_.range(40), async () => {
    let reference: number | undefined = undefined;
    let type: LogType | undefined = undefined;
    const action = _.shuffle([
      LogAction.ENTER,
      LogAction.EXIT,
      LogAction.OCCUPIED,
      LogAction.VACANT,
    ])[0];
    if (action === LogAction.ENTER || action === LogAction.EXIT) {
      reference = user.id;
      type = LogType.USER;
    } else {
      const lots = await prisma.lot.findMany();
      if (lots.length) {
        reference = _.shuffle(lots)[0].id;
        type = LogType.DEVICE;
      }
    }

    if (reference !== undefined && type) {
      const log = await prisma.log.create({
        data: {
          action,
          reference,
          type,
          createdAt: moment()
            .add(_.random(-2, 2), "days")
            .add(_.random(-12, 12), "hours")
            .add(_.random(-60, 60), "minutes")
            .toDate(),
        },
      });

      console.log("Seeded Log", log);
    }
  });

  console.log("Seeded", {
    ...user,
    password: "customerpass",
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
