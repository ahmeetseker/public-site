/**
 * Messages resource — list conversations (slim), get thread (with messages).
 */
import type {
  Conversation,
  ConversationSummary,
  operations,
} from '@landx/api-types'
import type { ItemResponse, ListResponse, Transport } from '../types'

export type ConversationListQuery = NonNullable<operations['listConversations']['parameters']['query']>

export function messagesResource(t: Transport) {
  return {
    listConversations: (params?: ConversationListQuery) =>
      t.get<ListResponse<ConversationSummary>>(
        '/messages/conversations',
        params as Record<string, unknown> | undefined,
      ),
    getConversation: (id: string) =>
      t.get<ItemResponse<Conversation>>(`/messages/conversations/${encodeURIComponent(id)}`),
  }
}

export type MessagesResource = ReturnType<typeof messagesResource>
