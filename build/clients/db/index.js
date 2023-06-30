"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaCLient = void 0;
const client_1 = require("@prisma/client");
exports.prismaCLient = new client_1.PrismaClient({ log: ["query"] });
