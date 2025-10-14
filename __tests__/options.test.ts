import { PathFilter, Options } from '../src/options'

describe('PathFilter', () => {
  test('includes and excludes interplay', () => {
    const filter = new PathFilter([
      'src/**/*.ts',
      '!src/**/__mocks__/**',
      '!dist/**'
    ])
    expect(filter.check('src/api/index.ts')).toBe(true)
    expect(filter.check('src/__mocks__/file.ts')).toBe(false)
    expect(filter.check('dist/index.js')).toBe(false)
    // non-included folders should be excluded because we have at least one inclusion rule
    expect(filter.check('scripts/build.js')).toBe(false)
  })

  test('only exclusions means allow-by-default unless excluded', () => {
    const filter = new PathFilter(['!**/*.png', '!**/*.jpg'])
    // With only exclude rules, other files allowed
    expect(filter.check('readme.md')).toBe(true)
    expect(filter.check('assets/logo.png')).toBe(false)
  })

  test('no rules allow everything', () => {
    const filter = new PathFilter(null)
    expect(filter.check('anything/here.js')).toBe(true)
  })
})

describe('Options.checkPath (delegates to PathFilter)', () => {
  const pathFilters = ['src/**', '!src/**/skip/**']
  const opts = new Options(
    false,   // debug
    false,   // disableReview
    true,    // disableReleaseNotes
    '0',     // maxFiles
    false,   // reviewSimpleChanges
    false,   // reviewCommentLGTM
    pathFilters,
    'system_message',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo',
    '0.0',
    '3',
    '120000',
    '6',
    '6',
    'https://api.openai.com/v1',
    'en-US'
  )

  test('accepts paths under src', () => {
    expect(opts.checkPath('src/module.ts')).toBe(true)
  })

  test('rejects paths under excluded subpath', () => {
    expect(opts.checkPath('src/foo/skip/bar.ts')).toBe(false)
  })

  test('rejects paths outside include when include rules exist', () => {
    expect(opts.checkPath('tools/build.ts')).toBe(false)
  })
})