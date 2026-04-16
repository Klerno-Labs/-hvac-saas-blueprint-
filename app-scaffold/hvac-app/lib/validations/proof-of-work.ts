import { z } from 'zod'

export const recordProofOfWorkSchema = z.object({
  workSummary: z.string().min(1, 'Summary of work performed is required').max(5000),
  materialsUsed: z.string().max(2000).optional().or(z.literal('')),
  completionNotes: z.string().max(2000).optional().or(z.literal('')),
  technicianName: z.string().max(100).optional().or(z.literal('')),
})

export type RecordProofOfWorkInput = z.infer<typeof recordProofOfWorkSchema>
