import {describe, expect, test} from '@jest/globals'
import { PathFilter } from '../src/options'

describe('PathFilter', () => {
  test('excludes patterns only: allow others, block excluded', () => {
    const pf = new PathFilter(['!**/*.md'])
    expect(pf.check('src/app.ts')).toBe(true)
    expect(pf.check('README.md')).toBe(false)
    expect(pf.check('docs/guide.md')).toBe(false)
  })

  test('include + exclude patterns work together', () => {
    const pf = new PathFilter(['src/**', '!src/generated/**'])
    expect(pf.check('src/app.ts')).toBe(true)
    expect(pf.check('src/generated/index.ts')).toBe(false)
    expect(pf.check('docs/page.ts')).toBe(false)
  })
})