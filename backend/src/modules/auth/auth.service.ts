import {
  OtpPurpose,
  TransactionReason,
  TransactionType,
} from "../../generated/prisma";
import {
  createOtpCode,
  createUser,
  findRefreshToken,
  findUserByEmail,
  findUserByReferralCode,
  findValidOtp,
  invalidateOtpCodes,
  markOtpAsUsed,
  revokeRefreshToken,
  runInTransaction,
  storeRefreshToken,
} from "./auth.repository";
import { addDurationToNow, generateOtp, generateReferralCode } from "../../utils/auth";
import { sendOtpEmail } from "../../utils/brevo";
import { AppError } from "../../utils/AppError";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import {
  createCreditTransactionEntry,
  creditUserWallet,
} from "../wallet/wallet.repository";
import {
  createReferralRecord,
  findReferralByReferredEmail,
} from "../refferal/refferal.repository";
import { scheduleUserKnowledgeSync } from "../ai/rag.service";

const OTP_EXPIRY_MINUTES = 10;
const REFERRAL_REWARD_TO_SIGNUP_USER = 100;
const REFERRAL_REWARD_TO_REFERRER = 150;

const buildAuthResponse = async (userId: string, email: string, tx?: Parameters<typeof storeRefreshToken>[1]) => {
  // Access tokens stay short-lived, while refresh tokens are persisted so they can be rotated and revoked.
  const accessToken = signAccessToken(userId, email);
  const refreshToken = signRefreshToken(userId, email);
  const decodedRefresh = verifyRefreshToken(refreshToken) as typeof verifyRefreshToken extends (...args: never[]) => infer T ? T & { exp?: number } : { exp?: number };
  const refreshExpiry =
    decodedRefresh.exp !== undefined
      ? new Date(decodedRefresh.exp * 1000)
      : addDurationToNow(60 * 24 * 7);

  await storeRefreshToken(
    {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry,
    },
    tx
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const sendSignupOtpService = async (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const otp = generateOtp();
  await invalidateOtpCodes(normalizedEmail, OtpPurpose.SIGNUP);
  await createOtpCode({
    email: normalizedEmail,
    otp,
    purpose: OtpPurpose.SIGNUP,
    expiresAt: addDurationToNow(OTP_EXPIRY_MINUTES),
  });
  await sendOtpEmail(normalizedEmail, otp, "signup");

  return {
    message: "Signup OTP sent successfully",
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

export const signupService = async (payload: {
  email: string;
  otp: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  referralCode?: string;
}) => {
  const normalizedEmail = payload.email.toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const otpRecord = await findValidOtp(normalizedEmail, payload.otp, OtpPurpose.SIGNUP);
  if (!otpRecord) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const referringUser =
    payload.referralCode?.trim()
      ? await findUserByReferralCode(payload.referralCode.trim())
      : null;

  if (payload.referralCode && !referringUser) {
    throw new AppError("Referral code is invalid", 400);
  }

  const existingReferral = await findReferralByReferredEmail(normalizedEmail);
  if (existingReferral) {
    throw new AppError("Referral code has already been used for this email", 409);
  }

  const result = await runInTransaction(async tx => {
    const user = await createUser(
      {
        email: normalizedEmail,
        firstName: payload.firstName.trim(),
        middleName: payload.middleName?.trim(),
        lastName: payload.lastName.trim(),
        referralCode: generateReferralCode(payload.firstName),
      },
      tx
    );

    await markOtpAsUsed(otpRecord.id, tx);

    if (referringUser) {
      // Referral rewards are applied inside the same transaction so user creation and credits stay consistent.
      await creditUserWallet(
        user.id,
        REFERRAL_REWARD_TO_SIGNUP_USER,
        tx
      );
      await createCreditTransactionEntry(
        {
          userId: user.id,
          type: TransactionType.CREDIT,
          amount: REFERRAL_REWARD_TO_SIGNUP_USER,
          reason: TransactionReason.REFERRAL_BONUS,
          metadata: {
            referralCode: referringUser.referralCode,
            rewardFor: "signup",
          },
        },
        tx
      );

      await creditUserWallet(
        referringUser.id,
        REFERRAL_REWARD_TO_REFERRER,
        tx
      );
      await createCreditTransactionEntry(
        {
          userId: referringUser.id,
          type: TransactionType.CREDIT,
          amount: REFERRAL_REWARD_TO_REFERRER,
          reason: TransactionReason.REFERRAL_BONUS,
          metadata: {
            referredEmail: normalizedEmail,
            referredUserId: user.id,
          },
        },
        tx
      );

      await createReferralRecord(
        {
          referrerId: referringUser.id,
          referredUserId: user.id,
          referredEmail: normalizedEmail,
          referralCode: referringUser.referralCode,
          referredByCode: referringUser.referralCode,
          rewardCredits: 10,
          rewardCreditsToReferrer: REFERRAL_REWARD_TO_REFERRER,
          rewardCreditsToReferred: REFERRAL_REWARD_TO_SIGNUP_USER,
        },
        tx
      );
    }

    const tokens = await buildAuthResponse(user.id, user.email, tx);

    return {
      user,
      ...tokens,
    };
  });

  scheduleUserKnowledgeSync(result.user.id);

  return {
    message: "Signup successful",
    ...result,
  };
};

export const sendLoginOtpService = async (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (!existingUser) {
    throw new AppError("No account found with this email", 404);
  }

  const otp = generateOtp();
  await invalidateOtpCodes(normalizedEmail, OtpPurpose.LOGIN);
  await createOtpCode({
    email: normalizedEmail,
    otp,
    purpose: OtpPurpose.LOGIN,
    expiresAt: addDurationToNow(OTP_EXPIRY_MINUTES),
  });
  await sendOtpEmail(normalizedEmail, otp, "login");

  return {
    message: "Login OTP sent successfully",
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

export const loginService = async (payload: { email: string; otp: string }) => {
  const normalizedEmail = payload.email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (!existingUser) {
    throw new AppError("No account found with this email", 404);
  }

  const otpRecord = await findValidOtp(normalizedEmail, payload.otp, OtpPurpose.LOGIN);
  if (!otpRecord) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const tokens = await runInTransaction(async tx => {
    await markOtpAsUsed(otpRecord.id, tx);
    return buildAuthResponse(existingUser.id, existingUser.email, tx);
  });

  return {
    message: "Login successful",
    user: existingUser,
    ...tokens,
  };
};

export const refreshAccessTokenService = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  const storedToken = await findRefreshToken(hashToken(refreshToken));
  if (!storedToken) {
    throw new AppError("Refresh token is invalid or expired", 401);
  }

  // Rotate refresh tokens on every refresh request so a stolen old token cannot be reused indefinitely.
  await revokeRefreshToken(hashToken(refreshToken));

  const tokens = await buildAuthResponse(storedToken.user.id, storedToken.user.email);

  return {
    message: "Token refreshed successfully",
    user: storedToken.user,
    ...tokens,
  };
};

export const logoutService = async (refreshToken: string) => {
  await revokeRefreshToken(hashToken(refreshToken));

  return {
    message: "Logged out successfully",
  };
};
