import {describe, expect, test} from '@jest/globals'
import {Inputs} from '../src/inputs'

describe('Inputs.render', () => {
  test('replaces all placeholders with provided values', () => {
    const inputs = new Inputs(
      'SYS',
      'My Title',
      'My Description',
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

    const template = [
      'sys:$system_message',
      'title:$title',
      'desc:$description',
      'raw:$raw_summary',
      'short:$short_summary',
      'file:$filename',
      'content:$file_content',
      'diff:$file_diff',
      'patches:$patches',
      'alldiff:$diff',
      'chain:$comment_chain',
      'comment:$comment'
    ].join('\n')

    const rendered = inputs.render(template)
    expect(rendered).toContain('sys:SYS')
    expect(rendered).toContain('title:My Title')
    expect(rendered).toContain('desc:My Description')
    expect(rendered).toContain('raw:RAW_SUM')
    expect(rendered).toContain('short:SHORT_SUM')
    expect(rendered).toContain('file:file.ts')
    expect(rendered).toContain('content:FILE_CONTENT')
    expect(rendered).toContain('diff:FILE_DIFF')
    expect(rendered).toContain('patches:PATCHES')
    expect(rendered).toContain('alldiff:DIFF')
    expect(rendered).toContain('chain:COMMENT_CHAIN')
    expect(rendered).toContain('comment:COMMENT')
  })

  test('clone produces an independent copy', () => {
    const inputs = new Inputs(
      'SYS',
      'Title',
      'Desc',
      'RAW',
      'SHORT',
      'file.txt',
      'FILE_CONTENT',
      'FILE_DIFF',
      'PATCHES',
      'DIFF',
      'CHAIN',
      'COMMENT'
    )
    const copy = inputs.clone()
    // mutate original
    inputs.title = 'Changed'
    inputs.description = 'Changed Desc'
    // copy should remain intact
    expect(copy.title).toBe('Title')
    expect(copy.description).toBe('Desc')
  })
})