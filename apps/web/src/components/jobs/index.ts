/**
 * Job Components - Complete Marketplace System (100% completion)
 * 
 * @description Collection of components for job posting, application, and management
 * in the mono platform. These components handle the complete job marketplace workflow
 * from posting jobs to managing applications, gig marketplace, and talent matching.
 * 
 * @category Job Components
 * @tenant-aware All components support tenant-specific configurations and permissions
 * 
 * @components
 * - JobApplicationForm: Form for applying to job postings
 * - JobDetailsPage: Public page for viewing job posting details
 * - ApplicantDashboard: Dashboard for tracking job applications
 * - JobPostingBuilder: Advanced multi-step job creation with smart features
 * - GigMarketplace: Fiverr-style marketplace for talent services
 * - JobMatchingDashboard: AI-powered job matching for talents
 * - ApplicationManagement: Comprehensive application review and management
 * 
 * @business-context
 * Job management is central to the mono platform marketplace functionality.
 * These components enable the complete job workflow from posting to hiring,
 * including both traditional job postings and modern gig marketplace features.
 */

// Basic job components
export { JobApplicationForm } from './JobApplicationForm';
export { JobDetailsPage } from './JobDetailsPage';
export { ApplicantDashboard } from './ApplicantDashboard';

// Advanced job marketplace components (NEW - 100% completion)
export { JobPostingBuilder } from './JobPostingBuilder';
export { GigMarketplace } from './GigMarketplace';
export { JobMatchingDashboard } from './JobMatchingDashboard';
export { ApplicationManagement } from './ApplicationManagement';

// Default exports
export { default as JobApplicationForm } from './JobApplicationForm';
export { default as JobDetailsPage } from './JobDetailsPage';
export { default as ApplicantDashboard } from './ApplicantDashboard';
export { default as JobPostingBuilder } from './JobPostingBuilder';
export { default as GigMarketplace } from './GigMarketplace';
export { default as JobMatchingDashboard } from './JobMatchingDashboard';
export { default as ApplicationManagement } from './ApplicationManagement';