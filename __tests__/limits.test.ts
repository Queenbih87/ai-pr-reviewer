import {describe, expect, test} from '@jest/globals'
import {TokenLimits} from '../src/limits'

describe('TokenLimits Class', () => {
  describe('Constructor with default model', () => {
    test('should create instance with gpt-3.5-turbo defaults', () => {
      const limits = new TokenLimits()
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900) // 4000 - 1000 - 100
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })

    test('should create instance with explicit gpt-3.5-turbo', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('Constructor with gpt-4-32k model', () => {
    test('should create instance with gpt-4-32k limits', () => {
      const limits = new TokenLimits('gpt-4-32k')
      
      expect(limits.maxTokens).toBe(32600)
      expect(limits.responseTokens).toBe(4000)
      expect(limits.requestTokens).toBe(28500) // 32600 - 4000 - 100
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('Constructor with gpt-3.5-turbo-16k model', () => {
    test('should create instance with gpt-3.5-turbo-16k limits', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')
      
      expect(limits.maxTokens).toBe(16300)
      expect(limits.responseTokens).toBe(3000)
      expect(limits.requestTokens).toBe(13200) // 16300 - 3000 - 100
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('Constructor with gpt-4 model', () => {
    test('should create instance with gpt-4 limits', () => {
      const limits = new TokenLimits('gpt-4')
      
      expect(limits.maxTokens).toBe(8000)
      expect(limits.responseTokens).toBe(2000)
      expect(limits.requestTokens).toBe(5900) // 8000 - 2000 - 100
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('Constructor with unknown model', () => {
    test('should default to gpt-3.5-turbo limits for unknown model', () => {
      const limits = new TokenLimits('unknown-model')
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })

    test('should handle empty string model', () => {
      const limits = new TokenLimits('')
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
    })

    test('should handle case-sensitive model names', () => {
      const limits1 = new TokenLimits('GPT-4')
      const limits2 = new TokenLimits('gpt-4')
      
      // Case sensitive - GPT-4 should default to gpt-3.5-turbo
      expect(limits1.maxTokens).toBe(4000)
      expect(limits2.maxTokens).toBe(8000)
    })
  })

  describe('string method', () => {
    test('should return formatted string for gpt-3.5-turbo', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      const result = limits.string()
      
      expect(result).toBe('max_tokens=4000, request_tokens=2900, response_tokens=1000')
    })

    test('should return formatted string for gpt-4-32k', () => {
      const limits = new TokenLimits('gpt-4-32k')
      const result = limits.string()
      
      expect(result).toBe('max_tokens=32600, request_tokens=28500, response_tokens=4000')
    })

    test('should return formatted string for gpt-3.5-turbo-16k', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')
      const result = limits.string()
      
      expect(result).toBe('max_tokens=16300, request_tokens=13200, response_tokens=3000')
    })

    test('should return formatted string for gpt-4', () => {
      const limits = new TokenLimits('gpt-4')
      const result = limits.string()
      
      expect(result).toBe('max_tokens=8000, request_tokens=5900, response_tokens=2000')
    })
  })

  describe('Token calculation logic', () => {
    test('should maintain requestTokens + responseTokens + 100 = maxTokens', () => {
      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k']
      
      for (const model of models) {
        const limits = new TokenLimits(model)
        expect(limits.requestTokens + limits.responseTokens + 100).toBe(limits.maxTokens)
      }
    })

    test('should have requestTokens always less than maxTokens', () => {
      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k']
      
      for (const model of models) {
        const limits = new TokenLimits(model)
        expect(limits.requestTokens).toBeLessThan(limits.maxTokens)
      }
    })

    test('should have responseTokens always less than maxTokens', () => {
      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k']
      
      for (const model of models) {
        const limits = new TokenLimits(model)
        expect(limits.responseTokens).toBeLessThan(limits.maxTokens)
      }
    })
  })

  describe('Model-specific behaviors', () => {
    test('should have largest limits for gpt-4-32k', () => {
      const limits = new TokenLimits('gpt-4-32k')
      const otherModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k']
      
      for (const model of otherModels) {
        const otherLimits = new TokenLimits(model)
        expect(limits.maxTokens).toBeGreaterThan(otherLimits.maxTokens)
        expect(limits.requestTokens).toBeGreaterThan(otherLimits.requestTokens)
        expect(limits.responseTokens).toBeGreaterThanOrEqual(otherLimits.responseTokens)
      }
    })

    test('should have smallest limits for default gpt-3.5-turbo', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      const otherModels = ['gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k']
      
      for (const model of otherModels) {
        const otherLimits = new TokenLimits(model)
        expect(limits.maxTokens).toBeLessThan(otherLimits.maxTokens)
      }
    })
  })

  describe('Knowledge cutoff', () => {
    test('should always have same knowledge cutoff regardless of model', () => {
      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo-16k', 'gpt-4-32k', 'unknown']
      
      for (const model of models) {
        const limits = new TokenLimits(model)
        expect(limits.knowledgeCutOff).toBe('2021-09-01')
      }
    })
  })
})