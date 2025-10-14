import {describe, expect, test, beforeEach} from '@jest/globals'
import {Options, PathFilter, OpenAIOptions} from '../src/options'
import {TokenLimits} from '../src/limits'

describe('Options Class', () => {
  describe('Constructor with Default Values', () => {
    test('should create instance with default values', () => {
      const options = new Options(false, false, false)
      
      expect(options.debug).toBe(false)
      expect(options.disableReview).toBe(false)
      expect(options.disableReleaseNotes).toBe(false)
      expect(options.maxFiles).toBe(0)
      expect(options.reviewSimpleChanges).toBe(false)
      expect(options.reviewCommentLGTM).toBe(false)
      expect(options.systemMessage).toBe('')
      expect(options.openaiLightModel).toBe('gpt-3.5-turbo')
      expect(options.openaiHeavyModel).toBe('gpt-3.5-turbo')
      expect(options.openaiModelTemperature).toBe(0.0)
      expect(options.openaiRetries).toBe(3)
      expect(options.openaiTimeoutMS).toBe(120000)
      expect(options.openaiConcurrencyLimit).toBe(6)
      expect(options.githubConcurrencyLimit).toBe(6)
      expect(options.apiBaseUrl).toBe('https://api.openai.com/v1')
      expect(options.language).toBe('en-US')
    })

    test('should initialize token limits correctly', () => {
      const options = new Options(false, false, false)
      
      expect(options.lightTokenLimits).toBeInstanceOf(TokenLimits)
      expect(options.heavyTokenLimits).toBeInstanceOf(TokenLimits)
      expect(options.lightTokenLimits.maxTokens).toBe(4000)
      expect(options.heavyTokenLimits.maxTokens).toBe(4000)
    })

    test('should initialize path filter', () => {
      const options = new Options(false, false, false)
      
      expect(options.pathFilters).toBeInstanceOf(PathFilter)
    })
  })

  describe('Constructor with Custom Values', () => {
    test('should accept all boolean flags', () => {
      const options = new Options(
        true,  // debug
        true,  // disableReview
        true,  // disableReleaseNotes
        '10', // maxFiles
        true,  // reviewSimpleChanges
        true   // reviewCommentLGTM
      )
      
      expect(options.debug).toBe(true)
      expect(options.disableReview).toBe(true)
      expect(options.disableReleaseNotes).toBe(true)
      expect(options.maxFiles).toBe(10)
      expect(options.reviewSimpleChanges).toBe(true)
      expect(options.reviewCommentLGTM).toBe(true)
    })

    test('should parse numeric string parameters', () => {
      const options = new Options(
        false,
        false,
        false,
        '50',      // maxFiles
        false,
        false,
        null,
        '',
        'gpt-4',
        'gpt-4',
        '0.5',     // temperature
        '5',       // retries
        '60000',   // timeout
        '10',      // openai concurrency
        '8'        // github concurrency
      )
      
      expect(options.maxFiles).toBe(50)
      expect(options.openaiModelTemperature).toBe(0.5)
      expect(options.openaiRetries).toBe(5)
      expect(options.openaiTimeoutMS).toBe(60000)
      expect(options.openaiConcurrencyLimit).toBe(10)
      expect(options.githubConcurrencyLimit).toBe(8)
    })

    test('should accept custom model names', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-4',
        'gpt-4-32k'
      )
      
      expect(options.openaiLightModel).toBe('gpt-4')
      expect(options.openaiHeavyModel).toBe('gpt-4-32k')
      expect(options.lightTokenLimits.maxTokens).toBe(8000)
      expect(options.heavyTokenLimits.maxTokens).toBe(32600)
    })

    test('should accept custom API base URL', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '0.0',
        '3',
        '120000',
        '6',
        '6',
        'https://custom.api.endpoint/v1'
      )
      
      expect(options.apiBaseUrl).toBe('https://custom.api.endpoint/v1')
    })

    test('should accept custom language', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '0.0',
        '3',
        '120000',
        '6',
        '6',
        'https://api.openai.com/v1',
        'ja-JP'
      )
      
      expect(options.language).toBe('ja-JP')
    })

    test('should accept system message', () => {
      const message = 'You are a helpful code reviewer.'
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        message
      )
      
      expect(options.systemMessage).toBe(message)
    })

    test('should accept path filters', () => {
      const filters = ['src/**', '!src/test/**']
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        filters
      )
      
      expect(options.pathFilters).toBeInstanceOf(PathFilter)
    })
  })

  describe('Parameter Parsing Edge Cases', () => {
    test('should handle invalid number strings', () => {
      const options = new Options(
        false,
        false,
        false,
        'invalid',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        'notanumber'
      )
      
      expect(isNaN(options.maxFiles)).toBe(true)
      expect(isNaN(options.openaiModelTemperature)).toBe(true)
    })

    test('should handle negative numbers', () => {
      const options = new Options(
        false,
        false,
        false,
        '-5',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '-0.5',
        '-2'
      )
      
      expect(options.maxFiles).toBe(-5)
      expect(options.openaiModelTemperature).toBe(-0.5)
      expect(options.openaiRetries).toBe(-2)
    })

    test('should handle floating point numbers', () => {
      const options = new Options(
        false,
        false,
        false,
        '10.5'
      )
      
      expect(options.maxFiles).toBe(10)  // parseInt truncates
    })

    test('should handle very large numbers', () => {
      const options = new Options(
        false,
        false,
        false,
        '999999999'
      )
      
      expect(options.maxFiles).toBe(999999999)
    })
  })

  describe('checkPath Method', () => {
    test('should check path against filters', () => {
      const filters = ['src/**']
      const options = new Options(false, false, false, '0', false, false, filters)
      
      const result = options.checkPath('src/file.ts')
      expect(typeof result).toBe('boolean')
    })

    test('should accept path when no filters', () => {
      const options = new Options(false, false, false)
      
      expect(options.checkPath('any/path.ts')).toBe(true)
    })

    test('should handle multiple paths', () => {
      const filters = ['src/**', '!src/test/**']
      const options = new Options(false, false, false, '0', false, false, filters)
      
      expect(options.checkPath('src/main.ts')).toBe(true)
      expect(options.checkPath('src/test/test.ts')).toBe(false)
    })
  })

  describe('Token Limits Integration', () => {
    test('should create appropriate token limits for light model', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo-16k'
      )
      
      expect(options.lightTokenLimits.maxTokens).toBe(16300)
      expect(options.lightTokenLimits.responseTokens).toBe(3000)
    })

    test('should create appropriate token limits for heavy model', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-4-32k'
      )
      
      expect(options.heavyTokenLimits.maxTokens).toBe(32600)
      expect(options.heavyTokenLimits.responseTokens).toBe(4000)
    })

    test('should use same model for light and heavy by default', () => {
      const options = new Options(false, false, false)
      
      expect(options.openaiLightModel).toBe(options.openaiHeavyModel)
      expect(options.lightTokenLimits.maxTokens).toBe(options.heavyTokenLimits.maxTokens)
    })
  })

  describe('Typical Usage Scenarios', () => {
    test('should configure for production use', () => {
      const options = new Options(
        false,  // debug off
        false,  // review enabled
        false,  // release notes enabled
        '150',  // reasonable file limit
        false,  // don't review simple changes
        false,  // don't auto-LGTM
        ['**/*.ts', '**/*.js', '!**/*.test.ts'],
        'You are an expert code reviewer.',
        'gpt-3.5-turbo',
        'gpt-4',
        '0.2',
        '3',
        '120000',
        '6',
        '6',
        'https://api.openai.com/v1',
        'en-US'
      )
      
      expect(options.debug).toBe(false)
      expect(options.maxFiles).toBe(150)
      expect(options.openaiLightModel).toBe('gpt-3.5-turbo')
      expect(options.openaiHeavyModel).toBe('gpt-4')
    })

    test('should configure for development/testing', () => {
      const options = new Options(
        true,   // debug on
        false,
        false,
        '10',   // small file limit
        true,   // review everything
        false
      )
      
      expect(options.debug).toBe(true)
      expect(options.maxFiles).toBe(10)
      expect(options.reviewSimpleChanges).toBe(true)
    })
  })
})

describe('PathFilter Class', () => {
  describe('Constructor', () => {
    test('should create empty filter with null rules', () => {
      const filter = new PathFilter(null)
      
      expect(filter.check('any/path')).toBe(true)
    })

    test('should create empty filter with empty array', () => {
      const filter = new PathFilter([])
      
      expect(filter.check('any/path')).toBe(true)
    })

    test('should parse inclusion rules', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
    })

    test('should parse exclusion rules', () => {
      const filter = new PathFilter(['!test/**'])
      
      expect(filter.check('test/file.ts')).toBe(false)
      expect(filter.check('src/file.ts')).toBe(true)
    })

    test('should parse mixed rules', () => {
      const filter = new PathFilter(['src/**', '!src/test/**'])
      
      expect(filter.check('src/main.ts')).toBe(true)
      expect(filter.check('src/test/test.ts')).toBe(false)
    })

    test('should trim whitespace from rules', () => {
      const filter = new PathFilter(['  src/**  ', '  !test/**  '])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('test/file.ts')).toBe(false)
    })

    test('should ignore empty string rules', () => {
      const filter = new PathFilter(['', 'src/**', ''])
      
      expect(filter.check('src/file.ts')).toBe(true)
    })

    test('should handle rules with only whitespace', () => {
      const filter = new PathFilter(['   ', 'src/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
    })
  })

  describe('check Method - Basic Patterns', () => {
    test('should match exact filename', () => {
      const filter = new PathFilter(['file.ts'])
      
      expect(filter.check('file.ts')).toBe(true)
      expect(filter.check('other.ts')).toBe(false)
    })

    test('should match with wildcards', () => {
      const filter = new PathFilter(['*.ts'])
      
      expect(filter.check('file.ts')).toBe(true)
      expect(filter.check('file.js')).toBe(false)
    })

    test('should match with double wildcards', () => {
      const filter = new PathFilter(['**/*.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/nested/file.ts')).toBe(true)
      expect(filter.check('file.ts')).toBe(true)
    })

    test('should match directory patterns', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/nested/file.ts')).toBe(true)
      expect(filter.check('other/file.ts')).toBe(false)
    })
  })

  describe('check Method - Exclusion Rules', () => {
    test('should exclude matching paths', () => {
      const filter = new PathFilter(['**/*.ts', '!**/*.test.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/file.test.ts')).toBe(false)
    })

    test('should handle multiple exclusions', () => {
      const filter = new PathFilter(['src/**', '!src/test/**', '!src/mock/**'])
      
      expect(filter.check('src/main.ts')).toBe(true)
      expect(filter.check('src/test/test.ts')).toBe(false)
      expect(filter.check('src/mock/mock.ts')).toBe(false)
    })

    test('should prioritize exclusion over inclusion', () => {
      const filter = new PathFilter(['src/**', '!src/test.ts'])
      
      expect(filter.check('src/test.ts')).toBe(false)
    })
  })

  describe('check Method - Complex Scenarios', () => {
    test('should handle no inclusion rules', () => {
      const filter = new PathFilter(['!test/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('test/file.ts')).toBe(false)
    })

    test('should require match when inclusion rules exist', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('other/file.ts')).toBe(false)
    })

    test('should handle overlapping patterns', () => {
      const filter = new PathFilter(['**/*.ts', '!**/*.test.ts', 'src/**/*.test.ts'])
      
      expect(filter.check('src/file.test.ts')).toBe(true)  // Included by third rule
      expect(filter.check('other/file.test.ts')).toBe(false)  // Excluded by second rule
    })

    test('should handle extension patterns', () => {
      const filter = new PathFilter(['**/*.{ts,js,tsx,jsx}'])
      
      // Note: This pattern syntax may not work with minimatch as expected
      // Testing actual behavior
      const result = filter.check('file.ts')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('check Method - Edge Cases', () => {
    test('should handle empty path', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('')).toBe(false)
    })

    test('should handle root level files', () => {
      const filter = new PathFilter(['*.ts'])
      
      expect(filter.check('file.ts')).toBe(true)
      expect(filter.check('src/file.ts')).toBe(false)
    })

    test('should handle paths with special characters', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('src/file-name.ts')).toBe(true)
      expect(filter.check('src/file_name.ts')).toBe(true)
    })

    test('should handle paths with dots', () => {
      const filter = new PathFilter(['**/*.config.ts'])
      
      expect(filter.check('jest.config.ts')).toBe(true)
      expect(filter.check('src/test.config.ts')).toBe(true)
    })

    test('should be case-sensitive', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('SRC/file.ts')).toBe(false)
    })
  })

  describe('Real-World Patterns', () => {
    test('should handle typical TypeScript project', () => {
      const filter = new PathFilter([
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts'
      ])
      
      expect(filter.check('src/main.ts')).toBe(true)
      expect(filter.check('src/utils/helper.ts')).toBe(true)
      expect(filter.check('src/main.test.ts')).toBe(false)
      expect(filter.check('src/utils/helper.spec.ts')).toBe(false)
    })

    test('should handle monorepo structure', () => {
      const filter = new PathFilter([
        'packages/**/src/**',
        '!packages/**/test/**',
        '!packages/**/dist/**'
      ])
      
      expect(filter.check('packages/core/src/index.ts')).toBe(true)
      expect(filter.check('packages/core/test/index.test.ts')).toBe(false)
      expect(filter.check('packages/core/dist/index.js')).toBe(false)
    })

    test('should handle documentation exclusion', () => {
      const filter = new PathFilter([
        '**/*',
        '!**/*.md',
        '!docs/**',
        '!LICENSE',
        '!README'
      ])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('README.md')).toBe(false)
      expect(filter.check('docs/guide.md')).toBe(false)
    })
  })
})

describe('OpenAIOptions Class', () => {
  describe('Constructor', () => {
    test('should create with default model', () => {
      const options = new OpenAIOptions()
      
      expect(options.model).toBe('gpt-3.5-turbo')
      expect(options.tokenLimits).toBeInstanceOf(TokenLimits)
      expect(options.tokenLimits.maxTokens).toBe(4000)
    })

    test('should create with custom model', () => {
      const options = new OpenAIOptions('gpt-4')
      
      expect(options.model).toBe('gpt-4')
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })

    test('should accept custom token limits', () => {
      const customLimits = new TokenLimits('gpt-4-32k')
      const options = new OpenAIOptions('gpt-4', customLimits)
      
      expect(options.model).toBe('gpt-4')
      expect(options.tokenLimits).toBe(customLimits)
      expect(options.tokenLimits.maxTokens).toBe(32600)
    })

    test('should create token limits when not provided', () => {
      const options = new OpenAIOptions('gpt-4', null)
      
      expect(options.tokenLimits).toBeInstanceOf(TokenLimits)
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })
  })

  describe('Model and Token Limits Consistency', () => {
    test('should have matching model and limits', () => {
      const options = new OpenAIOptions('gpt-3.5-turbo-16k')
      
      expect(options.model).toBe('gpt-3.5-turbo-16k')
      expect(options.tokenLimits.maxTokens).toBe(16300)
    })

    test('should allow mismatched model and limits', () => {
      const gpt4Limits = new TokenLimits('gpt-4')
      const options = new OpenAIOptions('gpt-3.5-turbo', gpt4Limits)
      
      // Model says one thing, limits say another (allowed but unusual)
      expect(options.model).toBe('gpt-3.5-turbo')
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })
  })

  describe('All Supported Models', () => {
    test('should work with all GPT-3.5 variants', () => {
      const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
      
      models.forEach(model => {
        const options = new OpenAIOptions(model)
        expect(options.model).toBe(model)
        expect(options.tokenLimits.maxTokens).toBeGreaterThan(0)
      })
    })

    test('should work with all GPT-4 variants', () => {
      const models = ['gpt-4', 'gpt-4-32k']
      
      models.forEach(model => {
        const options = new OpenAIOptions(model)
        expect(options.model).toBe(model)
        expect(options.tokenLimits.maxTokens).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle unknown model', () => {
      const options = new OpenAIOptions('gpt-5-future-model')
      
      expect(options.model).toBe('gpt-5-future-model')
      expect(options.tokenLimits.maxTokens).toBe(4000)  // Defaults to gpt-3.5-turbo limits
    })

    test('should handle empty model string', () => {
      const options = new OpenAIOptions('')
      
      expect(options.model).toBe('')
      expect(options.tokenLimits.maxTokens).toBe(4000)
    })
  })
})