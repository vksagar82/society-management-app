/// <reference types="../vitest-env.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import '../utils/setup-tests'

describe('API Library', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      localStorage.setItem('refresh_token', 'mock-refresh-token')

      const newToken = await api.refreshAccessToken()

      expect(newToken).toBe('new-mock-access-token')
      expect(localStorage.getItem('access_token')).toBe('new-mock-access-token')
    })

    it('should return null when no refresh token exists', async () => {
      const newToken = await api.refreshAccessToken()

      expect(newToken).toBeNull()
    })

    it('should clear tokens when refresh fails', async () => {
      localStorage.setItem('refresh_token', 'invalid-token')
      localStorage.setItem('access_token', 'old-token')

      const newToken = await api.refreshAccessToken()

      expect(newToken).toBeNull()
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('request', () => {
    it('should make successful GET request', async () => {
      localStorage.setItem('access_token', 'mock-access-token')

      const response = (await api.request('/api/v1/users/me')) as any

      expect(response).toBeTruthy()
      expect(response.email).toBe('admin@test.com')
    })

    it('should make successful POST request', async () => {
      const response = (await api.request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'password123',
        }),
      })) as any

      expect(response).toBeTruthy()
      expect(response.access_token).toBe('mock-access-token')
    })

    it('should include authorization header when token exists', async () => {
      localStorage.setItem('access_token', 'test-token')

      await api.request('/api/v1/users/me')

      // Token should be included in the request
      expect(localStorage.getItem('access_token')).toBe('test-token')
    })
  })

  describe('get', () => {
    it('should make GET request', async () => {
      localStorage.setItem('access_token', 'mock-access-token')

      const response = (await api.get('/api/v1/users/me')) as any

      expect(response).toBeTruthy()
      expect(response.email).toBe('admin@test.com')
    })
  })

  describe('post', () => {
    it('should make POST request', async () => {
      const response = (await api.post('/api/v1/auth/login', {
        email: 'admin@test.com',
        password: 'password123',
      })) as any

      expect(response).toBeTruthy()
      expect(response.access_token).toBe('mock-access-token')
    })
  })
})
