import { logger } from './logger';
import type { EmailJobData } from '../../workers/email.worker';
import { queueEmailSending } from './workers';

// Email queue configuration has been removed as options are now handled by Temporal workflows.

// Queue an email for processing
export async function queueEmail(
  emailData: EmailJobData, 
): Promise<string> {
  try {
    const jobId = await queueEmailSending({
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      template: 'custom',
      data: {
        html: emailData.html,
        text: emailData.text,
      },
      priority: emailData.priority
    });

    logger.info('Email queued successfully via Temporal', {
      jobId,
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      priority: emailData.priority || 'normal',
    });

    return jobId || 'temporal-job-id-placeholder';

  } catch (error) {
    logger.error('Failed to queue email with Temporal', {
      error: error instanceof Error ? error.message : String(error),
      to: emailData.to,
      subject: emailData.subject
    });
    throw error;
  }
}

// Queue multiple emails in batch
export async function queueEmailBatch(
  emails: Array<{ data: EmailJobData; options?: any }> // options are ignored now
): Promise<string[]> {
  try {
    const jobIds: string[] = [];

    for (const email of emails) {
      const jobId = await queueEmail(email.data); // Pass only data
      jobIds.push(jobId);
    }

    logger.info('Email batch queued successfully', {
      batchSize: emails.length,
      jobIds: jobIds.slice(0, 5) // Log first 5 job IDs
    });

    return jobIds;

  } catch (error) {
    logger.error('Failed to queue email batch', {
      error: error.message,
      batchSize: emails.length
    });
    throw error;
  }
}

// Predefined email templates and functions
export async function queueWelcomeEmail(
  to: string,
  userData: { firstName: string; lastName: string; email: string }
): Promise<string> {
  const emailData: EmailJobData = {
    to,
    subject: 'Welcome to itellico Platform!',
    html: generateWelcomeEmailHtml(userData),
    text: generateWelcomeEmailText(userData),
    priority: 'normal',
    templateId: 'welcome'
  };

  return queueEmail(emailData);
}

export async function queueVerificationEmail(
  to: string,
  verificationData: { firstName: string; verificationLink: string }
): Promise<string> {
  const emailData: EmailJobData = {
    to,
    subject: 'Verify Your Email Address - itellico',
    html: generateVerificationEmailHtml(verificationData),
    text: generateVerificationEmailText(verificationData),
    priority: 'high',
    templateId: 'verification'
  };

  return queueEmail(emailData);
}

export async function queuePasswordResetEmail(
  to: string,
  resetData: { firstName: string; resetLink: string; expiresAt: Date }
): Promise<string> {
  const emailData: EmailJobData = {
    to,
    subject: 'Reset Your Password - itellico',
    html: generatePasswordResetEmailHtml(resetData),
    text: generatePasswordResetEmailText(resetData),
    priority: 'high',
    templateId: 'password_reset'
  };

  return queueEmail(emailData);
}

export async function queueModelApplicationNotification(
  to: string | string[],
  applicationData: {
    applicantName: string;
    applicantEmail: string;
    applicationId: string;
    submittedAt: Date;
    reviewUrl: string;
  }
): Promise<string> {
  const emailData: EmailJobData = {
    to,
    subject: `New Model Application - ${applicationData.applicantName}`,
    html: generateApplicationNotificationEmailHtml(applicationData),
    text: generateApplicationNotificationEmailText(applicationData),
    priority: 'normal',
    templateId: 'application_notification'
  };

  return queueEmail(emailData);
}

export async function queueApplicationStatusEmail(
  to: string,
  statusData: {
    firstName: string;
    status: 'approved' | 'rejected' | 'pending_review';
    reason?: string;
    nextSteps?: string;
  }
): Promise<string> {
  const subject = statusData.status === 'approved' 
    ? 'Application Approved - Welcome to itellico!'
    : statusData.status === 'rejected'
    ? 'Application Update - itellico'
    : 'Application Received - itellico';

  const emailData: EmailJobData = {
    to,
    subject,
    html: generateApplicationStatusEmailHtml(statusData),
    text: generateApplicationStatusEmailText(statusData),
    priority: 'normal',
    templateId: 'application_status'
  };

  return queueEmail(emailData);
}

// Email template generators
function generateWelcomeEmailHtml(userData: { firstName: string; lastName: string; email: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to itellico!</h1>
      </div>

      <div style="padding: 40px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${userData.firstName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Welcome to the itellico platform! We&apos;re excited to have you join our community of talented models and industry professionals.
        </p>

        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          Your account has been successfully created with the email address: <strong>${userData.email}</strong>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you have any questions, please don&apos;t hesitate to contact our support team.
        </p>
      </div>

      <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2025 itellico Platform. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generateWelcomeEmailText(userData: { firstName: string; lastName: string; email: string }): string {
  return `
Welcome to itellico!

Hi ${userData.firstName},

Welcome to the itellico platform! We're excited to have you join our community of talented models and industry professionals.

Your account has been successfully created with the email address: ${userData.email}

Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

If you have any questions, please don't hesitate to contact our support team.

© 2025 itellico Platform. All rights reserved.
  `.trim();
}

function generateVerificationEmailHtml(data: { firstName: string; verificationLink: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; padding: 40px 20px; text-align: center;">
        <h1 style="color: #333; margin: 0; font-size: 24px;">Verify Your Email Address</h1>
      </div>

      <div style="padding: 40px 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          Please click the button below to verify your email address and complete your registration.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" 
             style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you can&apos;t click the button, copy and paste this link into your browser:<br>
          <a href="${data.verificationLink}" style="color: #667eea;">${data.verificationLink}</a>
        </p>
      </div>
    </div>
  `;
}

function generateVerificationEmailText(data: { firstName: string; verificationLink: string }): string {
  return `
Verify Your Email Address

Hello ${data.firstName}!

Please click the link below to verify your email address and complete your registration.

${data.verificationLink}

If you can't click the link, copy and paste it into your browser.
  `.trim();
}

function generatePasswordResetEmailHtml(data: { firstName: string; resetLink: string; expiresAt: Date }): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ffc107; padding: 40px 20px; text-align: center;">
        <h1 style="color: #333; margin: 0; font-size: 24px;">Password Reset Request</h1>
      </div>

      <div style="padding: 40px 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          We received a request to reset your password. Click the button below to choose a new password.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          This link will expire at ${data.expiresAt.toLocaleString()}.
        </p>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you didn&apos;t request this password reset, please ignore this email.
        </p>
      </div>
    </div>
  `;
}

function generatePasswordResetEmailText(data: { firstName: string; resetLink: string; expiresAt: Date }): string {
  return `
Password Reset Request

Hello ${data.firstName}!

We received a request to reset your password. Click the link below to choose a new password.

${data.resetLink}

This link will expire at ${data.expiresAt.toLocaleString()}.

If you didn't request this password reset, please ignore this email.
  `.trim();
}

function generateApplicationNotificationEmailHtml(data: {
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
  submittedAt: Date;
  reviewUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #17a2b8; padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Model Application</h1>
      </div>

      <div style="padding: 40px 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Application Details</h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Applicant:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.applicantName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.applicantEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Application ID:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.applicationId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Submitted:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.submittedAt.toLocaleString()}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.reviewUrl}" 
             style="background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Application
          </a>
        </div>
      </div>
    </div>
  `;
}

function generateApplicationNotificationEmailText(data: {
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
  submittedAt: Date;
  reviewUrl: string;
}): string {
  return `
New Model Application

Application Details:
- Applicant: ${data.applicantName}
- Email: ${data.applicantEmail}
- Application ID: ${data.applicationId}
- Submitted: ${data.submittedAt.toLocaleString()}

Review application: ${data.reviewUrl}
  `.trim();
}

function generateApplicationStatusEmailHtml(data: {
  firstName: string;
  status: 'approved' | 'rejected' | 'pending_review';
  reason?: string;
  nextSteps?: string;
}): string {
  const statusColor = data.status === 'approved' ? '#28a745' : 
                     data.status === 'rejected' ? '#dc3545' : '#ffc107';
  const statusText = data.status === 'approved' ? 'Approved' :
                    data.status === 'rejected' ? 'Not Approved' : 'Under Review';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusColor}; padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Application ${statusText}</h1>
      </div>

      <div style="padding: 40px 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName}!</h2>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          ${data.status === 'approved' 
            ? 'Congratulations! Your model application has been approved.'
            : data.status === 'rejected'
            ? 'Thank you for your interest. After review, we are unable to approve your application at this time.'
            : 'Thank you for submitting your model application. We are currently reviewing it.'
          }
        </p>

        ${data.reason ? `
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Reason:</strong> ${data.reason}
          </p>
        ` : ''}

        ${data.nextSteps ? `
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>Next Steps:</strong> ${data.nextSteps}
          </p>
        ` : ''}

        ${data.status === 'approved' ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateApplicationStatusEmailText(data: {
  firstName: string;
  status: 'approved' | 'rejected' | 'pending_review';
  reason?: string;
  nextSteps?: string;
}): string {
  const statusText = data.status === 'approved' ? 'Approved' :
                    data.status === 'rejected' ? 'Not Approved' : 'Under Review';

  let text = `Application ${statusText}\n\nHello ${data.firstName}!\n\n`;

  if (data.status === 'approved') {
    text += 'Congratulations! Your model application has been approved.';
  } else if (data.status === 'rejected') {
    text += 'Thank you for your interest. After review, we are unable to approve your application at this time.';
  } else {
    text += 'Thank you for submitting your model application. We are currently reviewing it.';
  }

  if (data.reason) {
    text += `\n\nReason: ${data.reason}`;
  }

  if (data.nextSteps) {
    text += `\n\nNext Steps: ${data.nextSteps}`;
  }

  if (data.status === 'approved') {
    text += `\n\nAccess your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  }

  return text;
} 