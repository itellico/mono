/**
 * mono WebSocket Server - Real-Time Communication Infrastructure
 * Provides scalable real-time features with Redis backing
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, tenants } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// WebSocket Event Types
export interface WebSocketEvents {
  // Connection Events
  'user:connect': { userId: string; tenantId: string; timestamp: number };
  'user:disconnect': { userId: string; tenantId: string; timestamp: number };

  // Messaging Events
  'message:send': { 
    messageId: string;
    senderId: string; 
    recipientId: string; 
    content: string; 
    type: 'text' | 'image' | 'file';
    timestamp: number;
  };
  'message:received': { messageId: string; recipientId: string; timestamp: number };
  'message:read': { messageId: string; readerId: string; timestamp: number };

  // Booking Events
  'booking:status_update': {
    bookingId: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    userId: string;
    clientId: string;
    timestamp: number;
  };
  'booking:new_request': {
    bookingId: string;
    modelId: string;
    clientId: string;
    details: any;
    timestamp: number;
  };

  // Portfolio Events
  'portfolio:view': {
    portfolioId: string;
    viewerId: string;
    modelId: string;
    timestamp: number;
  };
  'portfolio:like': {
    portfolioId: string;
    likerId: string;
    modelId: string;
    timestamp: number;
  };
  'portfolio:comment': {
    portfolioId: string;
    commentId: string;
    commenterId: string;
    modelId: string;
    content: string;
    timestamp: number;
  };

  // Live Search Events
  'search:update': {
    searchId: string;
    query: string;
    filters: any;
    results: any[];
    timestamp: number;
  };

  // System Events
  'notification:new': {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    content: string;
    timestamp: number;
  };
  'presence:update': {
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen: number;
  };
}

// User Connection Information
interface UserConnection {
  userId: string;
  tenantId: string;
  socketId: string;
  connectedAt: number;
  lastActivity: number;
  userAgent?: string;
  ipAddress?: string;
}

// WebSocket Server Class
export class monoWebSocketServer {
  private io: SocketIOServer;
  private redis: any = null; // Redis client
  private redisSubscriber: any = null; // Redis subscriber
  private userConnections = new Map<string, UserConnection>();
  private socketToUser = new Map<string, string>();

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.IO Server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    // Initialize Redis connections
    this.initializeRedis();

    this.setupEventHandlers();
    this.setupRedisSubscriptions();

    logger.info('🔌 mono WebSocket Server initialized');
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Get Redis clients from centralized module
      this.redis = await getRedisClient();
      this.redisSubscriber = await getRedisClient();

      if (this.redis && this.redisSubscriber) {
        // Note: Redis adapter setup removed due to compatibility issues
        // For production, consider using a different clustering solution
        logger.info('✅ Redis clients initialized for WebSocket server');
      } else {
        logger.warn('⚠️ Redis not available, WebSocket will run without clustering');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis for WebSocket', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private setupEventHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        // Authenticate user via session token
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Verify session and get user info
        const session = await this.verifySession(token);
        if (!session?.user) {
          throw new Error('Invalid session');
        }

        // Attach user info to socket
        socket.data.user = session.user;
        socket.data.tenantId = session.user.tenantId;

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private async verifySession(token: string) {
    try {
      // This would integrate with your auth system
      // For now, we'll use a simplified version
      const cleanToken = token.replace('Bearer ', '');

      // In production, verify JWT token properly
      // This is a simplified version for development
      return { user: { id: 'user1', tenantId: 'tenant1' } };
    } catch (error) {
      logger.error('Session verification failed:', error);
      return null;
    }
  }

  private handleConnection(socket: Socket): void {
    const userId = socket.data.user.id;
    const tenantId = socket.data.tenantId;

    logger.info(`User ${userId} connected to tenant ${tenantId}`, {
      socketId: socket.id,
      userAgent: socket.handshake.headers['user-agent'],
    });

    // Store connection info
    const connection: UserConnection = {
      userId,
      tenantId,
      socketId: socket.id,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      userAgent: socket.handshake.headers['user-agent'],
      ipAddress: socket.handshake.address,
    };

    this.userConnections.set(userId, connection);
    this.socketToUser.set(socket.id, userId);

    // Join tenant-specific room
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);

    // Emit user connection event
    this.broadcastToTenant(tenantId, 'user:connect', {
      userId,
      tenantId,
      timestamp: Date.now(),
    });

    // Update user presence
    this.updateUserPresence(userId, 'online');

    // Setup event handlers for this socket
    this.setupSocketEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupSocketEventHandlers(socket: Socket): void {
    const userId = socket.data.user.id;
    const tenantId = socket.data.tenantId;

    // Messaging Events
    socket.on('message:send', async (data) => {
      await this.handleMessageSend(socket, data);
    });

    socket.on('message:read', async (data) => {
      await this.handleMessageRead(socket, data);
    });

    // Booking Events
    socket.on('booking:status_update', async (data) => {
      await this.handleBookingStatusUpdate(socket, data);
    });

    // Portfolio Events
    socket.on('portfolio:view', async (data) => {
      await this.handlePortfolioView(socket, data);
    });

    socket.on('portfolio:like', async (data) => {
      await this.handlePortfolioLike(socket, data);
    });

    // Presence Events
    socket.on('presence:update', async (data) => {
      await this.handlePresenceUpdate(socket, data);
    });

    // Activity tracking
    socket.on('user:activity', () => {
      this.updateUserActivity(userId);
    });
  }

  private async handleMessageSend(socket: Socket, data: any): Promise<void> {
    try {
      const senderId = socket.data.user.id;
      const tenantId = socket.data.tenantId;

      // Validate message data
      if (!data.recipientId || !data.content) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Create message in database
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const messageData: WebSocketEvents['message:send'] = {
        messageId,
        senderId,
        recipientId: data.recipientId,
        content: data.content,
        type: data.type || 'text',
        timestamp: Date.now(),
      };

      // Store message in Redis for fast access
      await this.redis.setex(
        `message:${messageId}`,
        86400, // 24 hours
        JSON.stringify(messageData)
      );

      // Send to recipient
      this.io.to(`user:${data.recipientId}`).emit('message:received', messageData);

      // Confirm to sender
      socket.emit('message:sent', { messageId, timestamp: messageData.timestamp });

      logger.info(`Message sent from ${senderId} to ${data.recipientId}`, { messageId });

    } catch (error) {
      logger.error('Error handling message send:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageRead(socket: Socket, data: any): Promise<void> {
    try {
      const readerId = socket.data.user.id;

      // Mark message as read
      const readData: WebSocketEvents['message:read'] = {
        messageId: data.messageId,
        readerId,
        timestamp: Date.now(),
      };

      // Update read status in Redis
      await this.redis.setex(
        `message_read:${data.messageId}:${readerId}`,
        86400,
        JSON.stringify(readData)
      );

      // Notify sender
      const messageData = await this.redis.get(`message:${data.messageId}`);
      if (messageData) {
        const message = JSON.parse(messageData);
        this.io.to(`user:${message.senderId}`).emit('message:read', readData);
      }

    } catch (error) {
      logger.error('Error handling message read:', error);
    }
  }

  private async handleBookingStatusUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const userId = socket.data.user.id;
      const tenantId = socket.data.tenantId;

      const updateData: WebSocketEvents['booking:status_update'] = {
        bookingId: data.bookingId,
        status: data.status,
        userId,
        clientId: data.clientId,
        timestamp: Date.now(),
      };

      // Store booking update
      await this.redis.setex(
        `booking_update:${data.bookingId}`,
        3600, // 1 hour
        JSON.stringify(updateData)
      );

      // Notify all relevant parties
      this.io.to(`user:${data.clientId}`).emit('booking:status_update', updateData);

      // Broadcast to tenant admin/moderators
      this.broadcastToTenant(tenantId, 'booking:status_update', updateData);

      logger.info(`Booking ${data.bookingId} status updated to ${data.status}`);

    } catch (error) {
      logger.error('Error handling booking status update:', error);
    }
  }

  private async handlePortfolioView(socket: Socket, data: any): Promise<void> {
    try {
      const viewerId = socket.data.user.id;

      const viewData: WebSocketEvents['portfolio:view'] = {
        portfolioId: data.portfolioId,
        viewerId,
        modelId: data.modelId,
        timestamp: Date.now(),
      };

      // Track view in Redis
      await this.redis.incr(`portfolio_views:${data.portfolioId}`);
      await this.redis.setex(
        `portfolio_view:${data.portfolioId}:${viewerId}`,
        3600,
        JSON.stringify(viewData)
      );

      // Notify model of new view
      this.io.to(`user:${data.modelId}`).emit('portfolio:view', viewData);

    } catch (error) {
      logger.error('Error handling portfolio view:', error);
    }
  }

  private async handlePortfolioLike(socket: Socket, data: any): Promise<void> {
    try {
      const likerId = socket.data.user.id;

      const likeData: WebSocketEvents['portfolio:like'] = {
        portfolioId: data.portfolioId,
        likerId,
        modelId: data.modelId,
        timestamp: Date.now(),
      };

      // Track like in Redis
      await this.redis.incr(`portfolio_likes:${data.portfolioId}`);
      await this.redis.setex(
        `portfolio_like:${data.portfolioId}:${likerId}`,
        86400,
        JSON.stringify(likeData)
      );

      // Notify model of new like
      this.io.to(`user:${data.modelId}`).emit('portfolio:like', likeData);

    } catch (error) {
      logger.error('Error handling portfolio like:', error);
    }
  }

  private async handlePresenceUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const userId = socket.data.user.id;
      await this.updateUserPresence(userId, data.status);
    } catch (error) {
      logger.error('Error handling presence update:', error);
    }
  }

  private handleDisconnection(socket: Socket): void {
    const userId = this.socketToUser.get(socket.id);

    if (userId) {
      const connection = this.userConnections.get(userId);

      if (connection) {
        logger.info(`User ${userId} disconnected from tenant ${connection.tenantId}`, {
          socketId: socket.id,
          sessionDuration: Date.now() - connection.connectedAt,
        });

        // Emit user disconnect event
        this.broadcastToTenant(connection.tenantId, 'user:disconnect', {
          userId,
          tenantId: connection.tenantId,
          timestamp: Date.now(),
        });

        // Update presence to offline (with delay)
        setTimeout(() => {
          this.updateUserPresence(userId, 'offline');
        }, 30000); // 30 second delay before marking offline
      }

      // Clean up connection tracking
      this.userConnections.delete(userId);
      this.socketToUser.delete(socket.id);
    }
  }

  private async updateUserPresence(userId: string, status: 'online' | 'away' | 'offline'): Promise<void> {
    try {
      const presenceData: WebSocketEvents['presence:update'] = {
        userId,
        status,
        lastSeen: Date.now(),
      };

      // Store presence in Redis
      await this.redis.setex(
        `user_presence:${userId}`,
        300, // 5 minutes
        JSON.stringify(presenceData)
      );

      // Broadcast presence update
      this.io.emit('presence:update', presenceData);

    } catch (error) {
      logger.error('Error updating user presence:', error);
    }
  }

  private updateUserActivity(userId: string): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  private broadcastToTenant(tenantId: string, event: string, data: any): void {
    this.io.to(`tenant:${tenantId}`).emit(event, data);
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to Redis channels for cross-server communication
    this.redisSubscriber.subscribe('mono:notifications', 'mono:broadcasts');

    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);

        switch (channel) {
          case 'mono:notifications':
            this.handleRedisNotification(data);
            break;
          case 'mono:broadcasts':
            this.handleRedisBroadcast(data);
            break;
        }
      } catch (error) {
        logger.error('Error processing Redis message:', error);
      }
    });
  }

  private handleRedisNotification(data: any): void {
    if (data.userId) {
      this.io.to(`user:${data.userId}`).emit('notification:new', data);
    }
  }

  private handleRedisBroadcast(data: any): void {
    if (data.tenantId) {
      this.broadcastToTenant(data.tenantId, data.event, data.payload);
    } else {
      this.io.emit(data.event, data.payload);
    }
  }

  // Public API Methods
  public async sendNotification(userId: string, notification: any): Promise<void> {
    const notificationData: WebSocketEvents['notification:new'] = {
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      timestamp: Date.now(),
    };

    // Store notification
    await this.redis.setex(
      `notification:${notificationData.notificationId}`,
      604800, // 7 days
      JSON.stringify(notificationData)
    );

    // Send via WebSocket
    this.io.to(`user:${userId}`).emit('notification:new', notificationData);

    // Also publish to Redis for other server instances
    await this.redis.publish('mono:notifications', JSON.stringify(notificationData));
  }

  public async broadcastToTenantUsers(tenantId: string, event: string, data: any): Promise<void> {
    this.broadcastToTenant(tenantId, event, data);

    // Also publish to Redis for other server instances
    await this.redis.publish('mono:broadcasts', JSON.stringify({
      tenantId,
      event,
      payload: data,
    }));
  }

  public getConnectedUsers(): Array<{ userId: string; tenantId: string; connectedAt: number }> {
    return Array.from(this.userConnections.values()).map(conn => ({
      userId: conn.userId,
      tenantId: conn.tenantId,
      connectedAt: conn.connectedAt,
    }));
  }

  public async getUserPresence(userId: string): Promise<WebSocketEvents['presence:update'] | null> {
    try {
      const presenceData = await this.redis.get(`user_presence:${userId}`);
      return presenceData ? JSON.parse(presenceData) : null;
    } catch (error) {
      logger.error('Error getting user presence:', error);
      return null;
    }
  }

  public async getPortfolioStats(portfolioId: string): Promise<{ views: number; likes: number }> {
    try {
      const [views, likes] = await Promise.all([
        this.redis.get(`portfolio_views:${portfolioId}`),
        this.redis.get(`portfolio_likes:${portfolioId}`),
      ]);

      return {
        views: parseInt(views || '0'),
        likes: parseInt(likes || '0'),
      };
    } catch (error) {
      logger.error('Error getting portfolio stats:', error);
      return { views: 0, likes: 0 };
    }
  }
}

// Singleton instance
let wsServer: monoWebSocketServer | null = null;

export function initializeWebSocketServer(httpServer: HTTPServer): monoWebSocketServer {
  if (!wsServer) {
    wsServer = new monoWebSocketServer(httpServer);
  }
  return wsServer;
}

export function getWebSocketServer(): monoWebSocketServer | null {
  return wsServer;
} 