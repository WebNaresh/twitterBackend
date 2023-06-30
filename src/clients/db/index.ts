import { PrismaClient } from "@prisma/client";
export const prismaCLient = new PrismaClient({ log: ["query"] });
