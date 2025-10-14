import {describe, expect, test} from '@jest/globals'
import {TokenLimits} from '../src/limits'

describe('TokenLimits Class', () => {
  describe('Constructor with Default Model', () => {
    test('should create instance with default gpt-3.5-turbo settings', () => {
      const limits = new TokenLimits()
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })

    test('should calculate request tokens as maxTokens - responseTokens - 100', () => {
      const limits = new TokenLimits()
      
      expect(limits.requestTokens).toBe(limits.maxTokens - limits.responseTokens - 100)
    })
  })

  describe('Constructor with GPT-4 Models', () => {
    test('should use gpt-4 limits', () => {
      const limits = new TokenLimits('gpt-4')
      
      expect(limits.maxTokens).toBe(8000)
      expect(limits.responseTokens).toBe(2000)
      expect(limits.requestTokens).toBe(5900)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })

    test('should use gpt-4-32k limits', () => {
      const limits = new TokenLimits('gpt-4-32k')
      
      expect(limits.maxTokens).toBe(32600)
      expect(limits.responseTokens).toBe(4000)
      expect(limits.requestTokens).toBe(28500)
      expect(limits.knowledgeCutOff).toBe('2021-09-01')
    })
  })

  describe('Constructor with GPT-3.5 Models', () => {
    test('should use gpt-3.5-turbo limits (explicit)', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
      expect(limits.requestTokens).toBe(2900)
    })

    test('should use gpt-3.5-turbo-16k limits', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')
      
      expect(limits.maxTokens).toBe(16300)
      expect(limits.responseTokens).toBe(3000)
      expect(limits.requestTokens).toBe(13200)
    })
  })

  describe('Constructor with Unknown Models', () => {
    test('should default to gpt-3.5-turbo limits for unknown model', () => {
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

    test('should handle null model', () => {
      const limits = new TokenLimits(null as any)
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
    })

    test('should handle undefined model', () => {
      const limits = new TokenLimits(undefined)
      
      expect(limits.maxTokens).toBe(4000)
      expect(limits.responseTokens).toBe(1000)
    })
  })

  describe('Case Sensitivity', () => {
    test('should be case-sensitive for model names', () => {
      const limits1 = new TokenLimits('GPT-4')
      const limits2 = new TokenLimits('Gpt-4')
      
      // Should default to gpt-3.5-turbo since case doesn't match
      expect(limits1.maxTokens).toBe(4000)
      expect(limits2.maxTokens).toBe(4000)
    })

    test('should match exact case for gpt-4', () => {
      const limitsLower = new TokenLimits('gpt-4')
      const limitsUpper = new TokenLimits('GPT-4')
      
      expect(limitsLower.maxTokens).toBe(8000)
      expect(limitsUpper.maxTokens).toBe(4000)  // Defaults due to case mismatch
    })
  })

  describe('String Method', () => {
    test('should return formatted string for default model', () => {
      const limits = new TokenLimits()
      const result = limits.string()
      
      expect(result).toBe('max_tokens=4000, request_tokens=2900, response_tokens=1000')
    })

    test('should return formatted string for gpt-4', () => {
      const limits = new TokenLimits('gpt-4')
      const result = limits.string()
      
      expect(result).toBe('max_tokens=8000, request_tokens=5900, response_tokens=2000')
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

    test('should format numbers without decimal places', () => {
      const limits = new TokenLimits()
      const result = limits.string()
      
      expect(result).not.toContain('.')
      expect(result).toMatch(/\d+/g)
    })
  })

  describe('Token Calculation Logic', () => {
    test('should maintain 100 token margin for all models', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      
      models.forEach(model => {
        const limits = new TokenLimits(model)
        const margin = limits.maxTokens - limits.responseTokens - limits.requestTokens
        expect(margin).toBe(100)
      })
    })

    test('should ensure requestTokens is always positive', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      
      models.forEach(model => {
        const limits = new TokenLimits(model)
        expect(limits.requestTokens).toBeGreaterThan(0)
      })
    })

    test('should ensure responseTokens is less than maxTokens', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      
      models.forEach(model => {
        const limits = new TokenLimits(model)
        expect(limits.responseTokens).toBeLessThan(limits.maxTokens)
      })
    })

    test('should ensure requestTokens is less than maxTokens', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      
      models.forEach(model => {
        const limits = new TokenLimits(model)
        expect(limits.requestTokens).toBeLessThan(limits.maxTokens)
      })
    })
  })

  describe('Model-Specific Ratios', () => {
    test('gpt-3.5-turbo should use 25% response ratio', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      const responseRatio = limits.responseTokens / limits.maxTokens
      
      expect(responseRatio).toBeCloseTo(0.25, 2)
    })

    test('gpt-4-32k should use ~12% response ratio', () => {
      const limits = new TokenLimits('gpt-4-32k')
      const responseRatio = limits.responseTokens / limits.maxTokens
      
      expect(responseRatio).toBeCloseTo(0.123, 2)
    })

    test('gpt-3.5-turbo-16k should use ~18% response ratio', () => {
      const limits = new TokenLimits('gpt-3.5-turbo-16k')
      const responseRatio = limits.responseTokens / limits.maxTokens
      
      expect(responseRatio).toBeCloseTo(0.184, 2)
    })

    test('gpt-4 should use 25% response ratio', () => {
      const limits = new TokenLimits('gpt-4')
      const responseRatio = limits.responseTokens / limits.maxTokens
      
      expect(responseRatio).toBeCloseTo(0.25, 2)
    })
  })

  describe('Knowledge Cutoff', () => {
    test('should set knowledge cutoff for all models', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k', 'unknown']
      
      models.forEach(model => {
        const limits = new TokenLimits(model)
        expect(limits.knowledgeCutOff).toBe('2021-09-01')
      })
    })

    test('should use ISO date format', () => {
      const limits = new TokenLimits()
      
      expect(limits.knowledgeCutOff).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('Immutability Expectations', () => {
    test('should have readonly-like behavior for properties', () => {
      const limits = new TokenLimits('gpt-4')
      const originalMax = limits.maxTokens
      
      // Properties should be settable (TypeScript doesn't enforce readonly at runtime)
      // But we can verify initial values are as expected
      expect(limits.maxTokens).toBe(originalMax)
      expect(limits.maxTokens).toBe(8000)
    })
  })

  describe('Edge Cases and Boundary Values', () => {
    test('should handle model name with extra whitespace', () => {
      const limits = new TokenLimits('  gpt-4  ')
      
      // Will not match due to whitespace, should default
      expect(limits.maxTokens).toBe(4000)
    })

    test('should handle model name with different case', () => {
      const limits = new TokenLimits('GPT-3.5-turbo')
      
      // Case sensitive, should default
      expect(limits.maxTokens).toBe(4000)
    })

    test('should handle similar but non-exact model names', () => {
      const limits1 = new TokenLimits('gpt-4-')
      const limits2 = new TokenLimits('gpt-4-32')
      const limits3 = new TokenLimits('gpt-4-32k-extra')
      
      expect(limits1.maxTokens).toBe(4000)
      expect(limits2.maxTokens).toBe(4000)
      expect(limits3.maxTokens).toBe(4000)
    })
  })

  describe('Model Comparison', () => {
    test('gpt-4-32k should have largest capacity', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      const limits = models.map(m => new TokenLimits(m))
      
      const maxCapacity = Math.max(...limits.map(l => l.maxTokens))
      expect(maxCapacity).toBe(32600)
    })

    test('gpt-3.5-turbo should have smallest capacity', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k']
      const limits = models.map(m => new TokenLimits(m))
      
      const minCapacity = Math.min(...limits.map(l => l.maxTokens))
      expect(minCapacity).toBe(4000)
    })

    test('should have correct ordering of capacities', () => {
      const gpt35 = new TokenLimits('gpt-3.5-turbo')
      const gpt4 = new TokenLimits('gpt-4')
      const gpt3516k = new TokenLimits('gpt-3.5-turbo-16k')
      const gpt432k = new TokenLimits('gpt-4-32k')
      
      expect(gpt35.maxTokens).toBeLessThan(gpt4.maxTokens)
      expect(gpt4.maxTokens).toBeLessThan(gpt3516k.maxTokens)
      expect(gpt3516k.maxTokens).toBeLessThan(gpt432k.maxTokens)
    })
  })

  describe('Integration with Typical Usage', () => {
    test('should provide reasonable limits for code review', () => {
      const limits = new TokenLimits('gpt-4')
      
      // Should have enough tokens for typical code review
      expect(limits.requestTokens).toBeGreaterThan(5000)
      expect(limits.responseTokens).toBeGreaterThan(1000)
    })

    test('should work with summary generation (light model)', () => {
      const limits = new TokenLimits('gpt-3.5-turbo')
      
      // Should have enough for summaries
      expect(limits.requestTokens).toBeGreaterThan(2000)
      expect(limits.responseTokens).toBeGreaterThan(500)
    })

    test('should work with detailed review (heavy model)', () => {
      const limits = new TokenLimits('gpt-4-32k')
      
      // Should have substantial capacity for detailed reviews
      expect(limits.requestTokens).toBeGreaterThan(25000)
      expect(limits.responseTokens).toBeGreaterThan(3000)
    })
  })

  describe('String Representation Consistency', () => {
    test('should produce consistent string output', () => {
      const limits1 = new TokenLimits('gpt-4')
      const limits2 = new TokenLimits('gpt-4')
      
      expect(limits1.string()).toBe(limits2.string())
    })

    test('should produce different strings for different models', () => {
      const limits1 = new TokenLimits('gpt-3.5-turbo')
      const limits2 = new TokenLimits('gpt-4')
      
      expect(limits1.string()).not.toBe(limits2.string())
    })

    test('should include all three metrics in string', () => {
      const limits = new TokenLimits()
      const str = limits.string()
      
      expect(str).toContain('max_tokens')
      expect(str).toContain('request_tokens')
      expect(str).toContain('response_tokens')
    })

    test('should use consistent formatting', () => {
      const limits = new TokenLimits()
      const str = limits.string()
      
      expect(str).toMatch(/^max_tokens=\d+, request_tokens=\d+, response_tokens=\d+$/)
    })
  })
})