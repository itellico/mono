import { z } from 'zod';

export interface TestFormInput { 
  name: string;
  email: string;
  age?: number;
};

export const testFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().optional().refine(val => val === undefined || val >= 0, { message: "Age must be a positive number" }),
});