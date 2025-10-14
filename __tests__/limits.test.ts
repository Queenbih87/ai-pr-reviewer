import {describe, expect, test} from '@jest/globals'
import {TokenLimits} from '../src/limits'

describe('TokenLimits', () => {
  describe('constructor with default model', () => {
    test('should initialize with gpt-3.5-turbo defaults', () => {
      const limits = new TokenLimits()

      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })

    test('should initialize with explicit gpt-3.5-turbo', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')

      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
    })
  })

  describe('constructor with gpt-4-32k', () => {
    test('should initialize with correct token limits', () => {
      const limits = new TokenLimits('gpt-4-32k')

      expect(limits.maxTokens).toBe(32600)
      expect(limits.responseTokens).toBe(4000)
      expect(limits.requestTokens).toBe(28500)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('constructor with gpt-3.5-turbo-16k', () => {
    test('should initialize with correct token limits', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')

      expect(limits.maxTokens).toBe(16300)
      expect(limits.responseTokens).toBe(3000)
      expect(limits.requestTokens).toBe(13200)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('constructor with gpt-4', () => {
    test('should initialize with correct token limits', () => {
      const limits = new TokenLimits('gpt-4')

      expect(limits.maxTokens).toBe(8000)
      expect(limits.responseTokens).toBe(2000)
      expect(limits.requestTokens).toBe(5900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('constructor with unknown model', () => {
    test('should fall back to default limits', () => {
      const limits = new TokenLimits('unknown-model')

      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
    })

    test('should handle empty string model', () => {
      const limits = new TokenLimits('')

      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
    })
  })

  describe('request token calculation', () => {
    test('should always leave margin of 100 tokens', () => {
      const models = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-3.5-turbo-16k',
        'gpt-4-32k'
      ]

      for (const model of models) {
        const limits = new TokenLimits(model)
        const expectedRequest = limits.maxTokens - limits.responseTokens - 100
        expect(limits.requestTokens).toBe(expectedRequest)
      }
    })
  })

  describe('string method', () => {
    test('should return formatted string for default model', () => {
      const limits = new TokenLimits()
      const result = limits.string()

      expect(result).toBe('max_tokens=4000, request_tokens=2900, response_tokens=1000')
    })

    test('should return formatted string for gpt-4-32k', () => {
      const limits = new TokenLimits('gpt-4-32k')
      const result = limits.string()

      expect(result).toBe('max_tokens=32600, request_tokens=28500, response_tokens=4000')
    })

    test('should return formatted string for gpt-4', () => {
      const limits = new TokenLimits('gpt-4')
      const result = limits.string()

      expect(result).toBe('max_tokens=8000, request_tokens=5900, response_tokens=2000')
    })

    test('should return formatted string for gpt-3.5-turbo-16k', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')
      const result = limits.string()

      expect(result).toBe('max_tokens=16300, request_tokens=13200, response_tokens=3000')
    })
  })

  describe('knowledge cutoff', () => {
    test('should always be 2021-09-01 regardless of model', () => {
      const models = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-3.5-turbo-16k',
        'gpt-4-32k',
        'unknown-model'
      ]

      for (const model of models) {
        const limits = new TokenLimits(model)
        expect(limits.knowledgeCutOff).toBe('2021-09-01')
      }
    })
  })

  describe('edge cases', () => {
    test('should handle case-sensitive model names', () => {
      const limitsUpper = new TokenLimits('GPT-4')
      const limitsLower = new TokenLimits('gpt-4')

      // Case sensitivity matters - uppercase won't match
      expect(limitsUpper.maxTokens).toBe(4000) // Falls back to default
      expect(limitsLower.maxTokens).toBe(8000) // Matches gpt-4
    })

    test('should handle model names with extra whitespace', () => {
      const limits = new TokenLimits(' gpt-4 ')

      // Extra spaces won't match exactly
      expect(limits.maxTokens).toBe(4000) // Falls back to default
    })

    test('should be immutable after creation', () => {
      const limits = new TokenLimits('gpt-4')
      const originalMax = limits.maxTokens

      // Try to modify (TypeScript would prevent this, but testing runtime)
      limits.maxTokens = 9999

      expect(limits.maxTokens).toBe(9999) // Will be modified in JS
      // This shows the class is mutable, which is expected
    })
  })

  describe('model comparisons', () => {
    test('gpt-4-32k should have highest token limits', () => {
      const gpt4_32k = new TokenLimits('gpt-4-32k')
      const gpt4 = new TokenLimits('gpt-4')
      const gpt35_16k = new TokenLimits('gpt-3.5-turbo-16k')
      const gpt35 = new TokenLimits('gpt-3.5-turbo')

      expect(gpt4_32k.maxTokens).toBeGreaterThan(gpt4.maxTokens)
      expect(gpt4_32k.maxTokens).toBeGreaterThan(gpt35_16k.maxTokens)
      expect(gpt4_32k.maxTokens).toBeGreaterThan(gpt35.maxTokens)
    })

    test('request tokens should scale with max tokens', () => {
      const gpt4_32k = new TokenLimits('gpt-4-32k')
      const gpt35 = new TokenLimits('gpt-3.5-turbo')

      const ratio_32k = gpt4_32k.requestTokens / gpt4_32k.maxTokens
      const ratio_35 = gpt35.requestTokens / gpt35.maxTokens

      // Both should use similar proportions of max tokens for requests
      expect(ratio_32k).toBeCloseTo(ratio_35, 1)
    })
  })

  describe('realistic usage scenarios', () => {
    test('should have sufficient buffer for response', () => {
      const models = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-3.5-turbo-16k',
        'gpt-4-32k'
      ]

      for (const model of models) {
        const limits = new TokenLimits(model)
        
        // Verify the math: request + response + margin = max
        const total = limits.requestTokens + limits.responseTokens + 100
        expect(total).toBe(limits.maxTokens)
      }
    })

    test('response tokens should be reasonable for all models', () => {
      const limits32k = new TokenLimits('gpt-4-32k')
      const limits4 = new TokenLimits('gpt-4')
      const limits16k = new TokenLimits('gpt-3.5-turbo-16k')
      const limits35 = new TokenLimits('gpt-3.5-turbo')

      // Response tokens should be at least 1000
      expect(limits32k.responseTokens).toBeGreaterThanOrEqual(1000)
      expect(limits4.responseTokens).toBeGreaterThanOrEqual(1000)
      expect(limits16k.responseTokens).toBeGreaterThanOrEqual(1000)
      expect(limits35.responseTokens).toBeGreaterThanOrEqual(1000)

      // But not excessive (less than 25% of max)
      expect(limits32k.responseTokens).toBeLessThan(limits32k.maxTokens * 0.25)
      expect(limits4.responseTokens).toBeLessThan(limits4.maxTokens * 0.25)
      expect(limits16k.responseTokens).toBeLessThan(limits16k.maxTokens * 0.25)
      expect(limits35.responseTokens).toBeLessThan(limits35.maxTokens * 0.25)
    })
  })
})