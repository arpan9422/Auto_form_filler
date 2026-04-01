import prisma from "../../config/database";

export const getUserById = async (id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: {
      links: true,
      educations: true,
      works: true,
      answers: true,
      resumes: true,
      projects: true,
    },
  });

export const updateUserById = async (
  id: string,
  data: {
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
) =>
  prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      skills: data.skills,
      onboardingDone: data.onboardingDone,
      links: data.links
        ? {
            deleteMany: {},
            create: data.links.map((link) => ({
              platform: link.platform,
              url: link.url,
            })),
          }
        : undefined,
      educations: data.educations
        ? {
            deleteMany: {},
            create: data.educations.map((education) => ({
              instituteName: education.instituteName,
              degree: education.degree,
              startDate: new Date(education.startDate),
              endDate: education.endDate ? new Date(education.endDate) : null,
              gpa: education.gpa,
            })),
          }
        : undefined,
      works: data.works
        ? {
            deleteMany: {},
            create: data.works.map((work) => ({
              companyName: work.companyName,
              position: work.position,
              type: work.type,
              startDate: new Date(work.startDate),
              endDate: work.endDate ? new Date(work.endDate) : null,
            })),
          }
        : undefined,
      projects: data.projects
        ? {
            deleteMany: {},
            create: data.projects.map((project) => ({
              name: project.name,
              description: project.description,
              projectLinks: project.projectLinks ?? [],
              techStacks: project.techStacks ?? [],
            })),
          }
        : undefined,
    },
    include: {
      links: true,
      educations: true,
      works: true,
      answers: true,
      resumes: true,
      projects: true,
    },
  });
