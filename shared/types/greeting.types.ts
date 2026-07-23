import { z } from 'zod';

export const GreetingSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    text: z.string(),
    createdAt: z.any().optional(),
});

export type Greeting = z.infer<typeof GreetingSchema>;

export type CreateGreetingDTO = Omit<Greeting, 'id' | 'createdAt' | 'userId'>;
