# itellico Mono Academy System - Comprehensive Guide

## 🚀 Overview

The itellico Mono Academy System is a basic Learning Management System (LMS) designed specifically for educating models and professionals within the platform ecosystem. It provides course creation, progress tracking, certificates, and career path guidance while integrating seamlessly with the blog system for enhanced learning experiences.

## 📋 Table of Contents

- [System Philosophy](#system-philosophy)
- [Database Architecture](#database-architecture)
- [Course Management](#course-management)
- [Learning Paths & Career Models](#learning-paths--career-models)
- [Blog Integration](#blog-integration)
- [Certificate System](#certificate-system)
- [Progress Tracking](#progress-tracking)
- [Admin Interface](#admin-interface)
- [Student Interface](#student-interface)
- [API Endpoints](#api-endpoints)
- [Integration with itellico Mono](#integration-with-mono-platform)
- [Implementation Guide](#implementation-guide)

---

## 🎯 System Philosophy

### Design Principles

**"Simple, Focused, Integrated"**

1. **Not a Full LMS**: Focus exclusively on educating models and professionals
2. **Career-Oriented**: Learning paths aligned with platform opportunities
3. **Blog-Integrated**: Required reading from blog articles enhances courses
4. **Achievement-Based**: Clear progression with certificates and recognition
5. **Tenant-Scoped**: Complete isolation for tenant-specific educational content
6. **Performance-Focused**: Fast, efficient learning experiences

### What's Included
- ✅ Course creation and management
- ✅ Lesson structuring with multimedia support
- ✅ Blog article integration as required reading
- ✅ Progress tracking and analytics
- ✅ Certificate generation and management
- ✅ Career path modeling
- ✅ Quiz and assessment system
- ✅ Student dashboard and profiles
- ✅ Instructor tools and analytics

### What's NOT Included (Keeping It Simple)
- ❌ Advanced video conferencing
- ❌ Complex assignment workflows
- ❌ Peer-to-peer collaboration tools
- ❌ Advanced grading systems
- ❌ Marketplace functionality
- ❌ Third-party course integration

---

## 💾 Database Architecture

### Core Models

#### AcademyCourse Model
```typescript
model AcademyCourse {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int
  slug            String           @db.VarChar(200)
  title           String           @db.VarChar(255)
  description     String           @db.Text
  shortDescription String?         @db.VarChar(255)
  
  // Course Structure
  level           CourseLevel      @default(BEGINNER)
  estimatedHours  Int?
  prerequisiteIds Json?            // Array of required course UUIDs
  learningPath    String?          @db.VarChar(100)
  maxEnrollments  Int?             // Optional enrollment limit
  
  // Content & Resources
  introVideo      String?          // Video URL/ID
  syllabus        Json             // Course outline with lesson structure
  resources       Json?            // Additional resources and downloads
  featuredImage   String?          // Course thumbnail
  
  // Instructor Information
  instructorIds   Json             // Array of instructor user IDs
  instructorNotes String?          @db.Text
  
  // Status & Publishing
  status          CourseStatus     @default(DRAFT)
  publishedAt     DateTime?
  createdBy       Int
  lastUpdated     DateTime         @updatedAt
  
  // Pricing (Optional)
  isFree          Boolean          @default(true)
  price           Decimal?         @db.Decimal(10, 2)
  currency        String?          @default("USD") @db.VarChar(3)
  
  // SEO & Discovery
  seoTitle        String?          @db.VarChar(60)
  metaDescription String?          @db.VarChar(160)
  keywords        Json?            // SEO keywords array
  language        String           @default("en") @db.VarChar(5)
  
  // Analytics & Performance
  enrollmentCount Int              @default(0)
  completionRate  Float?           @default(0)
  averageRating   Float?           @default(0)
  totalRatings    Int              @default(0)
  
  // Relationships
  creator         User             @relation("CourseCreator", fields: [createdBy], references: [id])
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  categories      CourseCategory[] @relation("CourseCategoryRelation")
  tags            EntityTag[]      // Reuse existing tag system
  lessons         AcademyLesson[]
  enrollments     CourseEnrollment[]
  certificates    CourseCertificate[]
  prerequisites   AcademyCourse[]  @relation("CoursePrerequisites")
  dependents      AcademyCourse[]  @relation("CoursePrerequisites")
  reviews         CourseReview[]
  
  @@unique([tenantId, slug])
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE  
  ADVANCED
  EXPERT
}

enum CourseStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}
```

#### AcademyLesson Model
```typescript
model AcademyLesson {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId        Int
  order           Int
  title           String           @db.VarChar(255)
  content         String           @db.Text
  contentType     String           @default("markdown") // markdown, html, video, interactive
  
  // Lesson Requirements & Structure
  requiredReading Json?            // Required blog articles with UUIDs
  estimatedTime   Int?             // Minutes
  hasQuiz         Boolean          @default(false)
  passingScore    Int?             // Percentage for quiz
  isOptional      Boolean          @default(false)
  
  // Media & Resources
  videoUrl        String?
  videoThumbnail  String?
  videoDuration   Int?             // Seconds
  audioUrl        String?
  downloadFiles   Json?            // File attachments array
  externalLinks   Json?            // External resource links
  
  // Interactive Elements
  interactiveElements Json?        // Interactive components config
  practiceExercises   Json?        // Hands-on exercises
  
  // Progress & Analytics
  isPublished     Boolean          @default(false)
  viewCount       Int              @default(0)
  avgCompletionTime Float?         // Average time to complete
  avgRating       Float?
  
  // Relationships
  course          AcademyCourse    @relation(fields: [courseId], references: [id])
  progress        LessonProgress[]
  quizzes         LessonQuiz[]
  blogLinks       LessonBlogLink[] // Links to required blog articles
  
  @@unique([courseId, order])
}
```

#### Course Enrollments & Progress
```typescript
model CourseEnrollment {
  id              Int              @id @default(autoincrement())
  tenantId        Int
  courseId        Int
  userId          Int
  enrolledAt      DateTime         @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  certificateIssued Boolean        @default(false)
  
  // Progress Tracking
  currentLessonId Int?
  progressPercent Float            @default(0)
  totalTimeSpent  Int              @default(0) // Minutes
  lastAccessedAt  DateTime?
  
  // Performance Metrics
  quizScores      Json?            // Individual quiz scores
  overallScore    Float?           // Overall course score
  attempts        Int              @default(1)
  
  // Engagement
  rating          Int?             // 1-5 star rating
  review          String?          @db.Text
  reviewDate      DateTime?
  
  // Relationships
  course          AcademyCourse    @relation(fields: [courseId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  lessonProgress  LessonProgress[]
  certificate     CourseCertificate?
  
  @@unique([courseId, userId])
}
```

#### Lesson Progress Tracking
```typescript
model LessonProgress {
  id              Int              @id @default(autoincrement())
  enrollmentId    Int
  lessonId        Int
  status          LessonStatus     @default(NOT_STARTED)
  startedAt       DateTime?
  completedAt     DateTime?
  timeSpent       Int              @default(0) // Minutes
  quizScore       Float?
  quizAttempts    Int              @default(0)
  requiredReadingComplete Boolean  @default(false)
  
  // Video Progress (if applicable)
  videoProgress   Float?           @default(0) // 0-1 (percentage watched)
  videoBookmarks  Json?            // Saved video timestamps
  
  // Notes & Feedback
  studentNotes    String?          @db.Text
  instructorFeedback String?       @db.Text
  
  enrollment      CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  lesson          AcademyLesson    @relation(fields: [lessonId], references: [id])
  
  @@unique([enrollmentId, lessonId])
}

enum LessonStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

#### Blog Article Integration
```typescript
model LessonBlogLink {
  id              Int              @id @default(autoincrement())
  lessonId        Int
  blogPostId      Int
  isRequired      Boolean          @default(true)
  readingOrder    Int?
  estimatedTime   Int?             // Reading time in minutes
  
  // Link Configuration
  linkText        String?          @db.VarChar(255) // Custom link text
  description     String?          @db.Text         // Why this article is relevant
  quizQuestions   Json?            // Questions based on this article
  
  lesson          AcademyLesson    @relation(fields: [lessonId], references: [id])
  blogPost        BlogPost         @relation(fields: [blogPostId], references: [id])
  
  @@unique([lessonId, blogPostId])
}
```

#### Quiz System
```typescript
model LessonQuiz {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lessonId        Int
  title           String           @db.VarChar(255)
  instructions    String?          @db.Text
  
  // Quiz Configuration
  questions       Json             // Array of question objects
  passingScore    Int              @default(70) // Percentage
  maxAttempts     Int              @default(3)
  timeLimit       Int?             // Minutes (null = unlimited)
  shuffleQuestions Boolean         @default(false)
  shuffleAnswers  Boolean          @default(false)
  
  // Feedback & Grading
  showCorrectAnswers Boolean       @default(true)
  showScoreAfter  Boolean          @default(true)
  allowReview     Boolean          @default(true)
  
  lesson          AcademyLesson    @relation(fields: [lessonId], references: [id])
  attempts        QuizAttempt[]
  
  @@unique([lessonId])
}

model QuizAttempt {
  id              Int              @id @default(autoincrement())
  quizId          Int
  userId          Int
  enrollmentId    Int
  attemptNumber   Int
  
  // Attempt Data
  startedAt       DateTime         @default(now())
  completedAt     DateTime?
  timeSpent       Int?             // Seconds
  answers         Json             // User's answers
  score           Float?           // Percentage score
  passed          Boolean          @default(false)
  
  quiz            LessonQuiz       @relation(fields: [quizId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  enrollment      CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  
  @@unique([quizId, userId, attemptNumber])
}
```

#### Certificate System
```typescript
model CourseCertificate {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  enrollmentId    Int              @unique
  certificateNumber String         @unique
  issuedAt        DateTime         @default(now())
  validUntil      DateTime?
  
  // Certificate Data
  certificateData Json             // Template and custom data
  templateId      String?          // Certificate template used
  verificationUrl String?          // Public verification URL
  
  // Blockchain/NFT Integration (Future)
  blockchainHash  String?          @unique
  nftTokenId      String?
  
  enrollment      CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  
  @@index([certificateNumber])
}
```

#### Career Models & Learning Paths
```typescript
model CareerModel {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int
  title           String           @db.VarChar(255)
  description     String           @db.Text
  targetRole      String           @db.VarChar(100)
  estimatedPath   Json             // Steps and milestones with timeframes
  
  // Requirements & Structure
  requiredCourses Json             // Array of required course UUIDs
  optionalCourses Json?            // Array of optional course UUIDs
  skillRequirements Json           // Required skills and competencies
  experienceLevel String           @db.VarChar(50)
  estimatedMonths Int?             // Expected completion time
  
  // Visual & Branding
  iconUrl         String?
  bannerImage     String?
  color           String?          // Hex color for branding
  
  // SEO & Discovery
  seoTitle        String?          @db.VarChar(60)
  metaDescription String?          @db.VarChar(160)
  keywords        Json?
  
  // Analytics
  enrollmentCount Int              @default(0)
  completionRate  Float?           @default(0)
  averageTime     Int?             // Average completion time in months
  
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  userPaths       UserCareerPath[]
  categories      CareerCategory[]
  
  @@unique([tenantId, title])
}

model UserCareerPath {
  id              Int              @id @default(autoincrement())
  userId          Int
  careerModelId   Int
  startedAt       DateTime         @default(now())
  currentStep     Int              @default(0)
  completedSteps  Json             @default("[]")
  targetDate      DateTime?
  completedAt     DateTime?
  
  // Progress Tracking
  progressPercent Float            @default(0)
  milestonesCompleted Json         @default("[]")
  skillsAcquired  Json             @default("[]")
  
  // Goal Setting
  personalGoals   Json?            // User-defined goals
  mentorNotes     String?          @db.Text
  
  user            User             @relation(fields: [userId], references: [id])
  careerModel     CareerModel      @relation(fields: [careerModelId], references: [id])
  
  @@unique([userId, careerModelId])
}

model CareerCategory {
  id              Int              @id @default(autoincrement())
  uuid            String           @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        Int
  name            String           @db.VarChar(100)
  description     String?
  iconUrl         String?
  
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  careerModels    CareerModel[]
  
  @@unique([tenantId, name])
}
```

#### Course Reviews & Ratings
```typescript
model CourseReview {
  id              Int              @id @default(autoincrement())
  courseId        Int
  userId          Int
  enrollmentId    Int
  rating          Int              // 1-5 stars
  review          String?          @db.Text
  isPublic        Boolean          @default(true)
  isVerified      Boolean          @default(false) // Verified completion
  reviewDate      DateTime         @default(now())
  
  // Helpful votes
  helpfulVotes    Int              @default(0)
  totalVotes      Int              @default(0)
  
  course          AcademyCourse    @relation(fields: [courseId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  enrollment      CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  
  @@unique([courseId, userId])
}
```

---

## 📚 Course Management

### Course Structure

#### Course Creation Workflow
```typescript
interface CourseCreationData {
  basicInfo: {
    title: string;
    description: string;
    shortDescription: string;
    level: CourseLevel;
    estimatedHours: number;
    language: string;
  };
  content: {
    syllabus: CourseSyllabus;
    introVideo?: string;
    featuredImage?: string;
    resources?: CourseResource[];
  };
  structure: {
    lessons: LessonPlan[];
    prerequisites: string[]; // Course UUIDs
    learningPath?: string;
  };
  settings: {
    isFree: boolean;
    price?: number;
    maxEnrollments?: number;
    autoEnroll: boolean;
  };
  seo: {
    seoTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

interface CourseSyllabus {
  modules: CourseModule[];
  totalLessons: number;
  totalDuration: number; // Minutes
  learningObjectives: string[];
  targetAudience: string[];
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: string[]; // Lesson UUIDs
  estimatedTime: number;
  objectives: string[];
}

interface LessonPlan {
  title: string;
  content: string;
  contentType: string;
  estimatedTime: number;
  hasQuiz: boolean;
  requiredReading: string[]; // Blog post UUIDs
  resources: LessonResource[];
  videoUrl?: string;
  interactiveElements?: any[];
}

interface LessonResource {
  type: 'download' | 'link' | 'video' | 'audio';
  title: string;
  url: string;
  description?: string;
  size?: number; // For downloads
}
```

### Content Management

#### Lesson Content Types
```typescript
enum LessonContentType {
  MARKDOWN = "markdown",
  HTML = "html", 
  VIDEO = "video",
  INTERACTIVE = "interactive",
  QUIZ_ONLY = "quiz_only",
  READING_LIST = "reading_list"
}

interface InteractiveElement {
  type: 'code_editor' | 'image_annotation' | 'drag_drop' | 'simulation';
  config: Record<string, any>;
  validation?: ValidationRule[];
  feedback?: string;
}

interface ValidationRule {
  type: string;
  condition: any;
  message: string;
}
```

#### Video Management
```typescript
interface VideoLessonData {
  videoUrl: string;
  thumbnail: string;
  duration: number; // Seconds
  chapters?: VideoChapter[];
  transcripts?: VideoTranscript[];
  subtitles?: VideoSubtitle[];
  watchSpeed: number[]; // Available playback speeds
  allowDownload: boolean;
}

interface VideoChapter {
  title: string;
  startTime: number; // Seconds
  endTime: number;
  description?: string;
}

interface VideoTranscript {
  language: string;
  content: TranscriptSegment[];
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}
```

---

## 🛤️ Learning Paths & Career Models

### Career Path Structure

```typescript
interface CareerPathDefinition {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  
  // Path Structure
  phases: CareerPhase[];
  estimatedDuration: number; // Months
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Requirements
  prerequisites: {
    experience?: string[];
    education?: string[];
    skills?: string[];
    portfolio?: string[];
  };
  
  // Outcomes
  learningOutcomes: string[];
  careerOpportunities: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface CareerPhase {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedWeeks: number;
  
  // Phase Content
  requiredCourses: string[]; // Course UUIDs
  optionalCourses: string[];
  requiredReading: string[]; // Blog post UUIDs
  practicalProjects: Project[];
  
  // Milestones
  milestones: Milestone[];
  completionCriteria: CompletionCriteria;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'course_completion' | 'skill_assessment' | 'project_submission' | 'portfolio_review';
  requirements: any;
  points: number; // Gamification
}

interface CompletionCriteria {
  minimumScore: number; // Percentage
  requiredMilestones: string[];
  portfolioSubmission: boolean;
  peerReview: boolean;
}
```

### Skill Assessment System

```typescript
interface SkillAssessment {
  id: string;
  skillName: string;
  assessmentType: 'quiz' | 'practical' | 'portfolio' | 'peer_review';
  
  // Assessment Configuration
  questions?: AssessmentQuestion[];
  practicalTasks?: PracticalTask[];
  portfolioRequirements?: PortfolioRequirement[];
  
  // Scoring
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number; // Minutes
  
  // Feedback
  feedbackRules: FeedbackRule[];
  improvementSuggestions: string[];
}

interface PracticalTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  deliverables: string[];
  evaluationCriteria: EvaluationCriterion[];
  timeLimit?: number; // Hours
}

interface EvaluationCriterion {
  criterion: string;
  weight: number; // Percentage
  rubric: RubricLevel[];
}

interface RubricLevel {
  level: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement';
  description: string;
  points: number;
}
```

---

## 📖 Blog Integration

### Required Reading System

```typescript
interface RequiredReadingConfiguration {
  lessonId: string;
  blogPosts: RequiredBlogPost[];
  readingOrder: 'sequential' | 'any_order';
  completionTracking: boolean;
  quizIntegration: boolean;
}

interface RequiredBlogPost {
  blogPostId: string;
  isRequired: boolean;
  readingOrder?: number;
  estimatedTime: number; // Minutes
  
  // Integration Settings
  linkText?: string;
  contextualDescription: string;
  relatedQuizQuestions: string[];
  
  // Progress Tracking
  trackingMethod: 'time_based' | 'scroll_based' | 'quiz_based';
  minimumTime?: number; // Minimum reading time
  minimumScroll?: number; // Percentage of article
}
```

### Content Interlinking Service

```typescript
class ContentInterlinkingService {
  // Find related academy courses for blog posts
  async findRelatedCourses(blogPostId: string, tenantId: number): Promise<RelatedCourse[]> {
    const blogPost = await this.getBlogPost(blogPostId);
    const keywords = await this.extractKeywords(blogPost.content);
    
    const relatedCourses = await this.db.academyCourse.findMany({
      where: {
        tenantId,
        status: 'PUBLISHED',
        OR: [
          { keywords: { path: '$', array_contains: keywords } },
          { description: { search: keywords.join(' | ') } },
          { tags: { some: { tag: { name: { in: keywords } } } } }
        ]
      },
      include: { enrollments: { take: 1 } },
      take: 5
    });
    
    return relatedCourses.map(course => ({
      courseId: course.uuid,
      title: course.title,
      level: course.level,
      estimatedHours: course.estimatedHours,
      relevanceScore: this.calculateRelevanceScore(blogPost, course),
      enrollmentCount: course.enrollmentCount
    }));
  }
  
  // Find related blog posts for course lessons
  async findRelatedBlogPosts(lessonId: string, tenantId: number): Promise<RelatedBlogPost[]> {
    const lesson = await this.getLesson(lessonId);
    const course = await this.getCourse(lesson.courseId);
    
    const keywords = [
      ...await this.extractKeywords(lesson.content),
      ...await this.extractKeywords(course.description)
    ];
    
    const relatedPosts = await this.db.blogPost.findMany({
      where: {
        tenantId,
        status: 'PUBLISHED',
        OR: [
          { content: { search: keywords.join(' | ') } },
          { tags: { some: { tag: { name: { in: keywords } } } } },
          { categories: { some: { name: { in: [course.learningPath] } } } }
        ]
      },
      include: { 
        author: { include: { profile: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { publishedAt: 'desc' },
      take: 10
    });
    
    return relatedPosts.map(post => ({
      postId: post.uuid,
      title: post.title,
      excerpt: post.excerpt,
      readingTime: post.readingTime,
      publishedAt: post.publishedAt,
      relevanceScore: this.calculateRelevanceScore(lesson, post),
      url: `/blog/${post.slug}`
    }));
  }
  
  private calculateRelevanceScore(source: any, target: any): number {
    // Implement content similarity algorithm
    // Consider factors like shared keywords, categories, tags, etc.
    return 0.85; // Placeholder
  }
}
```

### Cross-Content Recommendations

```typescript
interface ContentRecommendation {
  type: 'course' | 'blog_post' | 'career_path';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  reasoning: string[];
  
  // Metadata
  difficulty?: string;
  estimatedTime?: number;
  popularity: number;
  
  // Context
  recommendationContext: 'related_content' | 'next_step' | 'prerequisite' | 'advanced';
}

class RecommendationEngine {
  async generateRecommendations(
    userId: string, 
    contentId: string, 
    contentType: 'course' | 'lesson' | 'blog_post'
  ): Promise<ContentRecommendation[]> {
    const userProfile = await this.getUserLearningProfile(userId);
    const contentAnalysis = await this.analyzeContent(contentId, contentType);
    
    const recommendations: ContentRecommendation[] = [];
    
    // Add related courses
    const relatedCourses = await this.findRelatedCourses(contentAnalysis);
    recommendations.push(...relatedCourses);
    
    // Add blog articles
    const relatedPosts = await this.findRelatedBlogPosts(contentAnalysis);
    recommendations.push(...relatedPosts);
    
    // Add career paths
    const careerPaths = await this.findRelevantCareerPaths(userProfile, contentAnalysis);
    recommendations.push(...careerPaths);
    
    // Sort by relevance and user preferences
    return this.rankRecommendations(recommendations, userProfile);
  }
}
```

---

## 🏆 Certificate System

### Certificate Templates

```typescript
interface CertificateTemplate {
  id: string;
  name: string;
  type: 'course_completion' | 'career_path' | 'skill_certification';
  
  // Design
  templateUrl: string; // Base template image/SVG
  layout: CertificateLayout;
  branding: CertificateBranding;
  
  // Content Fields
  fields: CertificateField[];
  
  // Validation
  verificationEnabled: boolean;
  blockchainEnabled: boolean;
  nftEnabled: boolean;
}

interface CertificateLayout {
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  backgroundColor: string;
  backgroundImage?: string;
  
  // Field Positions
  fieldPositions: {
    [fieldName: string]: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      alignment: 'left' | 'center' | 'right';
      fontSize: number;
      fontFamily: string;
      fontColor: string;
    };
  };
}

interface CertificateBranding {
  tenantLogo: string;
  platformLogo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface CertificateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'image' | 'qr_code' | 'signature';
  required: boolean;
  defaultValue?: string;
  validation?: string; // Regex pattern
}
```

### Certificate Generation

```typescript
class CertificateGenerator {
  async generateCertificate(
    enrollmentId: number,
    templateId: string
  ): Promise<GeneratedCertificate> {
    const enrollment = await this.getEnrollmentData(enrollmentId);
    const template = await this.getCertificateTemplate(templateId);
    
    // Generate unique certificate number
    const certificateNumber = await this.generateCertificateNumber(enrollment.tenantId);
    
    // Prepare certificate data
    const certificateData = {
      studentName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
      courseName: enrollment.course.title,
      completionDate: enrollment.completedAt,
      issueDate: new Date(),
      certificateNumber,
      instructorName: await this.getInstructorName(enrollment.course),
      tenantName: enrollment.tenant.name,
      verificationUrl: `${this.getBaseUrl()}/verify/${certificateNumber}`,
      grade: enrollment.overallScore ? `${Math.round(enrollment.overallScore)}%` : 'Pass'
    };
    
    // Generate certificate image
    const certificateImage = await this.renderCertificate(template, certificateData);
    
    // Create database record
    const certificate = await this.db.courseCertificate.create({
      data: {
        enrollmentId,
        certificateNumber,
        certificateData,
        templateId,
        verificationUrl: certificateData.verificationUrl
      }
    });
    
    // Optional: Generate NFT or blockchain record
    if (template.nftEnabled || template.blockchainEnabled) {
      await this.createBlockchainRecord(certificate);
    }
    
    return {
      certificate,
      imageUrl: certificateImage,
      downloadUrl: await this.generateDownloadUrl(certificate.uuid)
    };
  }
  
  private async generateCertificateNumber(tenantId: number): Promise<string> {
    const prefix = 'CERT';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${tenantId}-${random}`;
  }
  
  private async renderCertificate(
    template: CertificateTemplate, 
    data: Record<string, any>
  ): Promise<string> {
    // Use a library like Puppeteer or Canvas to generate certificate image
    // This is a simplified implementation
    const canvas = this.createCanvas(template.layout.width, template.layout.height);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    if (template.layout.backgroundImage) {
      await this.drawBackgroundImage(ctx, template.layout.backgroundImage);
    } else {
      ctx.fillStyle = template.layout.backgroundColor;
      ctx.fillRect(0, 0, template.layout.width, template.layout.height);
    }
    
    // Draw fields
    for (const field of template.fields) {
      const position = template.layout.fieldPositions[field.name];
      const value = data[field.name] || field.defaultValue || '';
      
      ctx.font = `${position.fontSize}px ${position.fontFamily}`;
      ctx.fillStyle = position.fontColor;
      ctx.textAlign = position.alignment as CanvasTextAlign;
      
      if (field.type === 'qr_code') {
        await this.drawQRCode(ctx, position, value);
      } else {
        ctx.fillText(value, position.x, position.y);
      }
    }
    
    // Return image URL or base64
    return canvas.toDataURL('image/png');
  }
}
```

### Certificate Verification

```typescript
class CertificateVerificationService {
  async verifyCertificate(certificateNumber: string): Promise<CertificateVerificationResult> {
    const certificate = await this.db.courseCertificate.findUnique({
      where: { certificateNumber },
      include: {
        enrollment: {
          include: {
            user: { include: { profile: true } },
            course: true,
            tenant: true
          }
        }
      }
    });
    
    if (!certificate) {
      return { isValid: false, error: 'Certificate not found' };
    }
    
    // Check validity period
    if (certificate.validUntil && certificate.validUntil < new Date()) {
      return { isValid: false, error: 'Certificate has expired' };
    }
    
    // Verify blockchain record if applicable
    if (certificate.blockchainHash) {
      const blockchainValid = await this.verifyBlockchainRecord(certificate.blockchainHash);
      if (!blockchainValid) {
        return { isValid: false, error: 'Blockchain verification failed' };
      }
    }
    
    return {
      isValid: true,
      certificate: {
        number: certificate.certificateNumber,
        studentName: `${certificate.enrollment.user.firstName} ${certificate.enrollment.user.lastName}`,
        courseName: certificate.enrollment.course.title,
        issueDate: certificate.issuedAt,
        completionDate: certificate.enrollment.completedAt,
        tenantName: certificate.enrollment.tenant.name,
        grade: certificate.enrollment.overallScore ? `${Math.round(certificate.enrollment.overallScore)}%` : 'Pass'
      }
    };
  }
}

interface CertificateVerificationResult {
  isValid: boolean;
  certificate?: {
    number: string;
    studentName: string;
    courseName: string;
    issueDate: Date;
    completionDate: Date;
    tenantName: string;
    grade: string;
  };
  error?: string;
}
```

---

## 📊 Progress Tracking

### Learning Analytics

```typescript
interface LearningAnalytics {
  userId: string;
  
  // Overall Progress
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalCertificatesEarned: number;
  totalLearningTime: number; // Minutes
  
  // Performance Metrics
  averageCompletionRate: number; // Percentage
  averageCourseScore: number;
  averageQuizScore: number;
  strongestSubjects: string[];
  improvementAreas: string[];
  
  // Engagement Metrics
  dailyLearningStreak: number;
  weeklyLearningGoal: number; // Minutes
  weeklyLearningActual: number;
  lastActivityDate: Date;
  
  // Career Progress
  activeCareerPaths: number;
  completedCareerPaths: number;
  skillsAcquired: string[];
  nextMilestones: Milestone[];
  
  // Recommendations
  recommendedCourses: string[];
  recommendedBlogPosts: string[];
  suggestedLearningGoals: LearningGoal[];
}

interface LearningGoal {
  type: 'course_completion' | 'skill_acquisition' | 'career_milestone' | 'learning_time';
  target: any;
  deadline: Date;
  progress: number; // 0-1
  motivation: string;
}
```

### Progress Visualization

```typescript
interface ProgressVisualization {
  // Course Progress
  courseProgress: {
    courseId: string;
    title: string;
    progressPercent: number;
    lessonsCompleted: number;
    totalLessons: number;
    timeSpent: number;
    estimatedTimeRemaining: number;
    nextLesson?: {
      id: string;
      title: string;
      estimatedTime: number;
    };
  }[];
  
  // Career Path Progress
  careerPathProgress: {
    pathId: string;
    title: string;
    currentPhase: number;
    totalPhases: number;
    phaseProgress: number;
    overallProgress: number;
    milestonesCompleted: number;
    totalMilestones: number;
    estimatedCompletion: Date;
  }[];
  
  // Skill Development
  skillProgress: {
    skillName: string;
    currentLevel: number; // 1-5
    progress: number; // Progress towards next level
    sourceActivities: string[]; // Courses/lessons that contributed
    lastImprovement: Date;
  }[];
  
  // Learning Streaks
  learningStreaks: {
    dailyStreak: number;
    weeklyStreak: number;
    monthlyStreak: number;
    longestStreak: number;
    streakHistory: StreakData[];
  };
}

interface StreakData {
  date: Date;
  minutesLearned: number;
  activitiesCompleted: number;
  goalMet: boolean;
}
```

### Adaptive Learning System

```typescript
class AdaptiveLearningEngine {
  async generatePersonalizedPath(
    userId: string,
    goals: LearningGoal[]
  ): Promise<PersonalizedLearningPath> {
    const userProfile = await this.getUserLearningProfile(userId);
    const performanceData = await this.getUserPerformanceData(userId);
    
    // Analyze learning patterns
    const learningStyle = this.analyzeLearningStyle(performanceData);
    const strengths = this.identifyStrengths(performanceData);
    const weaknesses = this.identifyWeaknesses(performanceData);
    
    // Generate adaptive recommendations
    const recommendations = await this.generateAdaptiveRecommendations(
      userProfile,
      learningStyle,
      strengths,
      weaknesses,
      goals
    );
    
    return {
      userId,
      learningStyle,
      recommendedPath: recommendations,
      adaptiveElements: {
        pacing: this.recommendPacing(learningStyle),
        contentTypes: this.recommendContentTypes(learningStyle),
        assessmentFrequency: this.recommendAssessmentFrequency(performanceData),
        reviewSchedule: this.generateReviewSchedule(weaknesses)
      },
      nextReviewDate: this.calculateNextReview(userId)
    };
  }
  
  private analyzeLearningStyle(performanceData: any): LearningStyle {
    // Analyze user's interaction patterns to determine learning style
    const videoEngagement = performanceData.videoCompletionRate;
    const readingEngagement = performanceData.readingCompletionRate;
    const quizPerformance = performanceData.averageQuizScore;
    const practicalPerformance = performanceData.practicalTaskScore;
    
    if (videoEngagement > 0.8) return 'visual';
    if (readingEngagement > 0.8) return 'reading';
    if (practicalPerformance > quizPerformance) return 'kinesthetic';
    return 'balanced';
  }
}

type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'balanced';

interface PersonalizedLearningPath {
  userId: string;
  learningStyle: LearningStyle;
  recommendedPath: CourseRecommendation[];
  adaptiveElements: {
    pacing: 'fast' | 'medium' | 'slow';
    contentTypes: string[];
    assessmentFrequency: number; // Days between assessments
    reviewSchedule: ReviewSchedule[];
  };
  nextReviewDate: Date;
}
```

---

## 🖥️ Admin Interface

### Course Management Dashboard

```typescript
const CourseManagementDashboard = () => {
  return (
    <div className="course-management-dashboard">
      {/* Dashboard Header */}
      <DashboardHeader>
        <h1>Academy Management</h1>
        <div className="actions">
          <Button onClick={() => navigate('/academy/courses/new')}>
            Create Course
          </Button>
          <Button variant="outline" onClick={() => navigate('/academy/analytics')}>
            Analytics
          </Button>
        </div>
      </DashboardHeader>
      
      {/* Key Metrics */}
      <MetricsGrid>
        <MetricCard
          title="Total Courses"
          value={academyStats.totalCourses}
          change={academyStats.coursesGrowth}
          icon="BookOpen"
        />
        <MetricCard
          title="Active Enrollments"
          value={academyStats.activeEnrollments}
          change={academyStats.enrollmentGrowth}
          icon="Users"
        />
        <MetricCard
          title="Completion Rate"
          value={`${academyStats.completionRate}%`}
          change={academyStats.completionGrowth}
          icon="Award"
          target={80}
        />
        <MetricCard
          title="Avg. Course Rating"
          value={academyStats.averageRating}
          change={academyStats.ratingGrowth}
          icon="Star"
          format="rating"
        />
      </MetricsGrid>
      
      {/* Course Overview */}
      <div className="course-overview">
        <div className="course-list">
          <CourseDataTable
            courses={courses}
            onCourseEdit={handleCourseEdit}
            onCourseDelete={handleCourseDelete}
            onCoursePublish={handleCoursePublish}
          />
        </div>
        
        <div className="quick-actions">
          <QuickActionPanel>
            <QuickActionCard
              title="Draft Courses"
              count={draftCoursesCount}
              action="Review Drafts"
              onClick={() => navigate('/academy/courses?status=draft')}
            />
            <QuickActionCard
              title="Pending Reviews"
              count={pendingReviewsCount}
              action="Review Submissions"
              onClick={() => navigate('/academy/reviews')}
            />
            <QuickActionCard
              title="Low Completion"
              count={lowCompletionCount}
              action="Improve Courses"
              onClick={() => navigate('/academy/analytics?filter=low-completion')}
            />
          </QuickActionPanel>
        </div>
      </div>
    </div>
  );
};
```

### Course Builder Interface

```typescript
const CourseBuilder = () => {
  const [currentCourse, setCurrentCourse] = useState<AcademyCourse>();
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson>();
  const [builderMode, setBuilderMode] = useState<'overview' | 'lessons' | 'settings'>('overview');
  
  return (
    <div className="course-builder">
      {/* Builder Toolbar */}
      <BuilderToolbar>
        <div className="course-info">
          <h2>{currentCourse?.title || 'New Course'}</h2>
          <CourseStatusBadge status={currentCourse?.status} />
          <ProgressIndicator 
            current={completedSteps} 
            total={totalSteps}
            labels={stepLabels}
          />
        </div>
        
        <div className="actions">
          <Button variant="outline" onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <PublishButton 
            course={currentCourse}
            onPublish={handlePublish}
          />
        </div>
      </BuilderToolbar>
      
      {/* Navigation */}
      <BuilderNavigation>
        <NavTabs value={builderMode} onValueChange={setBuilderMode}>
          <NavTab value="overview" icon="Info">Course Overview</NavTab>
          <NavTab value="lessons" icon="BookOpen">Lessons & Content</NavTab>
          <NavTab value="settings" icon="Settings">Settings & SEO</NavTab>
        </NavTabs>
      </BuilderNavigation>
      
      {/* Content Area */}
      <div className="builder-content">
        {builderMode === 'overview' && (
          <CourseOverviewEditor
            course={currentCourse}
            onChange={handleCourseUpdate}
          />
        )}
        
        {builderMode === 'lessons' && (
          <div className="lessons-builder">
            <LessonsList
              lessons={currentCourse?.lessons || []}
              selectedLesson={selectedLesson}
              onLessonSelect={setSelectedLesson}
              onLessonAdd={handleLessonAdd}
              onLessonDelete={handleLessonDelete}
              onLessonReorder={handleLessonReorder}
            />
            
            <LessonEditor
              lesson={selectedLesson}
              course={currentCourse}
              onChange={handleLessonUpdate}
            />
          </div>
        )}
        
        {builderMode === 'settings' && (
          <CourseSettingsEditor
            course={currentCourse}
            onChange={handleCourseUpdate}
          />
        )}
      </div>
    </div>
  );
};
```

### Lesson Editor

```typescript
const LessonEditor = ({ lesson, course, onChange }) => {
  const [editorMode, setEditorMode] = useState<'content' | 'quiz' | 'resources' | 'reading'>('content');
  
  return (
    <div className="lesson-editor">
      <div className="lesson-header">
        <div className="lesson-info">
          <Input
            value={lesson?.title || ''}
            onChange={(title) => onChange({ ...lesson, title })}
            placeholder="Lesson title..."
            className="lesson-title-input"
          />
          <div className="lesson-meta">
            <EstimatedTimeInput
              value={lesson?.estimatedTime}
              onChange={(estimatedTime) => onChange({ ...lesson, estimatedTime })}
            />
            <LessonTypeSelector
              value={lesson?.contentType}
              onChange={(contentType) => onChange({ ...lesson, contentType })}
            />
          </div>
        </div>
      </div>
      
      <Tabs value={editorMode} onValueChange={setEditorMode}>
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reading">Required Reading</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <LessonContentEditor
            lesson={lesson}
            onChange={onChange}
          />
        </TabsContent>
        
        <TabsContent value="reading">
          <RequiredReadingEditor
            lesson={lesson}
            tenantId={course?.tenantId}
            onChange={onChange}
          />
        </TabsContent>
        
        <TabsContent value="quiz">
          <QuizEditor
            lesson={lesson}
            onChange={onChange}
          />
        </TabsContent>
        
        <TabsContent value="resources">
          <LessonResourcesEditor
            lesson={lesson}
            onChange={onChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Required Reading Integration

```typescript
const RequiredReadingEditor = ({ lesson, tenantId, onChange }) => {
  const [availablePosts, setAvailablePosts] = useState<BlogPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<RequiredBlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="required-reading-editor">
      <div className="reading-header">
        <h3>Required Reading</h3>
        <p>Select blog articles that students must read before completing this lesson.</p>
      </div>
      
      {/* Blog Post Search */}
      <div className="blog-post-search">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search blog articles..."
        />
        <BlogPostFilters
          onFilterChange={handleFilterChange}
        />
      </div>
      
      {/* Available Posts */}
      <div className="available-posts">
        <h4>Available Articles</h4>
        <BlogPostList
          posts={availablePosts}
          onPostSelect={handlePostAdd}
          selectedPosts={selectedPosts.map(p => p.blogPostId)}
        />
      </div>
      
      {/* Selected Posts */}
      <div className="selected-posts">
        <h4>Required Reading List</h4>
        <DragDropProvider onReorder={handlePostReorder}>
          {selectedPosts.map((post, index) => (
            <RequiredReadingItem
              key={post.blogPostId}
              post={post}
              order={index}
              onUpdate={handlePostUpdate}
              onRemove={handlePostRemove}
            />
          ))}
        </DragDropProvider>
        
        {selectedPosts.length === 0 && (
          <EmptyState
            icon="BookOpen"
            title="No required reading"
            description="Add blog articles to enhance this lesson"
          />
        )}
      </div>
      
      {/* Reading Configuration */}
      <div className="reading-config">
        <FormField label="Reading Order">
          <Select
            value={lesson.readingOrder}
            onValueChange={(value) => onChange({ ...lesson, readingOrder: value })}
          >
            <SelectItem value="sequential">Sequential (must read in order)</SelectItem>
            <SelectItem value="any_order">Any order</SelectItem>
          </Select>
        </FormField>
        
        <FormField label="Completion Tracking">
          <Checkbox
            checked={lesson.trackReadingCompletion}
            onCheckedChange={(checked) => onChange({ ...lesson, trackReadingCompletion: checked })}
          />
          <Label>Track reading completion before allowing lesson progress</Label>
        </FormField>
      </div>
    </div>
  );
};
```

---

## 🎓 Student Interface

### Student Dashboard

```typescript
const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: learningAnalytics } = useQuery(['learning-analytics', user.id], 
    () => fetchLearningAnalytics(user.id)
  );
  
  return (
    <div className="student-dashboard">
      {/* Welcome Section */}
      <WelcomeSection>
        <h1>Welcome back, {user.firstName}!</h1>
        <LearningStreakBadge streak={learningAnalytics?.dailyLearningStreak} />
        <LearningGoalProgress 
          goal={learningAnalytics?.weeklyLearningGoal}
          progress={learningAnalytics?.weeklyLearningActual}
        />
      </WelcomeSection>
      
      {/* Continue Learning */}
      <ContinueLearningSection>
        <h2>Continue Learning</h2>
        <div className="current-courses">
          {learningAnalytics?.courseProgress?.map(course => (
            <CourseProgressCard
              key={course.courseId}
              course={course}
              onContinue={() => navigate(`/academy/courses/${course.courseId}/continue`)}
            />
          ))}
        </div>
      </ContinueLearningSection>
      
      {/* Career Progress */}
      <CareerProgressSection>
        <h2>Career Progress</h2>
        <div className="career-paths">
          {learningAnalytics?.careerPathProgress?.map(path => (
            <CareerPathCard
              key={path.pathId}
              path={path}
              onViewPath={() => navigate(`/academy/career-paths/${path.pathId}`)}
            />
          ))}
        </div>
      </CareerProgressSection>
      
      {/* Achievements */}
      <AchievementsSection>
        <h2>Recent Achievements</h2>
        <AchievementsList achievements={learningAnalytics?.recentAchievements} />
      </AchievementsSection>
      
      {/* Recommendations */}
      <RecommendationsSection>
        <h2>Recommended for You</h2>
        <RecommendationGrid 
          recommendations={learningAnalytics?.recommendedCourses}
          type="course"
        />
        <RecommendationGrid 
          recommendations={learningAnalytics?.recommendedBlogPosts}
          type="blog_post"
        />
      </RecommendationsSection>
    </div>
  );
};
```

### Course Player Interface

```typescript
const CoursePlayer = () => {
  const { courseId } = useParams();
  const [currentLesson, setCurrentLesson] = useState<AcademyLesson>();
  const [showSidebar, setShowSidebar] = useState(true);
  
  return (
    <div className="course-player">
      {/* Course Header */}
      <CoursePlayerHeader>
        <CourseTitle course={course} />
        <ProgressBar 
          progress={enrollmentProgress}
          total={course.lessons.length}
        />
        <PlayerControls
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleNotes={handleToggleNotes}
          onToggleTranscript={handleToggleTranscript}
        />
      </CoursePlayerHeader>
      
      <div className="player-content">
        {/* Lesson Sidebar */}
        {showSidebar && (
          <LessonSidebar>
            <LessonList
              lessons={course.lessons}
              currentLesson={currentLesson}
              userProgress={lessonProgress}
              onLessonSelect={setCurrentLesson}
            />
          </LessonSidebar>
        )}
        
        {/* Main Content Area */}
        <div className="lesson-content">
          {currentLesson?.contentType === 'video' && (
            <VideoPlayer
              lesson={currentLesson}
              onProgress={handleVideoProgress}
              onComplete={handleLessonComplete}
            />
          )}
          
          {currentLesson?.contentType === 'markdown' && (
            <MarkdownRenderer
              content={currentLesson.content}
              onComplete={handleLessonComplete}
            />
          )}
          
          {/* Required Reading Section */}
          {currentLesson?.requiredReading?.length > 0 && (
            <RequiredReadingSection
              readings={currentLesson.requiredReading}
              completedReadings={completedReadings}
              onReadingComplete={handleReadingComplete}
            />
          )}
          
          {/* Lesson Quiz */}
          {currentLesson?.hasQuiz && (
            <LessonQuizSection
              lesson={currentLesson}
              onQuizComplete={handleQuizComplete}
            />
          )}
          
          {/* Navigation */}
          <LessonNavigation
            currentLesson={currentLesson}
            canProceed={canProceedToNext}
            onPrevious={handlePreviousLesson}
            onNext={handleNextLesson}
          />
        </div>
        
        {/* Notes Panel */}
        <NotesPanel
          lesson={currentLesson}
          notes={studentNotes}
          onNotesUpdate={handleNotesUpdate}
        />
      </div>
    </div>
  );
};
```

### Required Reading Integration

```typescript
const RequiredReadingSection = ({ readings, completedReadings, onReadingComplete }) => {
  return (
    <div className="required-reading-section">
      <div className="reading-header">
        <h3>Required Reading</h3>
        <p>Complete these articles before proceeding to the quiz.</p>
      </div>
      
      <div className="reading-list">
        {readings.map((reading, index) => (
          <RequiredReadingCard
            key={reading.blogPostId}
            reading={reading}
            order={index + 1}
            isCompleted={completedReadings.includes(reading.blogPostId)}
            onComplete={() => onReadingComplete(reading.blogPostId)}
          />
        ))}
      </div>
      
      <ReadingProgress
        completed={completedReadings.length}
        total={readings.length}
      />
    </div>
  );
};

const RequiredReadingCard = ({ reading, order, isCompleted, onComplete }) => {
  const { data: blogPost } = useQuery(['blog-post', reading.blogPostId], 
    () => fetchBlogPost(reading.blogPostId)
  );
  
  return (
    <div className={`reading-card ${isCompleted ? 'completed' : ''}`}>
      <div className="reading-order">{order}</div>
      
      <div className="reading-content">
        <h4>{blogPost?.title}</h4>
        <p>{reading.contextualDescription}</p>
        <div className="reading-meta">
          <span className="reading-time">{reading.estimatedTime} min read</span>
          {reading.isRequired && <Badge variant="secondary">Required</Badge>}
        </div>
      </div>
      
      <div className="reading-actions">
        {isCompleted ? (
          <Badge variant="success">Completed</Badge>
        ) : (
          <Button
            onClick={() => window.open(`/blog/${blogPost?.slug}?lesson=${reading.lessonId}`, '_blank')}
          >
            Read Article
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

## 🔌 API Endpoints

### Course Management

#### Create Course
```typescript
POST /api/v1/academy/courses
{
  title: string;
  description: string;
  shortDescription?: string;
  level: CourseLevel;
  estimatedHours?: number;
  language?: string;
  learningPath?: string;
  seoData?: {
    title?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  pricing?: {
    isFree: boolean;
    price?: number;
    currency?: string;
  };
}

Response: {
  course: AcademyCourse;
  message: string;
}
```

#### Update Course
```typescript
PUT /api/v1/academy/courses/:uuid
{
  title?: string;
  description?: string;
  lessons?: LessonPlan[];
  syllabus?: CourseSyllabus;
  status?: CourseStatus;
}

Response: {
  course: AcademyCourse;
  message: string;
}
```

#### Get Courses
```typescript
GET /api/v1/academy/courses?level=BEGINNER&language=en&category=modeling&page=1&limit=20

Response: {
  courses: AcademyCourse[];
  pagination: PaginationData;
  filters: {
    levels: CourseLevel[];
    categories: string[];
    languages: string[];
  };
}
```

### Enrollment Management

#### Enroll in Course
```typescript
POST /api/v1/academy/courses/:uuid/enroll
{
  userId?: number; // Admin enrollment
}

Response: {
  enrollment: CourseEnrollment;
  nextLesson?: AcademyLesson;
  message: string;
}
```

#### Get Enrollment Progress
```typescript
GET /api/v1/academy/enrollments/:enrollmentId/progress

Response: {
  enrollment: CourseEnrollment;
  lessonProgress: LessonProgress[];
  currentLesson: AcademyLesson;
  nextLesson?: AcademyLesson;
  completionPercent: number;
  estimatedTimeRemaining: number;
}
```

#### Update Lesson Progress
```typescript
POST /api/v1/academy/lessons/:uuid/progress
{
  status: LessonStatus;
  timeSpent: number;
  videoProgress?: number;
  notes?: string;
  quizScore?: number;
  requiredReadingComplete?: boolean;
}

Response: {
  progress: LessonProgress;
  canProceed: boolean;
  nextLesson?: AcademyLesson;
}
```

### Required Reading Integration

#### Get Required Reading
```typescript
GET /api/v1/academy/lessons/:uuid/required-reading

Response: {
  readings: {
    blogPostId: string;
    title: string;
    excerpt: string;
    readingTime: number;
    isRequired: boolean;
    contextualDescription: string;
    url: string;
    completed: boolean;
  }[];
  completionRequired: boolean;
}
```

#### Mark Reading Complete
```typescript
POST /api/v1/academy/lessons/:uuid/reading-complete
{
  blogPostId: string;
  timeSpent: number;
}

Response: {
  completed: boolean;
  allReadingsComplete: boolean;
  canProceedToQuiz: boolean;
}
```

### Quiz Management

#### Get Lesson Quiz
```typescript
GET /api/v1/academy/lessons/:uuid/quiz

Response: {
  quiz: {
    id: string;
    title: string;
    instructions: string;
    questions: QuizQuestion[];
    timeLimit?: number;
    maxAttempts: number;
    attemptsRemaining: number;
  };
}
```

#### Submit Quiz Attempt
```typescript
POST /api/v1/academy/quizzes/:uuid/attempt
{
  answers: {
    questionId: string;
    answer: any;
  }[];
}

Response: {
  attempt: QuizAttempt;
  score: number;
  passed: boolean;
  feedback: QuestionFeedback[];
  canRetake: boolean;
}
```

### Certificate Management

#### Generate Certificate
```typescript
POST /api/v1/academy/enrollments/:enrollmentId/certificate

Response: {
  certificate: CourseCertificate;
  downloadUrl: string;
  verificationUrl: string;
}
```

#### Verify Certificate
```typescript
GET /api/v1/academy/certificates/verify/:certificateNumber

Response: {
  isValid: boolean;
  certificate?: CertificateData;
  error?: string;
}
```

### Career Path Management

#### Get Career Paths
```typescript
GET /api/v1/academy/career-paths?category=modeling&level=beginner

Response: {
  careerPaths: CareerModel[];
  categories: CareerCategory[];
}
```

#### Enroll in Career Path
```typescript
POST /api/v1/academy/career-paths/:uuid/enroll
{
  personalGoals?: string[];
  targetDate?: Date;
}

Response: {
  enrollment: UserCareerPath;
  nextSteps: CareerPhase[];
  recommendedCourses: AcademyCourse[];
}
```

### Analytics APIs

#### Get Learning Analytics
```typescript
GET /api/v1/academy/analytics/user/:userId

Response: {
  analytics: LearningAnalytics;
  progressVisualization: ProgressVisualization;
  recommendations: ContentRecommendation[];
}
```

#### Get Course Analytics
```typescript
GET /api/v1/academy/courses/:uuid/analytics

Response: {
  enrollmentStats: {
    totalEnrollments: number;
    activeEnrollments: number;
    completionRate: number;
    averageScore: number;
    averageTime: number;
  };
  lessonAnalytics: LessonAnalyticsData[];
  studentFeedback: CourseReview[];
  improvementSuggestions: string[];
}
```

---

## 🔗 Integration with itellico Mono

### User Profile Integration

```typescript
class AcademyUserService {
  async enrichUserProfile(userId: number): Promise<EnrichedUserProfile> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    const academyData = await this.getAcademyProgress(userId);
    
    return {
      ...user,
      academy: {
        coursesCompleted: academyData.completedCourses.length,
        certificatesEarned: academyData.certificates.length,
        skillsAcquired: academyData.skills,
        learningStreak: academyData.learningStreak,
        nextMilestone: academyData.nextMilestone,
        recommendedCourses: await this.getRecommendedCourses(userId)
      }
    };
  }
  
  async updateUserSkills(userId: number, newSkills: string[]): Promise<void> {
    // Update user profile with newly acquired skills
    await this.db.userProfile.update({
      where: { userId },
      data: {
        skills: {
          push: newSkills
        },
        lastSkillUpdate: new Date()
      }
    });
    
    // Update platform recommendations based on new skills
    await this.updatePlatformRecommendations(userId, newSkills);
  }
}
```

### Job Matching Integration

```typescript
class CareerIntegrationService {
  async findRelevantJobs(userId: number): Promise<RelevantJob[]> {
    const userSkills = await this.getUserSkills(userId);
    const completedCourses = await this.getCompletedCourses(userId);
    const certificates = await this.getUserCertificates(userId);
    
    // Find jobs that match user's academy progress
    const relevantJobs = await this.db.jobPosting.findMany({
      where: {
        OR: [
          { requiredSkills: { hasAny: userSkills } },
          { preferredCertifications: { hasAny: certificates.map(c => c.course.title) } },
          { experienceLevel: { in: this.mapCoursesToExperience(completedCourses) } }
        ],
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      include: { company: true, category: true }
    });
    
    return relevantJobs.map(job => ({
      ...job,
      matchScore: this.calculateMatchScore(job, userSkills, certificates),
      missingSkills: this.identifyMissingSkills(job, userSkills),
      recommendedCourses: this.findCoursesForSkills(this.identifyMissingSkills(job, userSkills))
    }));
  }
  
  async recommendCoursesForJob(jobId: string, userId: number): Promise<CourseRecommendation[]> {
    const job = await this.getJob(jobId);
    const userSkills = await this.getUserSkills(userId);
    const missingSkills = this.identifyMissingSkills(job, userSkills);
    
    return await this.findCoursesForSkills(missingSkills);
  }
}
```

### Platform Notifications Integration

```typescript
class AcademyNotificationService {
  async sendLearningNotifications(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    const preferences = await this.getUserNotificationPreferences(userId);
    
    if (preferences.learningReminders) {
      // Daily learning streak reminders
      await this.sendLearningStreakReminder(user);
      
      // Course deadline reminders
      await this.sendCourseDeadlineReminders(user);
      
      // New relevant course notifications
      await this.sendNewCourseNotifications(user);
    }
    
    if (preferences.careerUpdates) {
      // Career milestone achievements
      await this.sendMilestoneNotifications(user);
      
      // Job opportunity matches
      await this.sendJobMatchNotifications(user);
    }
  }
  
  async sendCertificateEarned(userId: number, certificateId: string): Promise<void> {
    const certificate = await this.getCertificate(certificateId);
    const user = await this.getUser(userId);
    
    // Send email notification
    await this.emailService.sendCertificateEarnedEmail(user, certificate);
    
    // Create in-app notification
    await this.notificationService.create({
      userId,
      type: 'CERTIFICATE_EARNED',
      title: 'Congratulations! You earned a certificate',
      message: `You've successfully completed ${certificate.course.title}`,
      data: { certificateId, courseId: certificate.course.id },
      actionUrl: `/academy/certificates/${certificate.uuid}`
    });
    
    // Update user profile badge
    await this.badgeService.awardBadge(userId, 'COURSE_COMPLETION', {
      courseName: certificate.course.title,
      certificateNumber: certificate.certificateNumber
    });
  }
}
```

---

## 🚀 Implementation Guide

### Phase 1: Core Academy Foundation (Weeks 1-4)

#### Week 1: Database & Models
1. Create academy-specific database models
2. Set up course and lesson management
3. Implement basic CRUD operations
4. Add enrollment and progress tracking

#### Week 2: Course Management API
1. Implement course creation and management endpoints
2. Add lesson management functionality
3. Create enrollment system
4. Implement basic progress tracking

#### Week 3: Admin Interface
1. Create academy management dashboard
2. Build course creation interface
3. Implement lesson editor
4. Add enrollment management

#### Week 4: Student Interface
1. Create student dashboard
2. Build course catalog
3. Implement basic course player
4. Add progress visualization

### Phase 2: Content & Learning Features (Weeks 5-8)

#### Week 5: Blog Integration
1. Implement required reading system
2. Add blog post linking to lessons
3. Create reading progress tracking
4. Build content recommendation engine

#### Week 6: Quiz System
1. Create quiz builder for instructors
2. Implement quiz taking interface
3. Add scoring and feedback system
4. Integrate quiz completion with lesson progress

#### Week 7: Video & Media
1. Add video lesson support
2. Implement video progress tracking
3. Create interactive lesson elements
4. Add resource management

#### Week 8: Assessment & Grading
1. Build comprehensive assessment system
2. Add skill evaluation features
3. Implement adaptive learning elements
4. Create performance analytics

### Phase 3: Career Paths & Certification (Weeks 9-12)

#### Week 9: Career Path System
1. Implement career model creation
2. Build career path enrollment
3. Add milestone tracking
4. Create career progress visualization

#### Week 10: Certificate System
1. Create certificate templates
2. Implement certificate generation
3. Add verification system
4. Build certificate management interface

#### Week 11: Advanced Features
1. Add skill assessment system
2. Implement learning analytics
3. Create recommendation engine
4. Build social learning features

#### Week 12: Integration & Polish
1. Complete platform integration
2. Add job matching features
3. Implement notification system
4. Performance optimization and testing

### Phase 4: Analytics & Optimization (Weeks 13-16)

#### Week 13: Learning Analytics
1. Implement comprehensive tracking
2. Add performance analytics
3. Create instructor analytics dashboard
4. Build student learning insights

#### Week 14: Adaptive Learning
1. Create personalized learning paths
2. Implement adaptive content delivery
3. Add intelligent recommendations
4. Build progress optimization

#### Week 15: Advanced Integrations
1. Enhanced blog integration
2. Job platform connectivity
3. External tool integrations
4. API optimization

#### Week 16: Launch Preparation
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Documentation and training

### Caching Strategy

```typescript
// Redis cache patterns for academy system
const ACADEMY_CACHE_PATTERNS = {
  // Course caching
  PUBLISHED_COURSE: 'tenant:{tenantId}:academy:course:{uuid}', // 1 hour TTL
  COURSE_LESSONS: 'tenant:{tenantId}:academy:course:{uuid}:lessons', // 30 min TTL
  COURSE_ANALYTICS: 'tenant:{tenantId}:academy:course:{uuid}:analytics', // 15 min TTL
  
  // User progress caching
  USER_PROGRESS: 'tenant:{tenantId}:academy:user:{userId}:progress', // 5 min TTL
  USER_ENROLLMENTS: 'tenant:{tenantId}:academy:user:{userId}:enrollments', // 10 min TTL
  USER_CERTIFICATES: 'tenant:{tenantId}:academy:user:{userId}:certificates', // 1 hour TTL
  
  // Career path caching
  CAREER_PATHS: 'tenant:{tenantId}:academy:career-paths', // 30 min TTL
  USER_CAREER_PROGRESS: 'tenant:{tenantId}:academy:user:{userId}:career', // 10 min TTL
  
  // Content recommendations
  COURSE_RECOMMENDATIONS: 'tenant:{tenantId}:academy:recommendations:{userId}', // 1 hour TTL
  BLOG_INTEGRATION: 'tenant:{tenantId}:academy:blog:{courseId}', // 30 min TTL
  
  // Analytics
  LEARNING_ANALYTICS: 'tenant:{tenantId}:academy:analytics:{userId}', // 15 min TTL
  COURSE_STATS: 'tenant:{tenantId}:academy:stats:{courseId}', // 30 min TTL
};
```

### Performance Considerations

#### Database Optimization
- Indexes on frequently queried fields (enrollments, progress, etc.)
- Efficient pagination for large course catalogs
- Optimized queries for progress calculations
- Read replicas for analytics queries

#### Media Optimization
- CDN for video content delivery
- Adaptive video streaming
- Image optimization for course materials
- Progressive loading for large content

#### Real-time Features
- WebSocket connections for live progress updates
- Real-time collaboration in courses
- Live notification delivery
- Instant feedback systems

---

## 📈 Success Metrics

### Learning Effectiveness
- Course completion rate: Target >75%
- Average course rating: Target >4.2/5
- Knowledge retention: Target >80% on follow-up assessments
- Time to competency: Track improvement over time

### User Engagement
- Daily active learners: Track growth
- Learning streak maintenance: Target >70% weekly retention
- Course-to-career conversion: Track job placement success
- User satisfaction scores: Target >85%

### Platform Integration
- Blog-to-course conversion: Track referral success
- Course-to-job application: Track career advancement
- Cross-platform engagement: Monitor holistic usage
- Skill verification accuracy: Track real-world application

### Business Impact
- Revenue from premium courses: If applicable
- Cost per completed learner: Optimize efficiency
- Instructor productivity: Track content creation efficiency
- Platform differentiation: Monitor competitive advantage

---

This comprehensive academy system provides everything needed to educate models and professionals effectively while maintaining seamless integration with the Mono platform's existing architecture and the blog system's content strategy.