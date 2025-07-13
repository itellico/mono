# itellico Mono Integration Clarifications & Decisions

This document consolidates all the clarifications and decisions made during our development discussion.

## 🏗️ **Architecture Decisions**

### **1. Temporal Workspace Strategy**
**Decision**: Single Temporal cluster with workspace isolation
- **Platform Workspace**: For super admin platform-level workflows
- **Tenant Workspaces**: One workspace per tenant for isolation
- **No separate clusters/instances** - workspaces provide sufficient isolation

```typescript
// Workspace structure
temporal-workspaces/
├── platform/              // Super admin workflows
└── tenant-{tenantId}/     // Per-tenant workflows
```

### **2. Integration Priorities**

#### **Phase 1 Integrations**
- ✅ **Email Marketing**: Mautic integration via N8N
- ✅ **Social Media**: Instagram, Facebook, TikTok
- ✅ **Email Service**: Mailgun for transactional emails with statistics
- ✅ **Team Communication**: Mattermost (configurable to Slack)

#### **Future Modeling Industry Integrations** (Research needed)
- Model Mayhem API
- Casting Networks API
- Backstage API
- Star Now API

### **3. Workflow Development Approach**
**Start Simple**: Begin with model onboarding workflow
- ✅ Already have Reactflow installed
- ✅ Start with basic nodes (triggers, actions, conditions)
- ✅ Full-featured system architecture from day one
- ✅ Progressive complexity for nodes

## 📧 **Mailgun Integration Architecture**

### **Email State Machine**
```typescript
// Email states as workflow triggers
const EMAIL_WORKFLOW_STATES = {
  SENT: 'email_sent',
  DELIVERED: 'email_delivered',
  OPENED: 'email_opened',
  CLICKED: 'email_clicked',
  BOUNCED: 'email_bounced',
  COMPLAINED: 'email_complained'
};

// Workflow routing based on email engagement
if (emailState === 'OPENED') {
  // Trigger engaged user workflow
} else if (emailState === 'BOUNCED') {
  // Clean email list, notify admin
}
```

### **Statistics Storage**
- Store all Mailgun events in database
- Use webhook data for real-time workflow triggers
- Track engagement metrics per campaign/user

## 🛡️ **GoCare Content Moderation System**

### **System Purpose**
Quality control and content moderation for all uploaded media:
- **AI Analysis**: LLM checks for quality and appropriateness
- **Category Validation**: Ensures content matches selected category
- **Human-in-Loop**: Moderators review flagged or low-confidence content

### **Integration with Messaging**
- **Primary Channel**: Internal messaging system
- **Feedback Delivery**: Direct messages with image links and feedback
- **Email Fallback**: Auto-send email if message unread after X hours
- **Media Sharing**: Secure URLs with moderation feedback

## 💬 **Messaging System Requirements**

### **Core Features**
- Real-time message delivery (WebSocket)
- Read receipt tracking
- Email notification fallback (configurable delay)
- Media attachment support (secure URLs)
- Multi-tenant isolation

### **GoCare Integration Flow**
```
1. Content uploaded → GoCare analysis
2. Moderation feedback → Message to user
3. If unread after 30 min → Email notification
4. User clicks email → Opens message in platform
```

## 👥 **Account & Profile Ownership**

### **Ownership Model**
- **Account Holder = Owner** of all content within account
- **GDPR Compliance**: Export functionality required
- **Profile Visibility**: Can be shared across platform with permission
- **Deletion Rights**: Account holder can delete profiles

### **Commission Structure**
- ✅ **Simple Percentage**: Basic agency/model split
- ✅ **Multiple Party Splits**: Support for complex arrangements
- ✅ **Job-based Splits**: Different people on same job

## 🤖 **LLM Configuration Architecture**

### **Two-Level System**
1. **Platform Level (Super Admin)**
   - Configure available LLM providers
   - Set platform-wide defaults
   - Manage global translation settings

2. **Tenant Level**
   - Each tenant configures their own LLM
   - Provides their own API keys
   - **NO FALLBACK** to platform LLM (cost separation)

### **Integration Points**
- Could be configured in N8N for workflow integrations
- Direct API integration for real-time needs
- Both approaches supported based on use case

## 🌍 **Language Support Priority**

### **Major Markets (Phase 1)**
- English, Spanish, French, German, Italian

### **Asia-Pacific (Phase 2)**
- Japanese, Korean, Chinese (Mandarin)

### **Emerging Markets (Phase 3)**
- Portuguese (Brazil), Turkish, Arabic

## 📏 **Measurement System Decisions**

### **Precision Standards**
- **Height**: Full centimeters only (180cm)
- **Weight**: Kilograms only (65kg, not 65.2)
- **Measurements**: Centimeter precision
- **Shoe Sizes**: Half sizes (37.5)

### **Data Storage**
- **Approach**: Shared tables with tenant_id isolation
- **No separate schemas** per tenant
- **RLS** for security enforcement

## 🔐 **Partner Authentication System**

### **Configurable Verification Levels**
1. **Basic Check**: Human plausibility review
2. **Full Verification**: Third-party identity services

### **VPN Detection Strategy**
- **Auto-approval workflows**: Flag VPN, don't block
- **Human-in-loop workflows**: Block VPN registrations
- **Configurable per workflow**

### **Approval Complexity**
- **Simple**: Basic human approval
- **Complex**: Multi-step verification based on level

## 🖼️ **Media Security Architecture**

### **URL Pattern**
```
https://cdn.mono-platform.com/media/{contentHash}/{expiration}/{signature}?t={userToken}
```

### **Security Features**
- UUID + random elements for uniqueness
- Time-limited access with expiration
- HMAC signatures for tamper protection
- User tokens for private content
- CDN integration ready

### **Storage Strategy**
- Naming convention prevents discovery
- Public profiles with unguessable URLs
- Private content requires authentication
- Temporal workflows for thumbnail generation

## 🎯 **Development Approach**

### **Not MVP - Full Product**
"We already have a full-blown product, why go for MVP now?"
- Implement complete feature set
- All systems integrated from start
- Production-ready architecture

### **Team Status**
- ✅ Full team ready
- ✅ Budget approved
- ✅ No timeline constraints

### **Priority Features**
1. **Sedcards**: Critical for casting directors
2. **Media Manager**: Overview of all visual content
3. **Media Optimization**: Temporal workflows for thumbnails
4. **AI Integration**: Best practices for content analysis

## 💬 **Mattermost Integration**

### **Use Cases**
- Internal team/agency communication
- Project coordination
- Configurable to use Slack instead

### **Integration Method**
- Can use N8N for complex integrations
- Direct API for simple notifications
- User choice based on requirements

## 🚀 **Next Steps Summary**

### **Immediate Priorities**
1. Implement GoCare messaging system
2. Set up Mailgun webhook integration
3. Configure secure media URL generation
4. Build model onboarding workflow

### **Architecture Ready**
- ✅ All clarifications documented
- ✅ Technical decisions made
- ✅ Integration patterns defined
- ✅ Security measures specified

---

**All systems are now fully specified and ready for implementation with your clarifications integrated throughout the architecture.**