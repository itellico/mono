# RabbitMQ Integration Guide

## 🐰 Overview

RabbitMQ provides reliable message queuing for the mono Platform, handling chat messages, push notifications, email notifications, and audit events with guaranteed delivery and retry mechanisms.

## 🏗️ Architecture

### Message Flow
```
Application → Exchange → Queue → Consumer
     ↓           ↓         ↓        ↓
   Publish → Route → Store → Process
```

### Exchanges and Queues
- **messages** exchange → `chat.messages` queue (Chat system)
- **notifications** exchange → `push.notifications`, `email.notifications` queues
- **audit** exchange → `audit.events` queue (Audit logging)

## 🚀 Quick Start

### 1. Start RabbitMQ Service
```bash
# Start all services including RabbitMQ
./scripts/setup-services.sh

# Or start RabbitMQ only
docker compose up rabbitmq -d
```

### 2. Access Management UI
```bash
# Open RabbitMQ Management Interface
open http://localhost:15672

# Login credentials
Username: admin
Password: admin123
```

### 3. Verify Connection
```bash
# Check service status
docker compose ps rabbitmq

# View logs
docker compose logs rabbitmq -f
```

## 🔧 Configuration

### Environment Variables
```bash
# RabbitMQ connection URL
RABBITMQ_URL=amqp://admin:admin123@localhost:5672/mono

# Custom hostname (add to /etc/hosts)
# 127.0.0.1    RevitonQ.mono
RABBITMQ_URL=amqp://admin:admin123@RevitonQ.mono:5672/mono
```

### Docker Compose Configuration
```yaml
rabbitmq:
  image: rabbitmq:3.12-management
  container_name: mono-rabbitmq
  hostname: RevitonQ.mono
  ports:
    - "5672:5672"   # AMQP port
    - "15672:15672" # Management UI port
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
  volumes:
    - ./docker/rabbitmq/enabled_plugins:/etc/rabbitmq/enabled_plugins
    - ./docker/rabbitmq/definitions.json:/etc/rabbitmq/definitions.json:ro
```

## 📨 Message Types

### Chat Messages
```typescript
interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  tenantId: number;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
}

// Usage
await messageQueue.sendChatMessage({
  messageId: 'msg_123',
  conversationId: 'conv_456',
  senderId: 'user_789',
  tenantId: 1,
  content: 'Hello world!',
  messageType: 'text',
  timestamp: new Date()
});
```

### Push Notifications
```typescript
interface PushNotification {
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  tenantId: number;
}

// Usage
await messageQueue.sendPushNotification({
  recipientIds: ['user_123', 'user_456'],
  title: 'New Message',
  body: 'You have a new message from John',
  data: { conversationId: 'conv_789' },
  tenantId: 1
});
```

### Email Notifications
```typescript
interface EmailNotification {
  to: string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  tenantId: number;
}

// Usage
await messageQueue.sendEmailNotification({
  to: ['user@example.com'],
  subject: 'Welcome to mono Platform',
  template: 'welcome',
  data: { userName: 'John Doe' },
  tenantId: 1
});
```

### Audit Events
```typescript
interface AuditEvent {
  eventType: string;
  userId: string;
  tenantId: number;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

// Usage
await messageQueue.sendAuditEvent({
  eventType: 'USER_UPDATED',
  userId: 'user_123',
  tenantId: 1,
  entityType: 'User',
  entityId: 'user_456',
  changes: { email: 'new@example.com' },
  timestamp: new Date()
});
```

## 📊 Queue Configuration

### Message TTL and Limits
| Queue | TTL | Max Length | Purpose |
|-------|-----|------------|---------|
| `chat.messages` | 24 hours | 100,000 | Chat messages |
| `push.notifications` | 1 hour | 50,000 | Push notifications |
| `email.notifications` | 1 hour | 25,000 | Email notifications |
| `audit.events` | 7 days | 500,000 | Audit logging |

### Routing Keys
- **Chat**: `chat.*` → `chat.direct`, `chat.group`
- **Push**: `push.*` → `push.mobile`, `push.web`
- **Email**: `email.*` → `email.send`, `email.template`
- **Audit**: `audit.*` → `audit.track`, `audit.compliance`

## 🔄 Consumer Implementation

### Setting Up Consumers
```typescript
import { messageQueue } from '../services/message-queue.service.js';

// Chat message consumer
messageQueue.consumeMessages('chat.messages', async (message) => {
  const chatData = message.payload as ChatMessage;
  
  // Process chat message
  await processChatMessage(chatData);
  
  // Send real-time updates
  await broadcastToConnectedUsers(chatData);
});

// Push notification consumer
messageQueue.consumeMessages('push.notifications', async (message) => {
  const pushData = message.payload as PushNotification;
  
  // Send to FCM/APNS
  await sendPushNotification(pushData);
});

// Email notification consumer
messageQueue.consumeMessages('email.notifications', async (message) => {
  const emailData = message.payload as EmailNotification;
  
  // Send via SMTP/Mailgun
  await sendEmailNotification(emailData);
});

// Audit event consumer
messageQueue.consumeMessages('audit.events', async (message) => {
  const auditData = message.payload as AuditEvent;
  
  // Store in audit database
  await storeAuditEvent(auditData);
});
```

## 📈 Monitoring and Metrics

### Prometheus Metrics
RabbitMQ exports metrics to Prometheus at `http://localhost:15692/metrics`:

- `rabbitmq_queue_messages` - Messages in queue
- `rabbitmq_queue_consumers` - Active consumers
- `rabbitmq_queue_message_publish_total` - Published messages
- `rabbitmq_queue_message_deliver_total` - Delivered messages

### Grafana Dashboard
Access comprehensive RabbitMQ monitoring at `http://localhost:5005`:

1. **Queue Health**: Message counts, consumer status
2. **Throughput**: Publish/consume rates
3. **Memory Usage**: Queue memory consumption
4. **Connection Status**: Active connections and channels

### Queue Statistics
```typescript
// Get queue statistics
const stats = await messageQueue.getQueueStats();
console.log(stats);

// Output:
{
  "chat.messages": {
    "messageCount": 42,
    "consumerCount": 2
  },
  "push.notifications": {
    "messageCount": 0,
    "consumerCount": 1
  }
}
```

## 🔧 Management Operations

### Via Management UI (http://localhost:15672)
- View queue lengths and consumer counts
- Manually publish test messages
- Monitor exchange bindings
- Set queue policies and limits

### Via CLI Commands
```bash
# View queue status
docker exec mono-rabbitmq rabbitmqctl list_queues

# View exchanges
docker exec mono-rabbitmq rabbitmqctl list_exchanges

# View connections
docker exec mono-rabbitmq rabbitmqctl list_connections

# Purge a queue (careful!)
docker exec mono-rabbitmq rabbitmqctl purge_queue chat.messages
```

## 🛡️ Security and Best Practices

### Connection Security
- Use dedicated vhost (`mono`) for application isolation
- Strong admin credentials (change from defaults in production)
- TLS encryption for production deployments
- Network isolation via Docker networking

### Message Durability
- All exchanges and queues are marked as `durable: true`
- Messages are published with `persistent: true`
- Ensures messages survive server restarts

### Error Handling
- Built-in retry mechanism (max 3 attempts)
- Dead letter queues for failed messages
- Exponential backoff for connection retries
- Graceful degradation when RabbitMQ is unavailable

### Performance Optimization
- Connection pooling and channel reuse
- Batch processing for high-volume queues
- TTL settings prevent queue overflow
- Memory and disk space monitoring

## 🚨 Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if RabbitMQ is running
docker compose ps rabbitmq

# Check logs for errors
docker compose logs rabbitmq

# Restart service
docker compose restart rabbitmq
```

#### Queue Overflow
```bash
# Check queue lengths
docker exec mono-rabbitmq rabbitmqctl list_queues

# Increase consumers if needed
# Or purge old messages (careful!)
```

#### Memory Issues
```bash
# Check RabbitMQ memory usage
docker exec mono-rabbitmq rabbitmqctl status

# Adjust memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

### Health Checks
```typescript
// Check if RabbitMQ is connected
if (messageQueue.connected) {
  console.log('✅ RabbitMQ is connected');
} else {
  console.log('❌ RabbitMQ is not connected');
}
```

## 🔗 Integration Examples

### With Audit System
```typescript
// Automatically track user actions via RabbitMQ
export async function trackUserAction(
  userId: string,
  tenantId: number,
  action: string,
  entityType: string,
  entityId: string,
  changes: Record<string, any>
) {
  await messageQueue.sendAuditEvent({
    eventType: action,
    userId,
    tenantId,
    entityType,
    entityId,
    changes,
    timestamp: new Date()
  });
}
```

### With Real-time Chat
```typescript
// Send chat message through RabbitMQ for reliability
export async function sendChatMessage(message: ChatMessage) {
  // Store in database first
  const savedMessage = await db.message.create({ data: message });
  
  // Queue for real-time delivery
  await messageQueue.sendChatMessage(savedMessage);
  
  return savedMessage;
}
```

### With Notification System
```typescript
// Queue notifications for batch processing
export async function notifyUsers(
  userIds: string[],
  notification: NotificationData
) {
  // Queue push notification
  await messageQueue.sendPushNotification({
    recipientIds: userIds,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    tenantId: notification.tenantId
  });
  
  // Queue email notification if requested
  if (notification.sendEmail) {
    await messageQueue.sendEmailNotification({
      to: await getUserEmails(userIds),
      subject: notification.title,
      template: 'notification',
      data: notification.data,
      tenantId: notification.tenantId
    });
  }
}
```

## 📚 Additional Resources

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP 0-9-1 Protocol Reference](https://www.rabbitmq.com/amqp-0-9-1-reference.html)
- [RabbitMQ Management Plugin](https://www.rabbitmq.com/management.html)
- [RabbitMQ Monitoring Guide](https://www.rabbitmq.com/monitoring.html)

## 🆘 Support

For RabbitMQ integration issues:
1. Check the troubleshooting section above
2. Review RabbitMQ logs: `docker compose logs rabbitmq`
3. Verify network connectivity and ports
4. Consult the mono Platform documentation