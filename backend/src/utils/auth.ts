import crypto from "crypto";

export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const generateReferralCode = (seed?: string) => {
  const normalizedSeed = seed
    ? seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6)
    : "USER";

  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${normalizedSeed}${randomPart}`;
};

export const addDurationToNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000);
