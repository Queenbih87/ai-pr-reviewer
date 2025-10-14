import {describe, expect, test} from '@jest/globals'
import {Inputs} from '../src/inputs'

describe('Inputs', () => {
  describe('constructor', () => {
    test('should create instance with default values', () => {
      const inputs = new Inputs()
      
      expect(inputs.systemMessage).toBe('')
      expect(inputs.title).toBe('no title provided')
      expect(inputs.description).toBe('no description provided')
      expect(inputs.rawSummary).toBe('')
      expect(inputs.shortSummary).toBe('')
      expect(inputs.filename).toBe('')
      expect(inputs.fileContent).toBe('file contents cannot be provided')
      expect(inputs.fileDiff).toBe('file diff cannot be provided')
      expect(inputs.patches).toBe('')
      expect(inputs.diff).toBe('no diff')
      expect(inputs.commentChain).toBe('no other comments on this patch')
      expect(inputs.comment).toBe('no comment provided')
    })

    test('should create instance with custom values', () => {
      const inputs = new Inputs(
        'custom system message',
        'custom title',
        'custom description',
        'raw summary',
        'short summary',
        'test.ts',
        'file content here',
        'diff content',
        'patch content',
        'diff here',
        'comment chain',
        'comment text'
      )

      expect(inputs.systemMessage).toBe('custom system message')
      expect(inputs.title).toBe('custom title')
      expect(inputs.description).toBe('custom description')
      expect(inputs.rawSummary).toBe('raw summary')
      expect(inputs.shortSummary).toBe('short summary')
      expect(inputs.filename).toBe('test.ts')
      expect(inputs.fileContent).toBe('file content here')
      expect(inputs.fileDiff).toBe('diff content')
      expect(inputs.patches).toBe('patch content')
      expect(inputs.diff).toBe('diff here')
      expect(inputs.commentChain).toBe('comment chain')
      expect(inputs.comment).toBe('comment text')
    })

    test('should handle empty strings for all fields', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', '')
      
      expect(inputs.systemMessage).toBe('')
      expect(inputs.title).toBe('')
      expect(inputs.description).toBe('')
      expect(inputs.rawSummary).toBe('')
      expect(inputs.shortSummary).toBe('')
      expect(inputs.filename).toBe('')
      expect(inputs.fileContent).toBe('')
      expect(inputs.fileDiff).toBe('')
      expect(inputs.patches).toBe('')
      expect(inputs.diff).toBe('')
      expect(inputs.commentChain).toBe('')
      expect(inputs.comment).toBe('')
    })
  })

  describe('clone', () => {
    test('should create deep copy with same values', () => {
      const original = new Inputs(
        'system',
        'title',
        'desc',
        'raw',
        'short',
        'file.ts',
        'content',
        'diff',
        'patches',
        'fulldiff',
        'chain',
        'comment'
      )

      const cloned = original.clone()

      expect(cloned).not.toBe(original)
      expect(cloned.systemMessage).toBe(original.systemMessage)
      expect(cloned.title).toBe(original.title)
      expect(cloned.description).toBe(original.description)
      expect(cloned.rawSummary).toBe(original.rawSummary)
      expect(cloned.shortSummary).toBe(original.shortSummary)
      expect(cloned.filename).toBe(original.filename)
      expect(cloned.fileContent).toBe(original.fileContent)
      expect(cloned.fileDiff).toBe(original.fileDiff)
      expect(cloned.patches).toBe(original.patches)
      expect(cloned.diff).toBe(original.diff)
      expect(cloned.commentChain).toBe(original.commentChain)
      expect(cloned.comment).toBe(original.comment)
    })

    test('should allow modification of clone without affecting original', () => {
      const original = new Inputs('system', 'title')
      const cloned = original.clone()

      cloned.systemMessage = 'modified'
      cloned.title = 'new title'

      expect(original.systemMessage).toBe('system')
      expect(original.title).toBe('title')
      expect(cloned.systemMessage).toBe('modified')
      expect(cloned.title).toBe('new title')
    })
  })

  describe('render', () => {
    test('should replace all template variables', () => {
      const inputs = new Inputs(
        'sys_msg',
        'pr_title',
        'pr_desc',
        'raw_sum',
        'short_sum',
        'test.ts',
        'file_cont',
        'file_dif',
        'patch_cont',
        'diff_cont',
        'chain_cont',
        'comm_text'
      )

      const template = `
System: $system_message
Title: $title
Description: $description
Raw: $raw_summary
Short: $short_summary
File: $filename
Content: $file_content
FileDiff: $file_diff
Patches: $patches
Diff: $diff
Chain: $comment_chain
Comment: $comment
`
      const result = inputs.render(template)

      expect(result).toContain('System: sys_msg')
      expect(result).toContain('Title: pr_title')
      expect(result).toContain('Description: pr_desc')
      expect(result).toContain('Raw: raw_sum')
      expect(result).toContain('Short: short_sum')
      expect(result).toContain('File: test.ts')
      expect(result).toContain('Content: file_cont')
      expect(result).toContain('FileDiff: file_dif')
      expect(result).toContain('Patches: patch_cont')
      expect(result).toContain('Diff: diff_cont')
      expect(result).toContain('Chain: chain_cont')
      expect(result).toContain('Comment: comm_text')
    })

    test('should return empty string for empty input', () => {
      const inputs = new Inputs()
      const result = inputs.render('')
      expect(result).toBe('')
    })

    test('should handle template with no variables', () => {
      const inputs = new Inputs()
      const template = 'This is plain text with no variables'
      const result = inputs.render(template)
      expect(result).toBe(template)
    })

    test('should only replace variables that have values', () => {
      const inputs = new Inputs()
      inputs.title = 'Test Title'
      inputs.filename = 'test.ts'

      const template = '$title in $filename with $description'
      const result = inputs.render(template)

      expect(result).toContain('Test Title')
      expect(result).toContain('test.ts')
      expect(result).toContain('no description provided')
    })

    test('should handle multiple occurrences of same variable', () => {
      const inputs = new Inputs()
      inputs.filename = 'test.ts'

      const template = '$filename was changed. Review $filename carefully.'
      const result = inputs.render(template)

      expect(result).toBe('test.ts was changed. Review test.ts carefully.')
    })

    test('should handle special characters in values', () => {
      const inputs = new Inputs()
      inputs.description = 'Description with $ and special chars: @#%^&*()'

      const template = 'Description: $description'
      const result = inputs.render(template)

      expect(result).toContain('Description with $ and special chars: @#%^&*()')
    })

    test('should not replace variables with empty values', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', '')

      const template = 'Title: $title, System: $system_message'
      const result = inputs.render(template)

      expect(result).toBe(template)
    })

    test('should handle multiline templates', () => {
      const inputs = new Inputs()
      inputs.title = 'PR Title'
      inputs.filename = 'src/test.ts'

      const template = `## Title: $title

File: $filename

Some content here`

      const result = inputs.render(template)

      expect(result).toContain('## Title: PR Title')
      expect(result).toContain('File: src/test.ts')
    })
  })

  describe('edge cases', () => {
    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const inputs = new Inputs(longString)

      expect(inputs.systemMessage).toBe(longString)
      expect(inputs.systemMessage.length).toBe(10000)
    })

    test('should handle unicode characters', () => {
      const inputs = new Inputs('🚀 Unicode test 你好', 'Title with émojis 🎉')

      expect(inputs.systemMessage).toBe('🚀 Unicode test 你好')
      expect(inputs.title).toBe('Title with émojis 🎉')
    })

    test('should handle newlines and tabs in values', () => {
      const inputs = new Inputs('line1\nline2\ttabbed')

      expect(inputs.systemMessage).toContain('\n')
      expect(inputs.systemMessage).toContain('\t')
    })
  })
})