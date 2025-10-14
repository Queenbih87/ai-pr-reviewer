import {describe, expect, test} from '@jest/globals'
import {Prompts} from '../src/prompts'
import {Inputs} from '../src/inputs'

describe('Prompts Class', () => {
  describe('Constructor', () => {
    test('should create with default empty prompts', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarize).toBe('')
      expect(prompts.summarizeReleaseNotes).toBe('')
    })

    test('should create with custom summarize prompt', () => {
      const customSummarize = 'Custom summarize prompt'
      const prompts = new Prompts(customSummarize)
      
      expect(prompts.summarize).toBe(customSummarize)
      expect(prompts.summarizeReleaseNotes).toBe('')
    })

    test('should create with both custom prompts', () => {
      const customSummarize = 'Custom summarize'
      const customRelease = 'Custom release notes'
      const prompts = new Prompts(customSummarize, customRelease)
      
      expect(prompts.summarize).toBe(customSummarize)
      expect(prompts.summarizeReleaseNotes).toBe(customRelease)
    })
  })

  describe('Template Properties', () => {
    test('should have summarizeFileDiff template', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toBeDefined()
      expect(typeof prompts.summarizeFileDiff).toBe('string')
      expect(prompts.summarizeFileDiff.length).toBeGreaterThan(0)
    })

    test('should have triageFileDiff template', () => {
      const prompts = new Prompts()
      
      expect(prompts.triageFileDiff).toBeDefined()
      expect(typeof prompts.triageFileDiff).toBe('string')
      expect(prompts.triageFileDiff.length).toBeGreaterThan(0)
    })

    test('should have summarizeChangesets template', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeChangesets).toBeDefined()
      expect(prompts.summarizeChangesets.length).toBeGreaterThan(0)
    })

    test('should have summarizePrefix template', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizePrefix).toBeDefined()
      expect(prompts.summarizePrefix.length).toBeGreaterThan(0)
    })

    test('should have summarizeShort template', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeShort).toBeDefined()
      expect(prompts.summarizeShort.length).toBeGreaterThan(0)
    })

    test('should have reviewFileDiff template', () => {
      const prompts = new Prompts()
      
      expect(prompts.reviewFileDiff).toBeDefined()
      expect(prompts.reviewFileDiff.length).toBeGreaterThan(0)
    })

    test('should have comment template', () => {
      const prompts = new Prompts()
      
      expect(prompts.comment).toBeDefined()
      expect(prompts.comment.length).toBeGreaterThan(0)
    })
  })

  describe('Template Content Validation', () => {
    test('summarizeFileDiff should contain required placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toContain('$title')
      expect(prompts.summarizeFileDiff).toContain('$description')
      expect(prompts.summarizeFileDiff).toContain('$file_diff')
    })

    test('triageFileDiff should mention triage criteria', () => {
      const prompts = new Prompts()
      
      expect(prompts.triageFileDiff).toContain('NEEDS_REVIEW')
      expect(prompts.triageFileDiff).toContain('APPROVED')
      expect(prompts.triageFileDiff).toContain('[TRIAGE]')
    })

    test('summarizeChangesets should contain raw_summary placeholder', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeChangesets).toContain('$raw_summary')
    })

    test('reviewFileDiff should contain required placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.reviewFileDiff).toContain('$title')
      expect(prompts.reviewFileDiff).toContain('$description')
      expect(prompts.reviewFileDiff).toContain('$short_summary')
      expect(prompts.reviewFileDiff).toContain('$filename')
      expect(prompts.reviewFileDiff).toContain('$patches')
    })

    test('comment should contain required placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.comment).toContain('$filename')
      expect(prompts.comment).toContain('$title')
      expect(prompts.comment).toContain('$description')
      expect(prompts.comment).toContain('$file_diff')
      expect(prompts.comment).toContain('$diff')
      expect(prompts.comment).toContain('$comment_chain')
      expect(prompts.comment).toContain('$comment')
    })
  })

  describe('renderSummarizeFileDiff Method', () => {
    test('should render with reviewSimpleChanges = true', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', 'Test PR', 'Description', '', '', '', '', '+added line')
      
      const result = prompts.renderSummarizeFileDiff(inputs, true)
      
      expect(result).toContain('Test PR')
      expect(result).toContain('Description')
      expect(result).toContain('+added line')
      expect(result).not.toContain('[TRIAGE]')
    })

    test('should render with reviewSimpleChanges = false', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', 'Test PR', 'Description', '', '', '', '', '+added line')
      
      const result = prompts.renderSummarizeFileDiff(inputs, false)
      
      expect(result).toContain('Test PR')
      expect(result).toContain('[TRIAGE]')
      expect(result).toContain('NEEDS_REVIEW')
      expect(result).toContain('APPROVED')
    })

    test('should include triageFileDiff when not reviewing simple changes', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeFileDiff(inputs, false)
      
      expect(result.length).toBeGreaterThan(prompts.summarizeFileDiff.length)
    })

    test('should not include triageFileDiff when reviewing simple changes', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeFileDiff(inputs, true)
      
      expect(result).not.toContain(prompts.triageFileDiff)
    })
  })

  describe('renderSummarizeChangesets Method', () => {
    test('should render with raw summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', '', '', 'File1: Changes\nFile2: More changes')
      
      const result = prompts.renderSummarizeChangesets(inputs)
      
      expect(result).toContain('File1: Changes')
      expect(result).toContain('File2: More changes')
    })

    test('should use summarizeChangesets template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeChangesets(inputs)
      
      expect(result).toContain('changesets')
    })
  })

  describe('renderSummarize Method', () => {
    test('should render with custom summarize prompt', () => {
      const customPrompt = 'Please summarize these changes:\n$raw_summary'
      const prompts = new Prompts(customPrompt)
      const inputs = new Inputs('', '', '', 'Summary content')
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('Please summarize these changes')
      expect(result).toContain('Summary content')
    })

    test('should include summarizePrefix', () => {
      const prompts = new Prompts('Custom prompt')
      const inputs = new Inputs()
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('Here is the summary of changes')
    })

    test('should combine prefix and custom prompt', () => {
      const customPrompt = 'Additional instructions'
      const prompts = new Prompts(customPrompt)
      const inputs = new Inputs()
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('summary of changes')
      expect(result).toContain('Additional instructions')
    })
  })

  describe('renderSummarizeShort Method', () => {
    test('should render with summarizeShort template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', '', '', 'Long summary content here')
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('concise summary')
      expect(result).toContain('Long summary content here')
    })

    test('should include word limit instruction', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('500 words')
    })

    test('should include summarizePrefix', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('summary of changes')
    })
  })

  describe('renderSummarizeReleaseNotes Method', () => {
    test('should render with custom release notes prompt', () => {
      const customPrompt = 'Generate release notes:\n$raw_summary'
      const prompts = new Prompts('', customPrompt)
      const inputs = new Inputs('', '', '', 'Release content')
      
      const result = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(result).toContain('Generate release notes')
      expect(result).toContain('Release content')
    })

    test('should include summarizePrefix', () => {
      const prompts = new Prompts('', 'Custom release')
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(result).toContain('summary of changes')
    })

    test('should work with empty release notes prompt', () => {
      const prompts = new Prompts('', '')
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(typeof result).toBe('string')
    })
  })

  describe('renderComment Method', () => {
    test('should render comment template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.filename = 'src/test.ts'
      inputs.comment = 'user: Please fix this'
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toContain('src/test.ts')
      expect(result).toContain('user: Please fix this')
    })

    test('should include all comment-related fields', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.filename = 'file.ts'
      inputs.comment = 'new comment'
      inputs.commentChain = 'previous comments'
      inputs.diff = '+added'
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toContain('file.ts')
      expect(result).toContain('new comment')
      expect(result).toContain('previous comments')
      expect(result).toContain('+added')
    })

    test('should mention tagging user in reply', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toContain('@user')
    })
  })

  describe('renderReviewFileDiff Method', () => {
    test('should render review template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.title = 'Fix bug'
      inputs.description = 'This fixes the bug'
      inputs.filename = 'src/bug.ts'
      inputs.patches = 'patch content'
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Fix bug')
      expect(result).toContain('This fixes the bug')
      expect(result).toContain('src/bug.ts')
      expect(result).toContain('patch content')
    })

    test('should include review instructions', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('IMPORTANT Instructions')
      expect(result).toContain('LGTM')
    })

    test('should include example response format', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Example')
      expect(result).toContain('new_hunk')
      expect(result).toContain('old_hunk')
    })
  })

  describe('Integration with Inputs', () => {
    test('should work with fully populated inputs', () => {
      const prompts = new Prompts('Custom summarize', 'Custom release')
      const inputs = new Inputs(
        'system msg',
        'PR Title',
        'PR Description',
        'Raw summary',
        'Short summary',
        'file.ts',
        'content',
        'diff content',
        'patches',
        'diff',
        'comment chain',
        'comment'
      )
      
      const result1 = prompts.renderSummarize(inputs)
      const result2 = prompts.renderComment(inputs)
      const result3 = prompts.renderReviewFileDiff(inputs)
      
      expect(result1).toContain('Raw summary')
      expect(result2).toContain('comment')
      expect(result3).toContain('PR Title')
    })

    test('should handle inputs with default values', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      expect(() => prompts.renderSummarize(inputs)).not.toThrow()
      expect(() => prompts.renderComment(inputs)).not.toThrow()
      expect(() => prompts.renderReviewFileDiff(inputs)).not.toThrow()
    })
  })

  describe('Template Instructions and Guidelines', () => {
    test('reviewFileDiff should specify no general feedback', () => {
      const prompts = new Prompts()
      
      expect(prompts.reviewFileDiff).toContain('Do NOT provide general feedback')
    })

    test('reviewFileDiff should require LGTM for clean code', () => {
      const prompts = new Prompts()
      
      expect(prompts.reviewFileDiff).toContain('LGTM')
    })

    test('comment should instruct direct replies', () => {
      const prompts = new Prompts()
      
      expect(prompts.comment).toContain('reply directly')
    })

    test('summarizeShort should limit to 500 words', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeShort).toContain('500 words')
    })

    test('summarizeFileDiff should request 100 word summary', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toContain('100 words')
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty custom prompts', () => {
      const prompts = new Prompts('', '')
      const inputs = new Inputs()
      
      expect(() => prompts.renderSummarize(inputs)).not.toThrow()
      expect(() => prompts.renderSummarizeReleaseNotes(inputs)).not.toThrow()
    })

    test('should handle very long custom prompts', () => {
      const longPrompt = 'instruction '.repeat(1000)
      const prompts = new Prompts(longPrompt, longPrompt)
      const inputs = new Inputs()
      
      const result = prompts.renderSummarize(inputs)
      expect(result.length).toBeGreaterThan(10000)
    })

    test('should handle prompts with special characters', () => {
      const specialPrompt = 'Test $placeholder & <html> "quotes"'
      const prompts = new Prompts(specialPrompt)
      const inputs = new Inputs()
      
      const result = prompts.renderSummarize(inputs)
      expect(result).toContain('Test $placeholder')
    })
  })

  describe('Consistency Across Methods', () => {
    test('all render methods should return strings', () => {
      const prompts = new Prompts('test', 'test')
      const inputs = new Inputs()
      
      expect(typeof prompts.renderSummarize(inputs)).toBe('string')
      expect(typeof prompts.renderSummarizeShort(inputs)).toBe('string')
      expect(typeof prompts.renderSummarizeReleaseNotes(inputs)).toBe('string')
      expect(typeof prompts.renderComment(inputs)).toBe('string')
      expect(typeof prompts.renderReviewFileDiff(inputs)).toBe('string')
      expect(typeof prompts.renderSummarizeChangesets(inputs)).toBe('string')
      expect(typeof prompts.renderSummarizeFileDiff(inputs, true)).toBe('string')
    })

    test('all render methods should handle empty inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      expect(prompts.renderSummarize(inputs).length).toBeGreaterThan(0)
      expect(prompts.renderComment(inputs).length).toBeGreaterThan(0)
      expect(prompts.renderReviewFileDiff(inputs).length).toBeGreaterThan(0)
    })
  })

  describe('Real-World Usage Patterns', () => {
    test('should support PR summary workflow', () => {
      const prompts = new Prompts(
        'Summarize the PR changes',
        'Create release notes'
      )
      const inputs = new Inputs()
      inputs.title = 'feat: Add new feature'
      inputs.description = 'Implements feature X'
      inputs.rawSummary = 'file1.ts: Added function\nfile2.ts: Updated tests'
      
      const summary = prompts.renderSummarize(inputs)
      const shortSummary = prompts.renderSummarizeShort(inputs)
      const releaseNotes = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(summary).toContain('feat: Add new feature')
      expect(shortSummary).toContain('concise summary')
      expect(releaseNotes).toContain('release notes')
    })

    test('should support code review workflow', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.title = 'fix: Bug fix'
      inputs.filename = 'src/app.ts'
      inputs.patches = '@@ -10,3 +10,4 @@\n+  fixed line'
      inputs.shortSummary = 'Fixes null pointer exception'
      
      const review = prompts.renderReviewFileDiff(inputs)
      
      expect(review).toContain('fix: Bug fix')
      expect(review).toContain('src/app.ts')
      expect(review).toContain('fixed line')
    })

    test('should support comment reply workflow', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.filename = 'src/test.ts'
      inputs.comment = 'reviewer: Please add error handling'
      inputs.commentChain = 'author: Will do\nreviewer: Thanks'
      inputs.diff = '+  try { ... } catch (e) { ... }'
      
      const reply = prompts.renderComment(inputs)
      
      expect(reply).toContain('src/test.ts')
      expect(reply).toContain('Please add error handling')
      expect(reply).toContain('Will do')
    })
  })
})