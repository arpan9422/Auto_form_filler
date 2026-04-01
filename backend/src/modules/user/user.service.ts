import { AppError } from "../../utils/AppError";
import { getUserById, updateUserById } from "./user.repository";
import { scheduleUserKnowledgeSync } from "../ai/rag.service";

export const getUserProfileService = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUserProfileService = async (
  userId: string,
  updateData: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    skills?: string[];
    onboardingDone?: boolean;
    links?: Array<{
      platform: string;
      url: string;
    }>;
    educations?: Array<{
      instituteName: string;
      degree: string;
      startDate: string;
      endDate?: string;
      gpa?: number;
    }>;
    works?: Array<{
      companyName: string;
      position: string;
      type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "FREELANCE";
      startDate: string;
      endDate?: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      projectLinks?: string[];
      techStacks?: string[];
    }>;
  }
) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await updateUserById(userId, updateData);
  scheduleUserKnowledgeSync(userId);

  return updatedUser;
};

export const completeUserOnboardingService = async (
  userId: string,
  onboardingData: Parameters<typeof updateUserProfileService>[1]
) => {
  // Onboarding writes to the same user profile tables, then queues a Pinecone refresh
  // so the newly provided portfolio, skills, education, work, and project data become searchable.
  return updateUserProfileService(userId, {
    ...onboardingData,
    onboardingDone: true,
  });
};
