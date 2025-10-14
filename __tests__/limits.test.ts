import { TokenLimits } from '../src/limits'

describe('TokenLimits', () => {
  test('default (gpt-3.5-turbo)', () => {
    const t = new TokenLimits('gpt-3.5-turbo')
    expect(t.maxTokens).toBe(4000)
    expect(t.responseTokens).toBe(1000)
    // 4000 - 1000 - 100 margin
    expect(t.requestTokens).toBe(2900)
    expect(t.knowledgeCutOff).toBe('2021-09-01')
  })

  test('gpt-3.5-turbo-16k', () => {
    const t = new TokenLimits('gpt-3.5-turbo-16k')
    expect(t.maxTokens).toBe(16300)
    expect(t.responseTokens).toBe(3000)
    // 16300 - 3000 - 100 margin
    expect(t.requestTokens).toBe(13200)
  })

  test('gpt-4', () => {
    const t = new TokenLimits('gpt-4')
    expect(t.maxTokens).toBe(8000)
    expect(t.responseTokens).toBe(2000)
    // 8000 - 2000 - 100 margin
    expect(t.requestTokens).toBe(5900)
  })

  test('gpt-4-32k', () => {
    const t = new TokenLimits('gpt-4-32k')
    expect(t.maxTokens).toBe(32600)
    expect(t.responseTokens).toBe(4000)
    // 32600 - 4000 - 100 margin
    expect(t.requestTokens).toBe(28500)
  })

  test('string() gives a concise summary', () => {
    const t = new TokenLimits('gpt-3.5-turbo')
    const s = t.string()
    expect(s).toContain('max_tokens=')
    expect(s).toContain('request_tokens=')
    expect(s).toContain('response_tokens=')
  })
})