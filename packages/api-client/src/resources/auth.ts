/**
 * Auth resource — login (public), logout, getMe, refresh.
 */
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRefreshResponse,
  User,
} from '@landx/api-types'
import type { ItemResponse, Transport } from '../types'

export function authResource(t: Transport) {
  return {
    login: (input: AuthLoginRequest) =>
      t.post<ItemResponse<AuthLoginResponse>>('/auth/login', input),
    logout: () => t.post<void>('/auth/logout'),
    me: () => t.get<ItemResponse<User>>('/auth/me'),
    refresh: () => t.post<ItemResponse<AuthRefreshResponse>>('/auth/refresh'),
  }
}

export type AuthResource = ReturnType<typeof authResource>
