import openai from "../../config/openai";
import { getUserById } from "../user/user.repository";

interface FormField {
  id?: string;
  label: string;
  placeholder?: string;
  name?: string;
  type?: string;
  tag?: string;
  inputType?: string;
  required?: boolean;
  options?: string[];
  selector?: string;
  formId?: string;
  role?: string;
}

type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserById>>>;

// Generate initial form fill answers
export async function generateFormFillService(fields: FormField[], userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    return {};
  }

  const sortedWorks = [...user.works].sort((a, b) => {
    const aTime = a.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return bTime - aTime;
  });
  const sortedEducations = [...user.educations].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );
  const sortedProjects = [...user.projects].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const currentWork = sortedWorks[0];
  const latestEducation = sortedEducations[0];
  const latestProject = sortedProjects[0];

  const answers: Record<string, string> = {};

  for (const field of fields) {
    const key = field.selector || field.name || field.label || field.id;
    if (!key) continue;

    const value = resolveFieldValue(field, user, currentWork, latestEducation, latestProject);
    if (!value) continue;

    answers[key] = matchOptionValue(value, field.options);
  }

  return answers;
}

// Chat-based refinement
export async function chatRefineService(
  userId: string,
  message: string,
  formState: Record<string, string>
) {
  const { inferRelevantChunkTypes, queryContext } = await import("./rag.service");
  const retrievalSeed = `${message}\n${Object.keys(formState).join(". ")}`;
  const contextChunks = await queryContext(retrievalSeed, userId, {
    topK: 6,
    types: inferRelevantChunkTypes(retrievalSeed),
  });
  const context = contextChunks.join("\n\n");

  const prompt = `You are an AI form assistant.

Relevant User Context:
${context}

Current Form Data:
${JSON.stringify(formState, null, 2)}

User Instruction:
${message}

Update ONLY the necessary fields.

Return JSON:
{
  "fieldName": "updated value"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}


export async function submitFeedbackService(userId: string, data: any) {
  return { userId, data };
}

function resolveFieldValue(
  field: FormField,
  user: UserProfile,
  currentWork?: UserProfile["works"][number],
  latestEducation?: UserProfile["educations"][number],
  latestProject?: UserProfile["projects"][number]
): string {
  const fieldText = normalizeText(
    [field.label, field.name, field.placeholder, field.type, field.inputType]
      .filter(Boolean)
      .join(" ")
  );

  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const skills = Array.isArray(user.skills)
    ? user.skills.map((skill) => String(skill)).filter(Boolean)
    : [];
  const linkedin = findLink(user.links, ["linkedin"]);
  const github = findLink(user.links, ["github"]);
  const portfolio = findLink(user.links, ["portfolio", "website", "personal", "site"]);
  const permanentAddress = findAddress(user, "PERMANENT");
  const currentAddress = findAddress(user, "CURRENT");
  const otherAddress = findAddress(user, "OTHER");
  const preferredAddress = permanentAddress ?? currentAddress ?? otherAddress;

  if (
    matches(fieldText, ["permanent address", "permanent street address", "home address"])
  ) {
    return formatAddress(permanentAddress);
  }
  if (
    matches(fieldText, ["current address", "present address", "mailing address", "local address"])
  ) {
    return formatAddress(currentAddress ?? preferredAddress);
  }
  if (matches(fieldText, ["other address", "secondary address"])) {
    return formatAddress(otherAddress ?? preferredAddress);
  }
  if (matches(fieldText, ["full address", "complete address"])) {
    return formatAddress(preferredAddress);
  }
  if (matches(fieldText, ["address line 1", "street address", "street"])) {
    return preferredAddress?.line1 ?? "";
  }
  if (matches(fieldText, ["address line 2", "apartment", "suite", "landmark"])) {
    return preferredAddress?.line2 ?? "";
  }
  if (matches(fieldText, ["city", "town"])) return preferredAddress?.city ?? "";
  if (matches(fieldText, ["state", "province", "region"])) return preferredAddress?.state ?? "";
  if (matches(fieldText, ["zip", "zipcode", "postal code", "pincode"])) {
    return preferredAddress?.postalCode ?? "";
  }
  if (matches(fieldText, ["country", "nation"])) return preferredAddress?.country ?? "";

  if (matches(fieldText, ["first name", "firstname", "given name"])) return user.firstName;
  if (matches(fieldText, ["middle name", "middlename"])) return user.middleName ?? "";
  if (matches(fieldText, ["last name", "lastname", "surname", "family name"])) return user.lastName;
  if (matches(fieldText, ["full name", "your name", "legal name"])) return fullName;
  if (matches(fieldText, ["email", "email address"])) return user.email;
  if (matches(fieldText, ["phone", "mobile", "contact number", "phone number"])) return user.phone ?? "";
  if (matches(fieldText, ["about", "bio", "summary", "about me", "professional summary"])) return user.bio ?? "";
  if (matches(fieldText, ["skill", "skills", "tech stack", "technologies"])) return skills.join(", ");
  if (matches(fieldText, ["linkedin", "linkedin url", "linkedin profile"])) return linkedin;
  if (matches(fieldText, ["github", "github url", "github profile"])) return github;
  if (matches(fieldText, ["portfolio", "website", "personal website", "portfolio url"])) return portfolio;
  if (matches(fieldText, ["company", "current company", "employer", "organization"])) {
    return currentWork?.companyName ?? "";
  }
  if (matches(fieldText, ["job title", "title", "position", "role", "current role"])) {
    return currentWork?.position ?? "";
  }
  if (matches(fieldText, ["college", "university", "school", "institute"])) {
    return latestEducation?.instituteName ?? "";
  }
  if (matches(fieldText, ["degree", "qualification", "education"])) {
    return latestEducation?.degree ?? "";
  }
  if (matches(fieldText, ["gpa", "cgpa", "grade"])) {
    return latestEducation?.gpa != null ? String(latestEducation.gpa) : "";
  }
  if (matches(fieldText, ["project name", "project"])) {
    return latestProject?.name ?? "";
  }
  if (matches(fieldText, ["project description", "project summary"])) {
    return latestProject?.description ?? "";
  }

  const customAnswer = findCustomAnswer(user.answers, fieldText);
  if (customAnswer) return customAnswer;

  if (fieldText.includes("name")) return fullName;
  if (fieldText.includes("email")) return user.email;
  if (fieldText.includes("phone")) return user.phone ?? "";
  if (fieldText.includes("linkedin")) return linkedin;
  if (fieldText.includes("github")) return github;
  if (fieldText.includes("portfolio") || fieldText.includes("website")) return portfolio;
  if (fieldText.includes("address")) return formatAddress(preferredAddress);
  if (fieldText.includes("city")) return preferredAddress?.city ?? "";
  if (fieldText.includes("state")) return preferredAddress?.state ?? "";
  if (fieldText.includes("zip") || fieldText.includes("postal")) return preferredAddress?.postalCode ?? "";
  if (fieldText.includes("country")) return preferredAddress?.country ?? "";
  if (fieldText.includes("skill")) return skills.join(", ");
  if (fieldText.includes("bio") || fieldText.includes("summary")) return user.bio ?? "";

  return "";
}

function matchOptionValue(value: string, options?: string[]) {
  if (!options?.length || !value.trim()) return value;

  const normalizedValue = normalizeText(value);
  const exact = options.find((option) => normalizeText(option) === normalizedValue);
  if (exact) return exact;

  const partial = options.find((option) => {
    const normalizedOption = normalizeText(option);
    return (
      normalizedOption.includes(normalizedValue) || normalizedValue.includes(normalizedOption)
    );
  });

  return partial ?? value;
}

function findLink(
  links: UserProfile["links"],
  keywords: string[]
) {
  const match = links.find((link) => {
    const haystack = normalizeText(`${link.platform} ${link.url}`);
    return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
  });

  return match?.url ?? "";
}

function findCustomAnswer(
  answers: UserProfile["answers"],
  fieldText: string
) {
  if (!fieldText) return "";

  const match = answers.find((answer) => {
    const haystack = normalizeText(`${answer.title} ${answer.category}`);
    return haystack.includes(fieldText) || fieldText.includes(haystack);
  });

  return match?.answer ?? "";
}

function matches(fieldText: string, keywords: string[]) {
  return keywords.some((keyword) => fieldText.includes(normalizeText(keyword)));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function findAddress(user: UserProfile, type: "PERMANENT" | "CURRENT" | "OTHER") {
  return user.addresses.find((address) => address.type === type);
}

function formatAddress(address?: UserProfile["addresses"][number]) {
  if (!address) return "";

  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");
}
