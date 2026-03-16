import { z } from 'zod';


// Schema for updating a match
export const matchUpdateSchema = z.object({
  matchId: z.string().uuid({ message: "Invalid match ID format. Must be a UUID." }),
  home_score: z.number().int().min(0, { message: "Home score cannot be negative." }),
  away_score: z.number().int().min(0, { message: "Away score cannot be negative." }),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
});

// Schema for creating a player
export const playerCreateSchema = z.object({
  name: z.string().min(2, { message: "Player name must be at least 2 characters." }),
  team_id: z.string().uuid().nullable().optional(),
  jersey_number: z.number().int().min(0).max(99).optional(),
  position: z.string().min(1, { message: "Position is required." })
});

// Schema for publishing a newsletter
export const newsletterPublishSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  summary: z.string().min(10, { message: "Summary is required." }),
  author: z.string().min(2, { message: "Author name is required." }),
  imageUrl: z.string().url({ message: "Must be a valid URL." }).optional()
});