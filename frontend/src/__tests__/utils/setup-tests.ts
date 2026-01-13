import { setupServer } from 'msw/node'
import { handlers } from './mock-handlers'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

export const server = setupServer(...handlers)

// Mock environment
vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://127.0.0.1:8000')

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})
