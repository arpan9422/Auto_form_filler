import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "AI Form Assistant API",
    version: "1.0.0",
    description:
      "Backend APIs for OTP auth, wallet credits, referrals, and user profile management.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL ?? "http://localhost:5000",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SendOtpRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["email", "otp", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
          firstName: { type: "string" },
          middleName: { type: "string" },
          lastName: { type: "string" },
          referralCode: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      WalletTopupRequest: {
        type: "object",
        required: ["creditsBought", "amountPaid"],
        properties: {
          creditsBought: { type: "integer", example: 120 },
          amountPaid: { type: "integer", example: 199 },
          currency: { type: "string", example: "INR" },
          paymentProvider: { type: "string", example: "razorpay" },
          paymentRef: { type: "string", example: "pay_123" },
        },
      },
      ReferralValidationRequest: {
        type: "object",
        required: ["referralCode"],
        properties: {
          referralCode: { type: "string", example: "ARPANABC123" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          middleName: { type: "string" },
          lastName: { type: "string" },
          phone: { type: "string" },
          bio: { type: "string" },
          skills: {
            type: "array",
            items: { type: "string" },
          },
          onboardingDone: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/api/auth/signup/otp": {
      post: {
        summary: "Send signup OTP",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpRequest" },
            },
          },
        },
        responses: { "200": { description: "Signup OTP sent" } },
      },
    },
    "/api/auth/signup": {
      post: {
        summary: "Create a user with OTP verification",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: { "201": { description: "User created" } },
      },
    },
    "/api/auth/login/otp": {
      post: {
        summary: "Send login OTP",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpRequest" },
            },
          },
        },
        responses: { "200": { description: "Login OTP sent" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login with OTP",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: { "200": { description: "Logged in" } },
      },
    },
    "/api/auth/refresh": {
      post: {
        summary: "Refresh JWT tokens",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: { "200": { description: "Tokens refreshed" } },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout and revoke refresh token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/api/user": {
      get: {
        summary: "Get current user profile",
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile returned" } },
      },
      put: {
        summary: "Update current user profile",
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: { "200": { description: "Profile updated" } },
      },
    },
    "/api/wallet/summary": {
      get: {
        summary: "Get wallet summary",
        tags: ["Wallet"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Wallet summary returned" } },
      },
    },
    "/api/wallet/analytics": {
      get: {
        summary: "Get wallet analytics",
        tags: ["Wallet"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Wallet analytics returned" } },
      },
    },
    "/api/wallet/breakdown": {
      get: {
        summary: "Get wallet credit consumption breakdown",
        tags: ["Wallet"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Wallet breakdown returned" } },
      },
    },
    "/api/wallet/transactions": {
      get: {
        summary: "Get wallet transaction history",
        tags: ["Wallet"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Wallet transactions returned" } },
      },
    },
    "/api/wallet/topup": {
      post: {
        summary: "Top up wallet credits",
        tags: ["Wallet"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WalletTopupRequest" },
            },
          },
        },
        responses: { "200": { description: "Wallet topped up" } },
      },
    },
    "/api/refferals/validate": {
      post: {
        summary: "Validate a referral code",
        tags: ["Referral"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReferralValidationRequest" },
            },
          },
        },
        responses: { "200": { description: "Referral code is valid" } },
      },
    },
    "/api/refferals/me": {
      get: {
        summary: "Get my referral stats",
        tags: ["Referral"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Referral stats returned" } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
