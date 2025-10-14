import {describe, expect, test} from '@jest/globals'
import {PathFilter, Options} from '../src/options'

describe('PathFilter', () => {
  test('allows all when no rules provided', () => {
    const pf = new PathFilter(null)
    expect(pf.check('src/app.ts')).toBe(true)
    expect(pf.check('dist/index.js')).toBe(true)
  })

  test('exclusion-only rules exclude matching paths and allow others', () => {
    const pf = new PathFilter(['!dist/**'])
    expect(pf.check('dist/index.js')).toBe(false)
    expect(pf.check('src/app.ts')).toBe(true)
    expect(pf.check('README.md')).toBe(true)
  })

  test('include + exclude rules: include must match and exclude takes precedence', () => {
    const pf = new PathFilter(['src/**/*.ts', '!src/**/__tests__/**'])
    expect(pf.check('src/app.ts')).toBe(true)
    expect(pf.check('src/__tests__/app.test.ts')).toBe(false)
    // inclusionRuleExists is true, so non-included files should be false
    expect(pf.check('docs/readme.md')).toBe(false)
  })

  test('file extension inclusion and exclusion', () => {
    const pf = new PathFilter(['**/*.ts', '!**/*.test.ts'])
    expect(pf.check('src/foo.ts')).toBe(true)
    expect(pf.check('src/foo.test.ts')).toBe(false)
    expect(pf.check('src/foo.js')).toBe(false) // not included by *.ts
  })
})

describe('Options.checkPath (integration with PathFilter)', () => {
  function makeOptions(pathFilters: string[] | null): Options {
    return new Options(
      false,               // debug
      false,               // disableReview
      false,               // disableReleaseNotes
      '0',                 // maxFiles
      false,               // reviewSimpleChanges
      false,               // reviewCommentLGTM
      pathFilters,         // pathFilters
      'system',            // systemMessage
      'gpt-3.5-turbo',     // openaiLightModel
      'gpt-3.5-turbo',     // openaiHeavyModel
      '0.0',               // openaiModelTemperature
      '3',                 // openaiRetries
      '120000',            // openaiTimeoutMS
      '6',                 // openaiConcurrencyLimit
      '6',                 // githubConcurrencyLimit
      'https://api.openai.com/v1', // apiBaseUrl
      'en-US'              // language
    )
  }

  test('respects include/exclude rules', () => {
    const options = makeOptions(['src/**/*.ts', '!src/**/__tests__/**'])
    expect(options.checkPath('src/api.ts')).toBe(true)
    expect(options.checkPath('src/__tests__/api.test.ts')).toBe(false)
    expect(options.checkPath('README.md')).toBe(false)
  })

  test('no rules means pass-through', () => {
    const options = makeOptions(null)
    expect(options.checkPath('anything/here.txt')).toBe(true)
  })
})