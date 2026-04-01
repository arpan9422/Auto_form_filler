import prisma from "../../config/database";

export const saveFeedbackDb = async (userId: string, data: any) => {
    // return await prisma.feedback.create({ data: { userId, ...data } });
};

export const incrementUsageDb = async (userId: string, weekStart: Date) => {
    // return await prisma.usage.upsert({ ... })
};
