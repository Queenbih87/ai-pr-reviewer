import {describe, expect, test} from '@jest/globals'
import {Inputs} from '../src/inputs'

describe('Inputs Class', () => {
  describe('Constructor and Default Values', () => {
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

    test('should create instance with all custom values', () => {
      const inputs = new Inputs(
        'custom system message',
        'custom title',
        'custom description',
        'raw summary',
        'short summary',
        'file.ts',
        'file content here',
        'file diff here',
        'patches here',
        'diff here',
        'comment chain',
        'user comment'
      )
      
      expect(inputs.systemMessage).toBe('custom system message')
      expect(inputs.title).toBe('custom title')
      expect(inputs.description).toBe('custom description')
      expect(inputs.rawSummary).toBe('raw summary')
      expect(inputs.shortSummary).toBe('short summary')
      expect(inputs.filename).toBe('file.ts')
      expect(inputs.fileContent).toBe('file content here')
      expect(inputs.fileDiff).toBe('file diff here')
      expect(inputs.patches).toBe('patches here')
      expect(inputs.diff).toBe('diff here')
      expect(inputs.commentChain).toBe('comment chain')
      expect(inputs.comment).toBe('user comment')
    })

    test('should handle partial custom values', () => {
      const inputs = new Inputs('system msg', 'title')
      
      expect(inputs.systemMessage).toBe('system msg')
      expect(inputs.title).toBe('title')
      expect(inputs.description).toBe('no description provided')
    })

    test('should handle empty string values explicitly', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', '')
      
      expect(inputs.systemMessage).toBe('')
      expect(inputs.title).toBe('')
      expect(inputs.description).toBe('')
    })
  })

  describe('Clone Method', () => {
    test('should create deep copy of inputs', () => {
      const original = new Inputs(
        'system',
        'title',
        'desc',
        'raw',
        'short',
        'file.js',
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

    test('should create independent clone (mutations do not affect original)', () => {
      const original = new Inputs('original', 'title')
      const cloned = original.clone()
      
      cloned.systemMessage = 'modified'
      cloned.title = 'new title'
      
      expect(original.systemMessage).toBe('original')
      expect(original.title).toBe('title')
      expect(cloned.systemMessage).toBe('modified')
      expect(cloned.title).toBe('new title')
    })

    test('should clone with default values intact', () => {
      const original = new Inputs()
      const cloned = original.clone()
      
      expect(cloned.title).toBe('no title provided')
      expect(cloned.description).toBe('no description provided')
      expect(cloned.fileContent).toBe('file contents cannot be provided')
    })
  })

  describe('Render Method - Basic Replacement', () => {
    test('should replace system message placeholder', () => {
      const inputs = new Inputs('Test System Message')
      const result = inputs.render('System: $system_message')
      
      expect(result).toBe('System: Test System Message')
    })

    test('should replace title placeholder', () => {
      const inputs = new Inputs('', 'PR Title')
      const result = inputs.render('Title: $title')
      
      expect(result).toBe('Title: PR Title')
    })

    test('should replace description placeholder', () => {
      const inputs = new Inputs('', '', 'This is a description')
      const result = inputs.render('Desc: $description')
      
      expect(result).toBe('Desc: This is a description')
    })

    test('should replace raw summary placeholder', () => {
      const inputs = new Inputs('', '', '', 'Raw Summary Content')
      const result = inputs.render('Summary: $raw_summary')
      
      expect(result).toBe('Summary: Raw Summary Content')
    })

    test('should replace short summary placeholder', () => {
      const inputs = new Inputs('', '', '', '', 'Short Summary')
      const result = inputs.render('Short: $short_summary')
      
      expect(result).toBe('Short: Short Summary')
    })

    test('should replace filename placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', 'src/file.ts')
      const result = inputs.render('File: $filename')
      
      expect(result).toBe('File: src/file.ts')
    })

    test('should replace file content placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', 'const x = 1;')
      const result = inputs.render('Content: $file_content')
      
      expect(result).toBe('Content: const x = 1;')
    })

    test('should replace file diff placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '+added line')
      const result = inputs.render('Diff: $file_diff')
      
      expect(result).toBe('Diff: +added line')
    })

    test('should replace patches placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', 'patch content')
      const result = inputs.render('Patches: $patches')
      
      expect(result).toBe('Patches: patch content')
    })

    test('should replace diff placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', 'diff content')
      const result = inputs.render('Changes: $diff')
      
      expect(result).toBe('Changes: diff content')
    })

    test('should replace comment chain placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', 'user1: comment1\nuser2: comment2')
      const result = inputs.render('Chain: $comment_chain')
      
      expect(result).toBe('Chain: user1: comment1\nuser2: comment2')
    })

    test('should replace comment placeholder', () => {
      const inputs = new Inputs('', '', '', '', '', '', '', '', '', '', '', 'This is a comment')
      const result = inputs.render('Comment: $comment')
      
      expect(result).toBe('Comment: This is a comment')
    })
  })

  describe('Render Method - Multiple Replacements', () => {
    test('should replace multiple placeholders in one template', () => {
      const inputs = new Inputs('sys', 'My Title', 'My Desc')
      const template = '$system_message | $title | $description'
      const result = inputs.render(template)
      
      expect(result).toBe('sys | My Title | My Desc')
    })

    test('should replace all placeholders in complex template', () => {
      const inputs = new Inputs(
        'system',
        'title',
        'description',
        'raw',
        'short',
        'file.ts',
        'content',
        'filediff',
        'patches',
        'diff',
        'chain',
        'comment'
      )
      
      const template = `$system_message
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
$comment`
      
      const result = inputs.render(template)
      const expected = `system
title
description
raw
short
file.ts
content
filediff
patches
diff
chain
comment`
      
      expect(result).toBe(expected)
    })

    test('should handle duplicate placeholders correctly', () => {
      const inputs = new Inputs('', 'TestTitle')
      const result = inputs.render('$title appears twice: $title')
      
      expect(result).toBe('TestTitle appears twice: $title')
    })

    test('should replace first occurrence only', () => {
      const inputs = new Inputs('', 'Title')
      const result = inputs.render('$title and $title and $title')
      
      // JavaScript replace() replaces only first occurrence
      expect(result).toBe('Title and $title and $title')
    })
  })

  describe('Render Method - Edge Cases', () => {
    test('should return empty string for empty input', () => {
      const inputs = new Inputs()
      const result = inputs.render('')
      
      expect(result).toBe('')
    })

    test('should return original string when no placeholders present', () => {
      const inputs = new Inputs('system', 'title')
      const result = inputs.render('No placeholders here')
      
      expect(result).toBe('No placeholders here')
    })

    test('should not replace placeholders when value is empty string', () => {
      const inputs = new Inputs('', '', '')
      const result = inputs.render('$system_message test')
      
      // Empty system message means it won't replace
      expect(result).toBe('$system_message test')
    })

    test('should not replace unknown placeholders', () => {
      const inputs = new Inputs('sys')
      const result = inputs.render('$unknown_placeholder and $system_message')
      
      expect(result).toBe('$unknown_placeholder and sys')
    })

    test('should handle special regex characters in content', () => {
      const inputs = new Inputs('', 'Title with $pecial [chars]')
      const result = inputs.render('Title: $title')
      
      expect(result).toBe('Title: Title with $pecial [chars]')
    })

    test('should handle newlines in content', () => {
      const inputs = new Inputs('', 'Line1\nLine2\nLine3')
      const result = inputs.render('Title:\n$title')
      
      expect(result).toBe('Title:\nLine1\nLine2\nLine3')
    })

    test('should handle unicode characters', () => {
      const inputs = new Inputs('', '测试标题 🚀')
      const result = inputs.render('Title: $title')
      
      expect(result).toBe('Title: 测试标题 🚀')
    })

    test('should handle very long content', () => {
      const longContent = 'a'.repeat(10000)
      const inputs = new Inputs('', longContent)
      const result = inputs.render('$title')
      
      expect(result.length).toBe(10000)
      expect(result).toBe(longContent)
    })

    test('should handle content with backticks', () => {
      const inputs = new Inputs('', '`code block`')
      const result = inputs.render('Content: $title')
      
      expect(result).toBe('Content: `code block`')
    })

    test('should handle HTML-like content', () => {
      const inputs = new Inputs('', '<div>HTML Content</div>')
      const result = inputs.render('$title')
      
      expect(result).toBe('<div>HTML Content</div>')
    })
  })

  describe('Render Method - Conditional Replacement', () => {
    test('should only replace when property is truthy', () => {
      const inputs = new Inputs()
      inputs.systemMessage = ''  // falsy
      const result = inputs.render('Test $system_message end')
      
      expect(result).toBe('Test $system_message end')
    })

    test('should replace when property is whitespace', () => {
      const inputs = new Inputs('   ')  // truthy but whitespace
      const result = inputs.render('Start $system_message end')
      
      expect(result).toBe('Start    end')
    })

    test('should replace when property is "0"', () => {
      const inputs = new Inputs('', '0')  // truthy string "0"
      const result = inputs.render('Value: $title')
      
      expect(result).toBe('Value: 0')
    })
  })

  describe('Integration Tests', () => {
    test('should handle typical PR review template', () => {
      const inputs = new Inputs()
      inputs.title = 'Fix: Update validation logic'
      inputs.description = 'This PR fixes the validation logic bug'
      inputs.filename = 'src/validator.ts'
      inputs.diff = '+  return isValid(input);'
      
      const template = `## PR: $title

Description: $description

File: $filename

Changes:
\`\`\`diff
$diff
\`\`\``
      
      const result = inputs.render(template)
      
      expect(result).toContain('Fix: Update validation logic')
      expect(result).toContain('This PR fixes the validation logic bug')
      expect(result).toContain('src/validator.ts')
      expect(result).toContain('+  return isValid(input);')
    })

    test('should handle comment review template', () => {
      const inputs = new Inputs()
      inputs.comment = 'user: Please add error handling'
      inputs.commentChain = 'reviewer: LGTM\nuser: Thanks!'
      inputs.diff = '+  throw new Error();'
      
      const template = `New Comment: $comment

Previous Discussion:
$comment_chain

Diff:
$diff`
      
      const result = inputs.render(template)
      
      expect(result).toContain('user: Please add error handling')
      expect(result).toContain('reviewer: LGTM\nuser: Thanks!')
      expect(result).toContain('+  throw new Error();')
    })

    test('should work with successive renders on same instance', () => {
      const inputs = new Inputs('system', 'title')
      
      const result1 = inputs.render('$system_message')
      const result2 = inputs.render('$title')
      const result3 = inputs.render('$system_message and $title')
      
      expect(result1).toBe('system')
      expect(result2).toBe('title')
      expect(result3).toBe('system and title')
    })

    test('should maintain state after multiple renders', () => {
      const inputs = new Inputs('original')
      
      inputs.render('$system_message')
      inputs.render('$title')
      
      expect(inputs.systemMessage).toBe('original')
      expect(inputs.title).toBe('no title provided')
    })
  })

  describe('Type Safety and Robustness', () => {
    test('should handle null-like content parameter gracefully', () => {
      const inputs = new Inputs()
      const result = inputs.render(null as any)
      
      expect(result).toBe('')
    })

    test('should handle undefined content parameter gracefully', () => {
      const inputs = new Inputs()
      const result = inputs.render(undefined as any)
      
      expect(result).toBe('')
    })

    test('should handle number as content parameter', () => {
      const inputs = new Inputs()
      const result = inputs.render(123 as any)
      
      // Numbers should be handled gracefully
      expect(typeof result).toBe('string')
    })
  })

  describe('Performance Considerations', () => {
    test('should handle multiple consecutive renders efficiently', () => {
      const inputs = new Inputs('sys', 'title', 'desc')
      const template = '$system_message $title $description'
      
      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        inputs.render(template)
      }
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(1000)  // Should complete in under 1 second
    })

    test('should handle large template efficiently', () => {
      const inputs = new Inputs('sys', 'title')
      const template = '$system_message\n'.repeat(100) + '$title\n'.repeat(100)
      
      const start = Date.now()
      const result = inputs.render(template)
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(100)  // Should be very fast
      expect(result.split('\n').length).toBeGreaterThan(150)
    })
  })

  describe('Immutability of Render', () => {
    test('should not modify original content parameter', () => {
      const inputs = new Inputs('', 'TestTitle')
      const originalTemplate = 'Title is $title'
      const templateCopy = originalTemplate
      
      inputs.render(originalTemplate)
      
      expect(originalTemplate).toBe(templateCopy)
    })

    test('should not modify instance properties during render', () => {
      const inputs = new Inputs('original', 'title')
      const originalSystem = inputs.systemMessage
      const originalTitle = inputs.title
      
      inputs.render('$system_message and $title')
      
      expect(inputs.systemMessage).toBe(originalSystem)
      expect(inputs.title).toBe(originalTitle)
    })
  })
})