import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Prisma v7 runtime requires a driver adapter for database connectivity.
 * We use `@prisma/adapter-pg` which reads DATABASE_URL from the environment.
 *
 * CLI operations (migrate, studio) are configured separately in prisma.config.ts.
 */
const createPrismaClient = (): PrismaClient => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
};

export const prisma: PrismaClient =
    globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
