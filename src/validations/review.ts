import { z } from 'zod';

export const reviewSchema = z.object({
  orderId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewSettingsSchema = z.object({
  reviewsEnabled: z.boolean().optional(),
  reviewPopupMaxShows: z.number().int().min(1).max(5).optional(),
  reviewPopupDaysWindow: z.number().int().min(1).max(30).optional(),
  reviewRewardEnabled: z.boolean().optional(),
  reviewRewardType: z.enum(['percentage', 'fixed', 'none']).optional(),
  reviewRewardValue: z.number().min(0).optional(),
  reviewRewardExpiryDays: z.number().int().min(1).max(90).optional(),
});