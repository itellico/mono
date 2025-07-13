import { logger } from '@/lib/logger';

/**
 * Example activities for Temporal workflows
 * These represent the actual work that gets done (database operations, API calls, etc.)
 */

export async function greetUser(userId: string): Promise<string> {
  logger.info(`Greeting user: ${userId}`);
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return `Hello, user ${userId}!`;
}

export async function processModelProfile(
  profileId: string, 
  action: string
): Promise<string> {
  logger.info(`Processing profile ${profileId} with action: ${action}`);
  
  // Simulate database operation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In real implementation, this would:
  // - Update database records
  // - Call external APIs
  // - Process files
  // - Send emails
  
  return `Profile ${profileId} processed with action: ${action}`;
}

export async function sendNotification(
  userId: string,
  type: string,
  data: Record<string, any>
): Promise<void> {
  logger.info(`Sending notification to ${userId}:`, { type, data });
  
  // Simulate notification sending
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // In real implementation, this would:
  // - Send email via SendGrid/Mailgun
  // - Send push notification
  // - Create in-app notification
  // - Log to audit trail
} 