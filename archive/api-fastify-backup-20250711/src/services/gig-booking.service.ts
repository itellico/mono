/**
 * Gig Booking Backend Service
 * 
 * Backend service for managing gig bookings and orders
 * Direct database interaction for Fastify API routes
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { cache } from '../lib/cache';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export interface CreateBookingData {
  gigId: number;
  buyerId: number;
  tenantId: number;
  packageId: string;
  extras?: string[];
  requirements: {
    answers: Array<{
      questionId: string;
      answer: string;
    }>;
    attachments?: Array<{
      url: string;
      filename: string;
      size: number;
    }>;
  };
  urgentDelivery?: boolean;
  message?: string;
}

export interface BookingFilters {
  status?: string;
  gigId?: number;
  buyerId?: number;
  sellerId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export class GigBookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData) {
    // Get gig details
    const gig = await prisma.gigOffering.findFirst({
      where: {
        id: data.gigId,
        tenantId: data.tenantId,
        status: 'published',
      },
      include: {
        packages: true,
        extras: true,
        availability: true,
      }
    });

    if (!gig) {
      throw new Error('Gig offering not found or not available');
    }

    // Find the selected package
    const selectedPackage = gig.packages.find(p => p.id === data.packageId);
    if (!selectedPackage) {
      throw new Error('Invalid package selected');
    }

    // Calculate total price
    let totalPrice = selectedPackage.price;
    const selectedExtras = [];

    if (data.extras && data.extras.length > 0) {
      for (const extraId of data.extras) {
        const extra = gig.extras?.find(e => e.id === extraId);
        if (extra) {
          totalPrice += extra.price;
          selectedExtras.push(extra);
        }
      }
    }

    // Add urgent delivery fee if applicable
    if (data.urgentDelivery && gig.availability?.expressDelivery) {
      totalPrice += gig.availability.expressPrice || 0;
    }

    // Calculate delivery date
    let deliveryDays = selectedPackage.deliveryTime;
    if (data.urgentDelivery && gig.availability?.expressTime) {
      deliveryDays = gig.availability.expressTime;
    }
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Determine initial status
    const initialStatus = gig.availability?.autoAccept ? 'accepted' : 'pending';

    // Create booking
    const booking = await prisma.gigBooking.create({
      data: {
        uuid: nanoid(),
        tenantId: data.tenantId,
        gigId: data.gigId,
        sellerId: gig.talentId,
        buyerId: data.buyerId,
        packageId: data.packageId,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        extras: selectedExtras,
        totalPrice,
        currency: selectedPackage.currency,
        requirements: data.requirements,
        urgentDelivery: data.urgentDelivery || false,
        estimatedDelivery,
        status: initialStatus,
        statusHistory: [{
          status: initialStatus,
          changedAt: new Date(),
          changedBy: initialStatus === 'accepted' ? 'system' : data.buyerId.toString(),
        }],
        message: data.message,
      },
      include: {
        gig: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        }
      }
    });

    // Update gig stats
    await this.updateGigOrderStats(data.gigId, data.tenantId);

    // Clear cache
    await this.clearBookingCache(data.tenantId, data.gigId);

    // TODO: Send notifications to seller

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: number, tenantId: number) {
    const booking = await prisma.gigBooking.findFirst({
      where: { 
        id,
        tenantId 
      },
      include: {
        gig: {
          include: {
            talent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                email: true,
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          }
        }
      }
    });

    return booking;
  }

  /**
   * Get user's bookings (as buyer)
   */
  async getUserBookings(
    userId: number,
    tenantId: number,
    filters: BookingFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const where: Prisma.GigBookingWhereInput = {
      buyerId: userId,
      tenantId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const total = await prisma.gigBooking.count({ where });

    const bookings = await prisma.gigBooking.findMany({
      where,
      include: {
        gig: {
          select: {
            id: true,
            title: true,
            slug: true,
            talent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      uuid: booking.uuid,
      gig: {
        id: booking.gig.id,
        title: booking.gig.title,
        slug: booking.gig.slug,
        talent: booking.gig.talent,
      },
      package: {
        name: booking.packageName,
        price: booking.packagePrice,
        currency: booking.currency,
      },
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
      estimatedDelivery: booking.estimatedDelivery.toISOString(),
      actualDelivery: booking.actualDelivery?.toISOString(),
      createdAt: booking.createdAt.toISOString(),
    }));

    return {
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get seller's orders
   */
  async getSellerOrders(
    sellerId: number,
    tenantId: number,
    filters: BookingFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const where: Prisma.GigBookingWhereInput = {
      sellerId,
      tenantId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    const [total, orders, stats] = await Promise.all([
      prisma.gigBooking.count({ where }),
      prisma.gigBooking.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
            }
          },
          gig: {
            select: {
              id: true,
              title: true,
              slug: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.getSellerOrderStats(sellerId, tenantId)
    ]);

    const formattedOrders = orders.map(order => ({
      id: order.id,
      uuid: order.uuid,
      buyer: order.buyer,
      gig: order.gig,
      package: {
        name: order.packageName,
        price: order.packagePrice,
        currency: order.currency,
      },
      totalPrice: order.totalPrice,
      currency: order.currency,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery.toISOString(),
      requirements: order.requirements,
      createdAt: order.createdAt.toISOString(),
    }));

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    };
  }

  /**
   * Get account orders (for agencies)
   */
  async getAccountOrders(
    accountId: number,
    tenantId: number,
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ) {
    // Get all talents managed by this account
    const talents = await prisma.user.findMany({
      where: {
        accountId,
        tenantId,
      },
      select: { id: true }
    });

    const talentIds = talents.map(t => t.id);

    const where: Prisma.GigBookingWhereInput = {
      sellerId: { in: talentIds },
      tenantId,
      ...filters
    };

    const [total, orders] = await Promise.all([
      prisma.gigBooking.count({ where }),
      prisma.gigBooking.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePhotoUrl: true,
            }
          },
          gig: {
            select: {
              id: true,
              title: true,
              slug: true,
              talent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    // Calculate stats
    const stats = {
      byStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      avgOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + order.totalPrice, 0) / orders.length : 0,
      completionRate: orders.length > 0 ?
        orders.filter(o => o.status === 'completed').length / orders.length * 100 : 0,
    };

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    };
  }

  /**
   * Get orders for a specific gig
   */
  async getGigOrders(
    gigId: number,
    tenantId: number,
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ) {
    const where: Prisma.GigBookingWhereInput = {
      gigId,
      tenantId,
      ...filters
    };

    const [total, orders] = await Promise.all([
      prisma.gigBooking.count({ where }),
      prisma.gigBooking.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: number,
    status: BookingStatus,
    updatedBy: number,
    message?: string,
    deliverables?: any[]
  ) {
    const booking = await prisma.gigBooking.findUnique({
      where: { id },
      include: {
        statusHistory: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate status transition
    this.validateStatusTransition(booking.status, status);

    // Add status history entry
    const statusHistory = [
      ...(booking.statusHistory as any[] || []),
      {
        status,
        changedAt: new Date(),
        changedBy: updatedBy.toString(),
        message,
      }
    ];

    const updateData: any = {
      status,
      statusHistory,
    };

    // Handle specific status updates
    if (status === 'delivered' && deliverables) {
      updateData.deliverables = deliverables;
      updateData.actualDelivery = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.gigBooking.update({
      where: { id },
      data: updateData,
    });

    // Update gig stats if completed
    if (status === 'completed') {
      await this.updateGigCompletionStats(booking.gigId, booking.tenantId);
    }

    // Clear cache
    await this.clearBookingCache(booking.tenantId, booking.gigId);

    return updated;
  }

  /**
   * Submit a review for a completed booking
   */
  async submitReview(
    bookingId: number,
    reviewerId: number,
    reviewData: {
      rating: number;
      comment: string;
      categories: {
        communication: number;
        quality: number;
        delivery: number;
        value: number;
      };
      wouldRecommend: boolean;
    }
  ) {
    const booking = await prisma.gigBooking.findFirst({
      where: {
        id: bookingId,
        buyerId: reviewerId,
        status: 'completed',
      }
    });

    if (!booking) {
      throw new Error('Booking not found or not eligible for review');
    }

    // Check if already reviewed
    const existingReview = await prisma.gigReview.findFirst({
      where: {
        bookingId,
        reviewerId,
      }
    });

    if (existingReview) {
      throw new Error('You have already reviewed this booking');
    }

    // Create review
    const review = await prisma.gigReview.create({
      data: {
        gigId: booking.gigId,
        bookingId,
        reviewerId,
        revieweeId: booking.sellerId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        categories: reviewData.categories,
        wouldRecommend: reviewData.wouldRecommend,
      }
    });

    // Update gig rating stats
    await this.updateGigRatingStats(booking.gigId, booking.tenantId);

    return review;
  }

  /**
   * Get seller order statistics
   */
  private async getSellerOrderStats(sellerId: number, tenantId: number) {
    const orders = await prisma.gigBooking.findMany({
      where: {
        sellerId,
        tenantId,
      },
      select: {
        status: true,
        totalPrice: true,
      }
    });

    const stats = {
      pending: 0,
      inProgress: 0,
      delivered: 0,
      completed: 0,
      totalEarnings: 0,
    };

    orders.forEach(order => {
      switch (order.status) {
        case 'pending':
        case 'accepted':
          stats.pending++;
          break;
        case 'in_progress':
        case 'revision_requested':
          stats.inProgress++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'completed':
          stats.completed++;
          stats.totalEarnings += order.totalPrice;
          break;
      }
    });

    return stats;
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['delivered', 'cancelled', 'disputed'],
      delivered: ['completed', 'revision_requested', 'disputed'],
      revision_requested: ['in_progress', 'cancelled', 'disputed'],
      completed: ['disputed'],
      cancelled: [],
      disputed: ['completed', 'cancelled'],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Update gig order statistics
   */
  private async updateGigOrderStats(gigId: number, tenantId: number) {
    const stats = await prisma.gigBooking.groupBy({
      by: ['status'],
      where: { gigId, tenantId },
      _count: { id: true },
      _sum: { totalPrice: true },
    });

    const totalOrders = stats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalRevenue = stats
      .filter(s => s.status === 'completed')
      .reduce((sum, stat) => sum + (stat._sum.totalPrice || 0), 0);

    await prisma.gigOffering.update({
      where: { id: gigId },
      data: {
        stats: {
          totalOrders,
          totalRevenue,
        } as any,
      }
    });
  }

  /**
   * Update gig completion statistics
   */
  private async updateGigCompletionStats(gigId: number, tenantId: number) {
    const completedOrders = await prisma.gigBooking.findMany({
      where: {
        gigId,
        tenantId,
        status: 'completed',
      },
      select: {
        estimatedDelivery: true,
        actualDelivery: true,
      }
    });

    const onTimeDeliveries = completedOrders.filter(
      order => order.actualDelivery && order.actualDelivery <= order.estimatedDelivery
    ).length;

    const completionRate = completedOrders.length > 0
      ? (onTimeDeliveries / completedOrders.length) * 100
      : 0;

    await prisma.gigOffering.update({
      where: { id: gigId },
      data: {
        stats: {
          completionRate,
          onTimeDelivery: completionRate,
        } as any,
      }
    });
  }

  /**
   * Update gig rating statistics
   */
  private async updateGigRatingStats(gigId: number, tenantId: number) {
    const reviews = await prisma.gigReview.findMany({
      where: { gigId },
      select: {
        rating: true,
        categories: true,
      }
    });

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const categoryAvgs = {
      communication: 0,
      quality: 0,
      delivery: 0,
      value: 0,
    };

    reviews.forEach(review => {
      const cats = review.categories as any;
      categoryAvgs.communication += cats.communication || 0;
      categoryAvgs.quality += cats.quality || 0;
      categoryAvgs.delivery += cats.delivery || 0;
      categoryAvgs.value += cats.value || 0;
    });

    Object.keys(categoryAvgs).forEach(key => {
      categoryAvgs[key as keyof typeof categoryAvgs] /= reviews.length;
    });

    await prisma.gigOffering.update({
      where: { id: gigId },
      data: {
        stats: {
          avgRating,
          totalReviews: reviews.length,
          categoryRatings: categoryAvgs,
        } as any,
      }
    });
  }

  /**
   * Clear booking-related cache
   */
  private async clearBookingCache(tenantId: number, gigId?: number) {
    const keys = [
      `tenant:${tenantId}:bookings:*`,
      `tenant:${tenantId}:orders:*`,
    ];

    if (gigId) {
      keys.push(`tenant:${tenantId}:gig:${gigId}:*`);
    }

    // Clear Redis cache patterns
    for (const pattern of keys) {
      const existingKeys = await cache.keys(pattern);
      if (existingKeys.length > 0) {
        await cache.del(...existingKeys);
      }
    }
  }
}

// Export singleton instance
export const gigBookingService = new GigBookingService();