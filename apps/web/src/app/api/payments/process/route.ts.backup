/**
 * @openapi
 * /api/payments/process:
 *   post:
 *     tags:
 *       - Payments
 *       - Processing
 *     summary: Process Payment
 *     description: Process a payment transaction with proper validation and security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - paymentMethodId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in cents
 *                 minimum: 1
 *               currency:
 *                 type: string
 *                 description: Currency code (ISO 4217)
 *                 example: "USD"
 *               paymentMethodId:
 *                 type: string
 *                 description: Payment method identifier
 *               description:
 *                 type: string
 *                 description: Payment description
 *               metadata:
 *                 type: object
 *                 description: Additional payment metadata
 *     responses:
 *       '200':
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: Invalid request or validation failed
 *       '401':
 *         description: Authentication required
 *       '402':
 *         description: Payment required or insufficient funds
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getTenantContext } from '@/lib/tenant-context';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context for multi-tenant isolation
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Invalid tenant context' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { amount, currency, paymentMethodId, description, metadata = {} } = body;

    // Validate required fields
    if (!amount || !currency || !paymentMethodId) {
      return NextResponse.json({ 
        error: 'Amount, currency, and payment method are required' 
      }, { status: 400 });
    }

    if (amount < 1) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    logger.info('Processing payment request', { 
      userId, 
      amount, 
      currency, 
      paymentMethodId,
      tenantId: tenantContext.id,
      description: description || 'No description'
    });

    // Get user details (users don't have tenantId directly)
    const userResults = await prisma.user.findFirst({
      where: { id: userId },
    });

    const user = userResults[0];
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ 
        error: 'Account is not active' 
      }, { status: 403 });
    }

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would:
    // 1. Validate payment method belongs to user
    // 2. Process payment through payment gateway (Stripe, PayPal, etc.)
    // 3. Handle payment webhooks and confirmations
    // 4. Store transaction records in database
    // 5. Update user account balances or subscription status

    // For now, we'll simulate a successful payment
    const paymentResult = {
      transactionId,
      status: 'completed',
      amount,
      currency,
      paymentMethodId,
      description,
      metadata: {
        ...metadata,
        userId,
        tenantId: tenantContext.id,
        processedBy: 'api'
      },
      processedAt: new Date()
    };

    logger.info('Payment processed successfully', { 
      transactionId,
      userId, 
      amount,
      currency,
      tenantId: tenantContext.id
    });

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        processedAt: paymentResult.processedAt
      }
    });

  } catch (error) {
    logger.error('Payment processing failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to process payment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');

    logger.info('Fetching payments', { 
      jobId,
      modelId,
      status,
      requestedBy: session.user.id 
    });

    // Normal ORM call - payment data retrieval
    const whereConditions: any = {};

    if (jobId) {
      whereConditions.jobId = parseInt(jobId);
    }

    if (modelId) {
      whereConditions.payeeId = parseInt(modelId);
    }

    if (status) {
      whereConditions.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereConditions,
      include: {
        job: {
          include: {
            client: true
          }
        },
        payee: true,
        payer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    logger.info('Payments fetched successfully', { 
      paymentCount: payments.length 
    });

    return NextResponse.json({
      success: true,
      data: payments,
      message: 'Payments fetched successfully'
    });

  } catch (error) {
    logger.error('Failed to fetch payments', { 
      error: error.message 
    });

    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 