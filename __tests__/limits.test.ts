import {describe, expect, test} from '@jest/globals'
import {TokenLimits} from '../src/limits'

describe('TokenLimits', () => {
  test('gpt-4-32k', () => {
    const lim = new TokenLimits('gpt-4-32k')
    expect(lim.maxTokens).toBe(32600)
    expect(lim.responseTokens).toBe(4000)
    expect(lim.requestTokens).toBe(28500) // 32600 - 4000 - 100
    expect(lim.knowledgeCutOff).toBe('2021-09-01')
  })

  test('gpt-3.5-turbo-16k', () => {
    const lim = new TokenLimits('gpt-3.5-turbo-16k')
    expect(lim.maxTokens).toBe(16300)
    expect(lim.responseTokens).toBe(3000)
    expect(lim.requestTokens).toBe(13200) // 16300 - 3000 - 100
    expect(lim.knowledgeCutOff).toBe('2021-09-01')
  })

  test('gpt-4', () => {
    const lim = new TokenLimits('gpt-4')
    expect(lim.maxTokens).toBe(8000)
    expect(lim.responseTokens).toBe(2000)
    expect(lim.requestTokens).toBe(5900) // 8000 - 2000 - 100
    expect(lim.knowledgeCutOff).toBe('2021-09-01')
  })

  test('default (e.g., gpt-3.5-turbo)', () => {
    const lim = new TokenLimits('gpt-3.5-turbo')
    expect(lim.maxTokens).toBe(4000)
    expect(lim.responseTokens).toBe(1000)
    expect(lim.requestTokens).toBe(2900) // 4000 - 1000 - 100
    expect(lim.knowledgeCutOff).toBe('2021-09-01')
  })
})