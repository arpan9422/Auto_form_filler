// Shared constants
export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
  PRO_PLUS: "PRO_PLUS",
} as const;

export const FREE_TIER_LIMIT = 10; // forms per week

export const PRICING = {
  PRO: {
    INR: 299,
    USD: 5,
  },
  PRO_PLUS: {
    INR: 599,
    USD: 10,
  },
} as const;
