// NEW — Prisma client singleton for POS/inventory
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
