import { Inputs } from '../src/inputs'

describe('Inputs.render', () => {
  test('replaces all placeholders', () => {
    const ins = new Inputs(
      'SYS',
      'TITLE',
      'DESC',
      'RAW_SUM',
      'SHORT_SUM',
      'file.ts',
      'FILE_CONTENT',
      'FILE_DIFF',
      'PATCHES',
      'DIFF',
      'COMMENT_CHAIN',
      'COMMENT'
    )

    const template = `
$system_message
$title
$description
$raw_summary
$short_summary
$filename
$file_content
$file_diff
$patches
$diff
$comment_chain
$comment
`.trim()

    const out = ins.render(template)
    expect(out).toContain('SYS')
    expect(out).toContain('TITLE')
    expect(out).toContain('DESC')
    expect(out).toContain('RAW_SUM')
    expect(out).toContain('SHORT_SUM')
    expect(out).toContain('file.ts')
    expect(out).toContain('FILE_CONTENT')
    expect(out).toContain('FILE_DIFF')
    expect(out).toContain('PATCHES')
    expect(out).toContain('DIFF')
    expect(out).toContain('COMMENT_CHAIN')
    expect(out).toContain('COMMENT')
  })

  test('clone() returns an independent copy', () => {
    const a = new Inputs('A_SYS')
    const b = a.clone()
    b.systemMessage = 'B_SYS'
    expect(a.systemMessage).toBe('A_SYS')
    expect(b.systemMessage).toBe('B_SYS')
  })
})