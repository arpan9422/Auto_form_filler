import { tool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../../../config/database";

// ─── get_user_profile ─────────────────────────────────────────────────────────

export const getUserProfileTool = tool(
  async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        skills: true,
      },
    });

    if (!user) return JSON.stringify({ error: "User not found" });
    return JSON.stringify(user);
  },
  {
    name: "get_user_profile",
    description: "Returns core user identity and profile fields from the database.",
    schema: z.object({ userId: z.string().describe("The authenticated user ID") }),
  }
);

// ─── get_user_links ───────────────────────────────────────────────────────────

export const getUserLinksTool = tool(
  async ({ userId }: { userId: string }) => {
    const links = await prisma.link.findMany({ where: { userId } });
    return JSON.stringify(links);
  },
  {
    name: "get_user_links",
    description: "Returns LinkedIn, GitHub, portfolio, and other links for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_addresses ───────────────────────────────────────────────────────

export const getUserAddressesTool = tool(
  async ({ userId }: { userId: string }) => {
    const addresses = await prisma.address.findMany({ where: { userId } });
    return JSON.stringify(addresses);
  },
  {
    name: "get_user_addresses",
    description: "Returns permanent, current, and other addresses for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_work_history ────────────────────────────────────────────────────

export const getUserWorkHistoryTool = tool(
  async ({ userId }: { userId: string }) => {
    const works = await prisma.work.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    });
    return JSON.stringify(works);
  },
  {
    name: "get_user_work_history",
    description: "Returns sorted work history entries for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_education_history ──────────────────────────────────────────────

export const getUserEducationHistoryTool = tool(
  async ({ userId }: { userId: string }) => {
    const educations = await prisma.education.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    });
    return JSON.stringify(educations);
  },
  {
    name: "get_user_education_history",
    description: "Returns education history entries for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_projects ────────────────────────────────────────────────────────

export const getUserProjectsTool = tool(
  async ({ userId }: { userId: string }) => {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return JSON.stringify(projects);
  },
  {
    name: "get_user_projects",
    description: "Returns project metadata and tech stacks for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_custom_answers ──────────────────────────────────────────────────

export const getUserCustomAnswersTool = tool(
  async ({ userId }: { userId: string }) => {
    const answers = await prisma.answerLibrary.findMany({ where: { userId } });
    return JSON.stringify(answers);
  },
  {
    name: "get_user_custom_answers",
    description: "Returns reusable answer library entries for the user.",
    schema: z.object({ userId: z.string() }),
  }
);

// ─── get_user_resumes ─────────────────────────────────────────────────────────

export const getUserResumesTool = tool(
  async ({ userId }: { userId: string }) => {
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
    return JSON.stringify(resumes);
  },
  {
    name: "get_user_resumes",
    description: "Returns resume metadata including target role, description and default resume pointer.",
    schema: z.object({ userId: z.string() }),
  }
);
