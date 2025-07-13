import { SetMetadata } from '@nestjs/common';

export const QUEUE_HANDLER_METADATA = 'queue_handler';

export interface QueueHandlerOptions {
  pattern: string;
  maxRetries?: number;
  timeout?: number;
  deadLetterQueue?: string;
}

export const QueueHandler = (options: QueueHandlerOptions) =>
  SetMetadata(QUEUE_HANDLER_METADATA, options);