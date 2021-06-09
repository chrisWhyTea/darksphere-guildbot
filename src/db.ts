import { PrismaClient } from "@prisma/client"

export function prisma() {
    const prisma = new PrismaClient()
    return prisma
}