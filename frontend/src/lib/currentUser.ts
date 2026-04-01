import api from "./api";

export type UserLink = {
  id?: string;
  platform: string;
  url: string;
};

export type UserEducation = {
  id?: string;
  instituteName: string;
  degree: string;
  startDate: string;
  endDate?: string | null;
  gpa?: number | null;
};

export type UserWork = {
  id?: string;
  companyName: string;
  position: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "FREELANCE";
  startDate: string;
  endDate?: string | null;
};

export type UserProject = {
  id?: string;
  name: string;
  description: string;
  projectLinks: string[];
  techStacks: string[];
};

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  onboardingDone: boolean;
  links: UserLink[];
  educations: UserEducation[];
  works: UserWork[];
  projects: UserProject[];
};

export type UpdateCurrentUserPayload = {
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
};

export async function getCurrentUser() {
  const response = await api.get<CurrentUser>("/user");
  return response.data;
}

export async function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  const response = await api.put<CurrentUser>("/user", payload);
  return response.data;
}
