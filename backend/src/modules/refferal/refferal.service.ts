import { AppError } from "../../utils/AppError";
import { Referral } from "../../generated/prisma";
import {
  findReferralCodeOwner,
  getReferralStatsByUserId,
} from "./refferal.repository";

export const validateReferralCodeService = async (referralCode: string) => {
  const owner = await findReferralCodeOwner(referralCode);

  if (!owner) {
    throw new AppError("Referral code is invalid", 404);
  }

  return {
    valid: true,
    referrer: {
      id: owner.id,
      email: owner.email,
      name: `${owner.firstName} ${owner.lastName}`.trim(),
      referralCode: owner.referralCode,
    },
    rewards: {
      referredUserCredits: 100,
      referrerCredits: 150,
    },
  };
};

export const getMyReferralStatsService = async (userId: string) => {
  const user = await getReferralStatsByUserId(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const totalReferralCreditsEarned = user.referralsMade.reduce(
    (total: number, referral: Referral) => total + referral.rewardCreditsToReferrer,
    0
  );

  return {
    referralCode: user.referralCode,
    totalReferrals: user.referralsMade.length,
    totalReferralCreditsEarned,
    referrals: user.referralsMade,
  };
};
