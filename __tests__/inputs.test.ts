import {describe, expect, test} from '@jest/globals'
import {Inputs} from '../src/inputs'

describe('Inputs Class', () => {
  describe('Constructor', () => {
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
        'custom raw summary',
        'custom short summary',
        'test.ts',
        'const x = 1',
        '+const x = 1',
        'patch content',
        'diff content',
        'comment chain',
        'user comment'
      )
      
      expect(inputs.systemMessage).toBe('custom system message')
      expect(inputs.title).toBe('custom title')
      expect(inputs.description).toBe('custom description')
      expect(inputs.rawSummary).toBe('custom raw summary')
      expect(inputs.shortSummary).toBe('custom short summary')
      expect(inputs.filename).toBe('test.ts')
      expect(inputs.fileContent).toBe('const x = 1')
      expect(inputs.fileDiff).toBe('+const x = 1')
      expect(inputs.patches).toBe('patch content')
      expect(inputs.diff).toBe('diff content')
      expect(inputs.commentChain).toBe('comment chain')
      expect(inputs.comment).toBe('user comment')
    })

    test('should handle empty strings', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', '')
      
      expect(inputs.systemMessage).toBe('')
      expect(inputs.title).toBe('')
      expect(inputs.description).toBe('')
    })
  })

  describe('clone', () => {
    test('should create a deep copy of inputs', () => {
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
        'diff2',
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

    test('should create independent copy that can be modified', () => {
      const original = new Inputs('system', 'title')
      const cloned = original.clone()
      
      cloned.systemMessage = 'modified system'
      cloned.title = 'modified title'
      
      expect(original.systemMessage).toBe('system')
      expect(original.title).toBe('title')
      expect(cloned.systemMessage).toBe('modified system')
      expect(cloned.title).toBe('modified title')
    })
  })

  describe('render', () => {
    test('should return empty string for empty content', () => {
      const inputs = new Inputs()
      expect(inputs.render('')).toBe('')
    })

    test('should return content unchanged if no placeholders', () => {
      const inputs = new Inputs()
      const content = 'This is just plain text'
      expect(inputs.render(content)).toBe(content)
    })

    test('should replace $system_message placeholder', () => {
      const inputs = new Inputs('Custom system message')
      const content = 'System: $system_message'
      expect(inputs.render(content)).toBe('System: Custom system message')
    })

    test('should replace $title placeholder', () => {
      const inputs = new Inputs('', 'My PR Title')
      const content = 'Title: $title'
      expect(inputs.render(content)).toBe('Title: My PR Title')
    })

    test('should replace $description placeholder', () => {
      const inputs = new Inputs('', '', 'PR Description')
      const content = 'Desc: $description'
      expect(inputs.render(content)).toBe('Desc: PR Description')
    })

    test('should replace $raw_summary placeholder', () => {
      const inputs = new Inputs('', '', '', 'Raw summary text')
      const content = 'Summary: $raw_summary'
      expect(inputs.render(content)).toBe('Summary: Raw summary text')
    })

    test('should replace $short_summary placeholder', () => {
      const inputs = new Inputs('', '', '', '', 'Short summary')
      const content = 'Short: $short_summary'
      expect(inputs.render(content)).toBe('Short: Short summary')
    })

    test('should replace $filename placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', 'test.ts')
      const content = 'File: $filename'
      expect(inputs.render(content)).toBe('File: test.ts')
    })

    test('should replace $file_content placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', 'const x = 1')
      const content = 'Content: $file_content'
      expect(inputs.render(content)).toBe('Content: const x = 1')
    })

    test('should replace $file_diff placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '+const x = 1')
      const content = 'Diff: $file_diff'
      expect(inputs.render(content)).toBe('Diff: +const x = 1')
    })

    test('should replace $patches placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', 'patch data')
      const content = 'Patches: $patches'
      expect(inputs.render(content)).toBe('Patches: patch data')
    })

    test('should replace $diff placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', 'diff data')
      const content = 'Diff: $diff'
      expect(inputs.render(content)).toBe('Diff: diff data')
    })

    test('should replace $comment_chain placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', 'chain')
      const content = 'Chain: $comment_chain'
      expect(inputs.render(content)).toBe('Chain: chain')
    })

    test('should replace $comment placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', 'user comment')
      const content = 'Comment: $comment'
      expect(inputs.render(content)).toBe('Comment: user comment')
    })

    test('should replace multiple placeholders in one template', () => {
      const inputs = new Inputs(
        'sys',
        'title',
        'desc',
        'raw',
        'short',
        'file.ts'
      )
      const content = '$system_message | $title | $description | $raw_summary | $short_summary | $filename'
      expect(inputs.render(content)).toBe('sys | title | desc | raw | short | file.ts')
    })

    test('should handle placeholders appearing multiple times', () => {
      const inputs = new Inputs('', 'MyTitle')
      const content = '$title is repeated: $title'
      expect(inputs.render(content)).toBe('MyTitle is repeated: $title')
    })

    test('should not replace if value is empty string', () => {
      const inputs = new Inputs('', '')
      const content = 'Title: $title'
      expect(inputs.render(content)).toBe('Title: $title')
    })

    test('should handle special characters in replacement values', () => {
      const inputs = new Inputs('', 'Title with $pecial ch@rs!')
      const content = 'Title: $title'
      expect(inputs.render(content)).toBe('Title: Title with $pecial ch@rs!')
    })

    test('should handle newlines in replacement values', () => {
      const inputs = new Inputs('', '', 'Line 1\nLine 2\nLine 3')
      const content = 'Description:\n$description'
      expect(inputs.render(content)).toBe('Description:\nLine 1\nLine 2\nLine 3')
    })

    test('should handle complex template with mixed content', () => {
      const inputs = new Inputs(
        'system msg',
        'PR Title',
        'PR Description'
      )
      const template = `
# $title

## Description
$description

System: $system_message

Some other text that should not change.
`
      const expected = `
# PR Title

## Description
PR Description

System: system msg

Some other text that should not change.
`
      expect(inputs.render(template)).toBe(expected)
    })
  })

  describe('Edge Cases', () => {
    test('should handle undefined content gracefully', () => {
      const inputs = new Inputs()
      expect(inputs.render(undefined as any)).toBe('')
    })

    test('should handle null content gracefully', () => {
      const inputs = new Inputs()
      expect(inputs.render(null as any)).toBe('')
    })

    test('should handle very long content', () => {
      const inputs = new Inputs('', 'Title')
      const longContent = '$title'.repeat(10000)
      const result = inputs.render(longContent)
      expect(result).toContain('Title')
      expect(result.length).toBeGreaterThan(0)
    })

    test('should handle content with only placeholders', () => {
      const inputs = new Inputs('sys', 'title')
      expect(inputs.render('$system_message$title')).toBe('systitle')
    })
  })
})