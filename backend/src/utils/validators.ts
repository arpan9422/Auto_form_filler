import { z } from "zod";

const emailSchema = z.string().trim().email();

export const sendSignupOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const signupSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z.string().trim().length(6),
    firstName: z.string().trim().min(1),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1),
    referralCode: z.string().trim().optional(),
  }),
});

export const sendLoginOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z.string().trim().length(6),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(1),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(1),
  }),
});

export const referralCodeValidationSchema = z.object({
  body: z.object({
    referralCode: z.string().trim().min(4),
  }),
});

export const topupWalletSchema = z.object({
  body: z.object({
    creditsBought: z.number().int().positive(),
    amountPaid: z.number().int().positive(),
    currency: z.string().trim().default("INR"),
    paymentProvider: z.string().trim().optional(),
    paymentRef: z.string().trim().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    skills: z.array(z.string().trim()).optional(),
    onboardingDone: z.boolean().optional(),
    links: z
      .array(
        z.object({
          platform: z.string().trim().min(1),
          url: z.string().trim().min(1),
        })
      )
      .optional(),
    educations: z
      .array(
        z.object({
          instituteName: z.string().trim().min(1),
          degree: z.string().trim().min(1),
          startDate: z.string().trim().min(1),
          endDate: z.string().trim().optional(),
          gpa: z.number().min(0).max(10).optional(),
        })
      )
      .optional(),
    works: z
      .array(
        z.object({
          companyName: z.string().trim().min(1),
          position: z.string().trim().min(1),
          type: z.enum(["INTERNSHIP", "FULL_TIME", "PART_TIME", "FREELANCE"]),
          startDate: z.string().trim().min(1),
          endDate: z.string().trim().optional(),
        })
      )
      .optional(),
    projects: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          description: z.string().trim().min(1),
          projectLinks: z.array(z.string().trim().min(1)).optional(),
          techStacks: z.array(z.string().trim()).optional(),
        })
      )
      .optional(),
  }),
});

export const projectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    projectLinks: z.array(z.string().trim().min(1)).default([]),
    techStacks: z.array(z.string().trim().min(1)).default([]),
  }),
});

export const customAnswerSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1),
    category: z.string().trim().min(1),
    answer: z.string().trim().min(1),
  }),
});

export const resumeSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1),
    target: z.string().trim().optional(),
    description: z.string().trim().optional(),
    pdfUrl: z.string().trim().min(1),
    isDefault: z.boolean().optional(),
  }),
});

export const memorySchema = z.object({
  body: z.object({
    type: z.enum(["PERSONAL", "PROJECT", "ANSWER", "RESUME", "PREFERENCE", "CUSTOM"]),
    value: z.string().trim().min(1),
  }),
});

export const generateSchema = z.object({
  body: z.object({
    fields: z.array(
      z.object({
        label: z.string(),
        placeholder: z.string().optional(),
        name: z.string().optional(),
        type: z.string().optional(),
      })
    ),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    formState: z.record(z.string()),
  }),
});

export const feedbackSchema = z.object({
  body: z.object({
    field: z.string(),
    aiAnswer: z.string(),
    userEdit: z.string(),
  }),
});
