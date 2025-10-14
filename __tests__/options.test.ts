import {describe, expect, test, jest, beforeEach, afterEach} from '@jest/globals'
import {Options, PathFilter, OpenAIOptions} from '../src/options'
import {TokenLimits} from '../src/limits'

// Mock @actions/core
const mockInfo = jest.fn()
jest.mock('@actions/core', () => ({
  info: mockInfo
}))

describe('PathFilter', () => {
  describe('constructor', () => {
    test('should create empty filter with null rules', () => {
      const filter = new PathFilter(null)
      expect(filter.check('any/path')).toBe(true)
    })

    test('should create empty filter with empty array', () => {
      const filter = new PathFilter([])
      expect(filter.check('any/path')).toBe(true)
    })

    test('should parse inclusion rules', () => {
      const filter = new PathFilter(['*.ts', '*.js'])
      expect(filter.check('test.ts')).toBe(true)
      expect(filter.check('test.js')).toBe(true)
    })

    test('should parse exclusion rules with ! prefix', () => {
      const filter = new PathFilter(['*.ts', '!*.test.ts'])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('src/test.test.ts')).toBe(false)
    })

    test('should trim whitespace from rules', () => {
      const filter = new PathFilter(['  *.ts  ', '  !*.test.ts  '])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('src/test.test.ts')).toBe(false)
    })

    test('should ignore empty rule strings', () => {
      const filter = new PathFilter(['*.ts', '', '  ', '*.js'])
      expect(filter.check('test.ts')).toBe(true)
      expect(filter.check('test.js')).toBe(true)
    })
  })

  describe('check method', () => {
    test('should return true for all paths with no rules', () => {
      const filter = new PathFilter([])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('README.md')).toBe(true)
      expect(filter.check('package.json')).toBe(true)
    })

    test('should match simple glob patterns', () => {
      const filter = new PathFilter(['*.ts'])
      expect(filter.check('index.ts')).toBe(true)
      expect(filter.check('index.js')).toBe(false)
    })

    test('should match directory patterns', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('src/sub/test.ts')).toBe(true)
      expect(filter.check('lib/index.ts')).toBe(false)
    })

    test('should handle exclusion patterns', () => {
      const filter = new PathFilter(['src/**/*.ts', '!**/*.test.ts'])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('src/index.test.ts')).toBe(false)
    })

    test('should prioritize exclusions over inclusions', () => {
      const filter = new PathFilter(['**/*.ts', '!src/excluded.ts'])
      expect(filter.check('src/included.ts')).toBe(true)
      expect(filter.check('src/excluded.ts')).toBe(false)
    })

    test('should require at least one inclusion match when inclusion rules exist', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      expect(filter.check('lib/index.ts')).toBe(false)
      expect(filter.check('src/index.ts')).toBe(true)
    })

    test('should allow all paths when only exclusions exist', () => {
      const filter = new PathFilter(['!**/*.test.ts', '!**/*.spec.ts'])
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('src/index.test.ts')).toBe(false)
      expect(filter.check('src/index.spec.ts')).toBe(false)
    })

    test('should handle complex multi-rule scenarios', () => {
      const filter = new PathFilter([
        'src/**/*.ts',
        'lib/**/*.ts',
        '!**/*.test.ts',
        '!**/*.spec.ts'
      ])
      
      expect(filter.check('src/index.ts')).toBe(true)
      expect(filter.check('lib/util.ts')).toBe(true)
      expect(filter.check('src/index.test.ts')).toBe(false)
      expect(filter.check('lib/util.spec.ts')).toBe(false)
      expect(filter.check('other/file.ts')).toBe(false)
    })
  })

  describe('edge cases', () => {
    test('should handle paths with special characters', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      expect(filter.check('src/file-name.ts')).toBe(true)
      expect(filter.check('src/file_name.ts')).toBe(true)
      expect(filter.check('src/file.name.ts')).toBe(true)
    })

    test('should handle empty path string', () => {
      const filter = new PathFilter(['**/*.ts'])
      expect(filter.check('')).toBe(false)
    })

    test('should be case sensitive', () => {
      const filter = new PathFilter(['*.ts'])
      expect(filter.check('file.ts')).toBe(true)
      expect(filter.check('file.TS')).toBe(false)
    })
  })
})

describe('OpenAIOptions', () => {
  describe('constructor', () => {
    test('should initialize with default model', () => {
      const options = new OpenAIOptions()
      
      expect(options.model).toBe('gpt-3.5-turbo')
      expect(options.tokenLimits).toBeInstanceOf(TokenLimits)
      expect(options.tokenLimits.maxTokens).toBe(4000)
    })

    test('should initialize with custom model', () => {
      const options = new OpenAIOptions('gpt-4')
      
      expect(options.model).toBe('gpt-4')
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })

    test('should use provided token limits', () => {
      const customLimits = new TokenLimits('gpt-4-32k')
      const options = new OpenAIOptions('gpt-3.5-turbo', customLimits)
      
      expect(options.model).toBe('gpt-3.5-turbo')
      expect(options.tokenLimits).toBe(customLimits)
      expect(options.tokenLimits.maxTokens).toBe(32600)
    })

    test('should create token limits from model if not provided', () => {
      const options = new OpenAIOptions('gpt-4')
      
      expect(options.tokenLimits.maxTokens).toBe(8000)
      expect(options.tokenLimits.responseTokens).toBe(2000)
    })
  })
})

describe('Options', () => {
  beforeEach(() => {
    mockInfo.mockClear()
  })

  describe('constructor', () => {
    test('should initialize with default values', () => {
      const options = new Options(
        false, // debug
        false, // disableReview
        false  // disableReleaseNotes
      )

      expect(options.debug).toBe(false)
      expect(options.disableReview).toBe(false)
      expect(options.disableReleaseNotes).toBe(false)
      expect(options.maxFiles).toBe(0)
      expect(options.reviewSimpleChanges).toBe(false)
      expect(options.reviewCommentLGTM).toBe(false)
      expect(options.pathFilters).toBeInstanceOf(PathFilter)
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

    test('should parse string parameters correctly', () => {
      const options = new Options(
        true,
        true,
        true,
        '10',
        true,
        true,
        ['*.ts'],
        'custom system message',
        'gpt-4',
        'gpt-4-32k',
        '0.5',
        '5',
        '60000',
        '10',
        '8',
        'https://custom.api.com',
        'es-ES'
      )

      expect(options.maxFiles).toBe(10)
      expect(options.openaiModelTemperature).toBe(0.5)
      expect(options.openaiRetries).toBe(5)
      expect(options.openaiTimeoutMS).toBe(60000)
      expect(options.openaiConcurrencyLimit).toBe(10)
      expect(options.githubConcurrencyLimit).toBe(8)
    })

    test('should initialize token limits for both models', () => {
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
        'gpt-4'
      )

      expect(options.lightTokenLimits.maxTokens).toBe(4000)
      expect(options.heavyTokenLimits.maxTokens).toBe(8000)
    })

    test('should handle custom path filters', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        ['src/**/*.ts', '!**/*.test.ts']
      )

      expect(options.pathFilters.check('src/index.ts')).toBe(true)
      expect(options.pathFilters.check('src/index.test.ts')).toBe(false)
    })
  })

  describe('print method', () => {
    test('should log all configuration values', () => {
      const options = new Options(
        true,
        false,
        true,
        '5',
        true,
        false,
        ['*.ts'],
        'test system',
        'gpt-4',
        'gpt-4-32k'
      )

      options.print()

      expect(mockInfo).toHaveBeenCalledWith('debug: true')
      expect(mockInfo).toHaveBeenCalledWith('disable_review: false')
      expect(mockInfo).toHaveBeenCalledWith('disable_release_notes: true')
      expect(mockInfo).toHaveBeenCalledWith('max_files: 5')
      expect(mockInfo).toHaveBeenCalledWith('review_simple_changes: true')
      expect(mockInfo).toHaveBeenCalledWith('review_comment_lgtm: false')
      expect(mockInfo).toHaveBeenCalledWith('system_message: test system')
      expect(mockInfo).toHaveBeenCalledWith('openai_light_model: gpt-4')
      expect(mockInfo).toHaveBeenCalledWith('openai_heavy_model: gpt-4-32k')
    })
  })

  describe('checkPath method', () => {
    test('should check path against filters and log result', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        ['src/**/*.ts']
      )

      const result1 = options.checkPath('src/index.ts')
      expect(result1).toBe(true)
      expect(mockInfo).toHaveBeenCalledWith('checking path: src/index.ts => true')

      mockInfo.mockClear()

      const result2 = options.checkPath('lib/index.ts')
      expect(result2).toBe(false)
      expect(mockInfo).toHaveBeenCalledWith('checking path: lib/index.ts => false')
    })

    test('should return true for all paths when no filters', () => {
      const options = new Options(false, false, false)

      expect(options.checkPath('any/file.ts')).toBe(true)
      expect(options.checkPath('another/file.js')).toBe(true)
    })
  })

  describe('temperature parsing', () => {
    test('should parse temperature as float', () => {
      const options = new Options(
        false, false, false, '0', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '0.7'
      )
      expect(options.openaiModelTemperature).toBe(0.7)
    })

    test('should handle integer temperature', () => {
      const options = new Options(
        false, false, false, '0', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '1'
      )
      expect(options.openaiModelTemperature).toBe(1.0)
    })

    test('should handle temperature with multiple decimals', () => {
      const options = new Options(
        false, false, false, '0', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '0.123'
      )
      expect(options.openaiModelTemperature).toBe(0.123)
    })
  })

  describe('edge cases', () => {
    test('should handle invalid number strings', () => {
      const options = new Options(
        false, false, false, 'invalid', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', 'invalid'
      )
      
      expect(options.maxFiles).toBeNaN()
      expect(options.openaiModelTemperature).toBeNaN()
    })

    test('should handle negative numbers', () => {
      const options = new Options(
        false, false, false, '-5', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '-0.5', '-3', '-1000'
      )
      
      expect(options.maxFiles).toBe(-5)
      expect(options.openaiModelTemperature).toBe(-0.5)
      expect(options.openaiRetries).toBe(-3)
      expect(options.openaiTimeoutMS).toBe(-1000)
    })

    test('should handle very large numbers', () => {
      const options = new Options(
        false, false, false, '999999', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '2.0', '100', '999999999'
      )
      
      expect(options.maxFiles).toBe(999999)
      expect(options.openaiRetries).toBe(100)
      expect(options.openaiTimeoutMS).toBe(999999999)
    })

    test('should handle empty string parameters', () => {
      const options = new Options(
        false, false, false, '', false, false, null, '',
        '', '', '', '', '', '', ''
      )
      
      expect(options.systemMessage).toBe('')
      expect(options.openaiLightModel).toBe('')
      expect(options.openaiHeavyModel).toBe('')
    })
  })

  describe('realistic configuration scenarios', () => {
    test('should support high-throughput configuration', () => {
      const options = new Options(
        false, false, false, '100', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '0.0', '5', '300000', '20', '20'
      )

      expect(options.maxFiles).toBe(100)
      expect(options.openaiConcurrencyLimit).toBe(20)
      expect(options.githubConcurrencyLimit).toBe(20)
      expect(options.openaiTimeoutMS).toBe(300000)
    })

    test('should support conservative configuration', () => {
      const options = new Options(
        true, false, false, '10', false, false, null, '',
        'gpt-3.5-turbo', 'gpt-3.5-turbo', '0.0', '3', '120000', '2', '2'
      )

      expect(options.debug).toBe(true)
      expect(options.maxFiles).toBe(10)
      expect(options.openaiConcurrencyLimit).toBe(2)
      expect(options.githubConcurrencyLimit).toBe(2)
    })

    test('should support selective review configuration', () => {
      const options = new Options(
        false, false, false, '50', true, true,
        ['src/**/*.ts', '!**/*.test.ts', '!**/*.spec.ts']
      )

      expect(options.reviewSimpleChanges).toBe(true)
      expect(options.reviewCommentLGTM).toBe(true)
      expect(options.checkPath('src/index.ts')).toBe(true)
      expect(options.checkPath('src/index.test.ts')).toBe(false)
    })
  })
})