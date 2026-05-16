import { useQuery } from '@tanstack/react-query'
import { CONVERSATIONS } from '../mock/messages'
import type { Conversation } from '../mock/messages'
import { apiOrMock, landxApi } from '../api'
import { messageKeys } from './keys'
import { mockAsync } from './mock-latency'

// Wave 18 / Faz 12.12.b — SDK adoption. Hooks now go through
// `landxApi.messages.*`. apiOrMock wrapper + mock fallback stay.
//
// Wave 19 / Faz 12.12.c — A88 lifted Conversation/ConversationSummary/Message
// into openapi.yaml with shapes identical to the @landx/data domain types
// (contract `Conversation` = `ConversationSummary & { messages: Message[] }`).
//
// `listConversations` returns the slim `ConversationSummary[]` (no embedded
// thread). The domain `Conversation` requires `messages: Message[]`, so we
// hydrate each summary with an empty `messages: []` at the projection layer
// — this is a deliberate domain↔wire reshape, not a type-system patch.
// UI only reads `messages` after `useConversation` (detail fetch).

export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: () =>
      apiOrMock<Conversation[]>(
        () =>
          landxApi.messages
            .listConversations()
            .then((env) => env.data.map((c) => ({ ...c, messages: [] }))),
        () => mockAsync(CONVERSATIONS),
      ),
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: messageKeys.conversation(id),
    queryFn: () =>
      apiOrMock(
        () => landxApi.messages.getConversation(id).then((env) => env.data),
        () => mockAsync(CONVERSATIONS.find((c) => c.id === id) ?? null),
      ),
    enabled: !!id,
  })
}
