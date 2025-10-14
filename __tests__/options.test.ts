import {describe, expect, test, jest, beforeEach} from '@jest/globals'
import {Options, PathFilter, OpenAIOptions} from '../src/options'
import {TokenLimits} from '../src/limits'

// Mock the info function from @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn()
}))

describe('PathFilter Class', () => {
  describe('Constructor', () => {
    test('should create instance with null rules', () => {
      const filter = new PathFilter(null)
      expect(filter.check('any/path.ts')).toBe(true)
    })

    test('should create instance with empty array', () => {
      const filter = new PathFilter([])
      expect(filter.check('any/path.ts')).toBe(true)
    })

    test('should create instance with inclusion rules', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      expect(filter).toBeDefined()
    })

    test('should create instance with exclusion rules', () => {
      const filter = new PathFilter(['!node_modules/**'])
      expect(filter).toBeDefined()
    })

    test('should handle mixed inclusion and exclusion rules', () => {
      const filter = new PathFilter(['src/**/*.ts', '!src/**/*.test.ts'])
      expect(filter).toBeDefined()
    })

    test('should trim whitespace from rules', () => {
      const filter = new PathFilter(['  src/**/*.ts  ', '  !dist/**  '])
      expect(filter.check('src/file.ts')).toBe(true)
    })

    test('should ignore empty strings in rules', () => {
      const filter = new PathFilter(['', 'src/**', '', '!dist/**', ''])
      expect(filter.check('src/file.ts')).toBe(true)
    })
  })

  describe('check method with no rules', () => {
    test('should return true for any path when no rules', () => {
      const filter = new PathFilter([])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('dist/bundle.js')).toBe(true)
      expect(filter.check('node_modules/package.json')).toBe(true)
      expect(filter.check('README.md')).toBe(true)
    })
  })

  describe('check method with inclusion rules only', () => {
    test('should match simple glob pattern', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/nested/file.ts')).toBe(true)
      expect(filter.check('dist/file.ts')).toBe(false)
      expect(filter.check('src/file.js')).toBe(false)
    })

    test('should match multiple patterns', () => {
      const filter = new PathFilter(['src/**/*.ts', 'lib/**/*.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('lib/file.ts')).toBe(true)
      expect(filter.check('dist/file.ts')).toBe(false)
    })

    test('should match exact filename', () => {
      const filter = new PathFilter(['package.json'])
      
      expect(filter.check('package.json')).toBe(true)
      expect(filter.check('src/package.json')).toBe(false)
    })

    test('should match wildcard in directory', () => {
      const filter = new PathFilter(['src/*/index.ts'])
      
      expect(filter.check('src/module/index.ts')).toBe(true)
      expect(filter.check('src/nested/deep/index.ts')).toBe(false)
    })
  })

  describe('check method with exclusion rules only', () => {
    test('should exclude matching paths', () => {
      const filter = new PathFilter(['!node_modules/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('node_modules/package/file.js')).toBe(false)
    })

    test('should exclude multiple patterns', () => {
      const filter = new PathFilter(['!node_modules/**', '!dist/**', '!*.test.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('node_modules/pkg/file.js')).toBe(false)
      expect(filter.check('dist/bundle.js')).toBe(false)
      expect(filter.check('src/file.test.ts')).toBe(false)
    })
  })

  describe('check method with mixed rules', () => {
    test('should apply inclusion then exclusion', () => {
      const filter = new PathFilter(['src/**/*.ts', '!src/**/*.test.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/file.test.ts')).toBe(false)
      expect(filter.check('dist/file.ts')).toBe(false)
    })

    test('should exclude even if included by another rule', () => {
      const filter = new PathFilter(['src/**', '!src/temp/**'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('src/temp/file.ts')).toBe(false)
    })

    test('should handle complex patterns', () => {
      const filter = new PathFilter([
        'src/**/*.ts',
        'lib/**/*.ts',
        '!**/*.test.ts',
        '!**/*.spec.ts',
        '!**/temp/**'
      ])
      
      expect(filter.check('src/module.ts')).toBe(true)
      expect(filter.check('lib/util.ts')).toBe(true)
      expect(filter.check('src/module.test.ts')).toBe(false)
      expect(filter.check('lib/util.spec.ts')).toBe(false)
      expect(filter.check('src/temp/file.ts')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    test('should handle paths with special characters', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      
      expect(filter.check('src/file-name.ts')).toBe(true)
      expect(filter.check('src/file_name.ts')).toBe(true)
      expect(filter.check('src/file.name.ts')).toBe(true)
    })

    test('should handle empty path', () => {
      const filter = new PathFilter(['src/**'])
      
      expect(filter.check('')).toBe(false)
    })

    test('should be case-sensitive', () => {
      const filter = new PathFilter(['src/**/*.ts'])
      
      expect(filter.check('src/file.ts')).toBe(true)
      expect(filter.check('Src/file.ts')).toBe(false)
      expect(filter.check('src/file.TS')).toBe(false)
    })
  })
})

describe('OpenAIOptions Class', () => {
  describe('Constructor', () => {
    test('should create instance with default values', () => {
      const options = new OpenAIOptions()
      
      expect(options.model).toBe('gpt-3.5-turbo')
      expect(options.tokenLimits).toBeDefined()
      expect(options.tokenLimits.maxTokens).toBe(4000)
    })

    test('should create instance with custom model', () => {
      const options = new OpenAIOptions('gpt-4')
      
      expect(options.model).toBe('gpt-4')
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })

    test('should create instance with custom token limits', () => {
      const customLimits = new TokenLimits('gpt-4-32k')
      const options = new OpenAIOptions('gpt-4', customLimits)
      
      expect(options.model).toBe('gpt-4')
      expect(options.tokenLimits).toBe(customLimits)
      expect(options.tokenLimits.maxTokens).toBe(32600)
    })

    test('should use model to create token limits if not provided', () => {
      const options = new OpenAIOptions('gpt-3.5-turbo-16k')
      
      expect(options.tokenLimits.maxTokens).toBe(16300)
    })

    test('should handle null token limits', () => {
      const options = new OpenAIOptions('gpt-4', null)
      
      expect(options.tokenLimits).toBeDefined()
      expect(options.tokenLimits.maxTokens).toBe(8000)
    })
  })
})

describe('Options Class', () => {
  describe('Constructor', () => {
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

    test('should create instance with custom values', () => {
      const options = new Options(
        true,
        true,
        true,
        '10',
        true,
        true,
        ['src/**/*.ts'],
        'Custom system message',
        'gpt-4',
        'gpt-4-32k',
        '0.5',
        '5',
        '60000',
        '3',
        '4',
        'https://custom-api.com/v1',
        'es-ES'
      )
      
      expect(options.debug).toBe(true)
      expect(options.disableReview).toBe(true)
      expect(options.disableReleaseNotes).toBe(true)
      expect(options.maxFiles).toBe(10)
      expect(options.reviewSimpleChanges).toBe(true)
      expect(options.reviewCommentLGTM).toBe(true)
      expect(options.systemMessage).toBe('Custom system message')
      expect(options.openaiLightModel).toBe('gpt-4')
      expect(options.openaiHeavyModel).toBe('gpt-4-32k')
      expect(options.openaiModelTemperature).toBe(0.5)
      expect(options.openaiRetries).toBe(5)
      expect(options.openaiTimeoutMS).toBe(60000)
      expect(options.openaiConcurrencyLimit).toBe(3)
      expect(options.githubConcurrencyLimit).toBe(4)
      expect(options.apiBaseUrl).toBe('https://custom-api.com/v1')
      expect(options.language).toBe('es-ES')
    })

    test('should parse string numbers correctly', () => {
      const options = new Options(
        false,
        false,
        false,
        '25',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '0.8',
        '10',
        '180000',
        '8',
        '10'
      )
      
      expect(options.maxFiles).toBe(25)
      expect(options.openaiModelTemperature).toBe(0.8)
      expect(options.openaiRetries).toBe(10)
      expect(options.openaiTimeoutMS).toBe(180000)
      expect(options.openaiConcurrencyLimit).toBe(8)
      expect(options.githubConcurrencyLimit).toBe(10)
    })

    test('should create token limits based on models', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo-16k',
        'gpt-4-32k'
      )
      
      expect(options.lightTokenLimits.maxTokens).toBe(16300)
      expect(options.heavyTokenLimits.maxTokens).toBe(32600)
    })
  })

  describe('checkPath method', () => {
    test('should use pathFilters to check paths', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        ['src/**/*.ts']
      )
      
      expect(options.checkPath('src/file.ts')).toBe(true)
      expect(options.checkPath('dist/file.ts')).toBe(false)
    })

    test('should return true for all paths with no filters', () => {
      const options = new Options(false, false, false)
      
      expect(options.checkPath('any/path/file.ts')).toBe(true)
      expect(options.checkPath('another/file.js')).toBe(true)
    })

    test('should respect exclusion rules', () => {
      const options = new Options(
        false,
        false,
        false,
        '0',
        false,
        false,
        ['src/**/*.ts', '!src/**/*.test.ts']
      )
      
      expect(options.checkPath('src/file.ts')).toBe(true)
      expect(options.checkPath('src/file.test.ts')).toBe(false)
    })
  })

  describe('Edge cases', () => {
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
        'not-a-number'
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
        '-3'
      )
      
      expect(options.maxFiles).toBe(-5)
      expect(options.openaiModelTemperature).toBe(-0.5)
      expect(options.openaiRetries).toBe(-3)
    })

    test('should handle very large numbers', () => {
      const options = new Options(
        false,
        false,
        false,
        '999999',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '1.0',
        '100',
        '9999999'
      )
      
      expect(options.maxFiles).toBe(999999)
      expect(options.openaiRetries).toBe(100)
      expect(options.openaiTimeoutMS).toBe(9999999)
    })

    test('should handle empty strings for numeric params', () => {
      const options = new Options(
        false,
        false,
        false,
        '',
        false,
        false,
        null,
        '',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo',
        '',
        '',
        ''
      )
      
      expect(options.maxFiles).toBe(0)
      expect(options.openaiModelTemperature).toBe(0)
      expect(options.openaiRetries).toBe(0)
      expect(options.openaiTimeoutMS).toBe(0)
    })
  })

  describe('Different model combinations', () => {
    test('should handle same model for light and heavy', () => {
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
        'gpt-4'
      )
      
      expect(options.openaiLightModel).toBe('gpt-4')
      expect(options.openaiHeavyModel).toBe('gpt-4')
      expect(options.lightTokenLimits.maxTokens).toBe(8000)
      expect(options.heavyTokenLimits.maxTokens).toBe(8000)
    })

    test('should handle different models for light and heavy', () => {
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
      
      expect(options.openaiLightModel).toBe('gpt-3.5-turbo')
      expect(options.openaiHeavyModel).toBe('gpt-4-32k')
      expect(options.lightTokenLimits.maxTokens).toBe(4000)
      expect(options.heavyTokenLimits.maxTokens).toBe(32600)
    })
  })
})