// Messaging System Components (90% completion)
// Real-time messaging UI with rich features

// Core messaging components
export { MessageComposer } from './MessageComposer';
export { MessageBubble } from './MessageBubble';
export { ConversationHeader } from './ConversationHeader';
export { MessageSearch } from './MessageSearch';
export { MessageNotifications } from './MessageNotifications';

// Type exports for external use
export type {
  MessageComposerProps,
  MessageData,
  Attachment,
  DraftMessage,
  MessageSchedule
} from './MessageComposer';

export type {
  MessageBubbleProps,
  Message,
  Reaction,
  ReadReceipt
} from './MessageBubble';

export type {
  ConversationHeaderProps,
  Conversation,
  Participant,
  ConversationSettings
} from './ConversationHeader';

export type {
  MessageSearchProps,
  SearchParams,
  SearchResult,
  SearchFacet
} from './MessageSearch';

export type {
  MessageNotificationsProps,
  NotificationSettings,
  EmailDigestSettings,
  NotificationSchedule
} from './MessageNotifications';