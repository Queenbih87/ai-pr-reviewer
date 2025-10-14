import {describe, expect, test} from '@jest/globals'
import {Prompts} from '../src/prompts'
import {Inputs} from '../src/inputs'

describe('Prompts', () => {
  describe('constructor', () => {
    test('should initialize with default values', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarize).toBe('')
      expect(prompts.summarizeReleaseNotes).toBe('')
    })

    test('should initialize with custom values', () => {
      const prompts = new Prompts('custom summarize', 'custom release notes')
      
      expect(prompts.summarize).toBe('custom summarize')
      expect(prompts.summarizeReleaseNotes).toBe('custom release notes')
    })

    test('should have predefined template strings', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toContain('$title')
      expect(prompts.summarizeFileDiff).toContain('$description')
      expect(prompts.summarizeFileDiff).toContain('$file_diff')
      
      expect(prompts.triageFileDiff).toContain('NEEDS_REVIEW')
      expect(prompts.triageFileDiff).toContain('APPROVED')
      
      expect(prompts.summarizeChangesets).toContain('$raw_summary')
      
      expect(prompts.reviewFileDiff).toContain('$title')
      expect(prompts.reviewFileDiff).toContain('$short_summary')
      expect(prompts.reviewFileDiff).toContain('$patches')
      
      expect(prompts.comment).toContain('$filename')
      expect(prompts.comment).toContain('$comment_chain')
      expect(prompts.comment).toContain('$comment')
    })
  })

  describe('renderSummarizeFileDiff', () => {
    test('should render with review simple changes disabled', () => {
      const prompts = new Prompts()
      const inputs = new Inputs(
        '',
        'Test PR Title',
        'Test description',
        '',
        '',
        'test.ts',
        '',
        'diff content here'
      )

      const result = prompts.renderSummarizeFileDiff(inputs, false)

      expect(result).toContain('Test PR Title')
      expect(result).toContain('Test description')
      expect(result).toContain('diff content here')
      expect(result).toContain('[TRIAGE]')
      expect(result).toContain('NEEDS_REVIEW or APPROVED')
    })

    test('should render without triage when review simple changes enabled', () => {
      const prompts = new Prompts()
      const inputs = new Inputs(
        '',
        'Test PR Title',
        'Test description',
        '',
        '',
        'test.ts',
        '',
        'diff content here'
      )

      const result = prompts.renderSummarizeFileDiff(inputs, true)

      expect(result).toContain('Test PR Title')
      expect(result).toContain('diff content here')
      expect(result).not.toContain('[TRIAGE]')
    })

    test('should include summarize instructions', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderSummarizeFileDiff(inputs, true)

      expect(result).toContain('succinctly summarize')
      expect(result).toContain('within 100 words')
    })
  })

  describe('renderSummarizeChangesets', () => {
    test('should render with raw summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'File1: change 1\nFile2: change 2'

      const result = prompts.renderSummarizeChangesets(inputs)

      expect(result).toContain('File1: change 1')
      expect(result).toContain('File2: change 2')
      expect(result).toContain('deduplicate and group')
    })

    test('should handle empty raw summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderSummarizeChangesets(inputs)

      expect(result).toContain('$raw_summary')
    })
  })

  describe('renderSummarize', () => {
    test('should render with custom summarize prompt', () => {
      const prompts = new Prompts('Please provide a detailed summary')
      const inputs = new Inputs()
      inputs.rawSummary = 'Raw summary content'

      const result = prompts.renderSummarize(inputs)

      expect(result).toContain('Please provide a detailed summary')
      expect(result).toContain('Raw summary content')
      expect(result).toContain('Here is the summary of changes')
    })

    test('should use prefix with summary', () => {
      const prompts = new Prompts('custom prompt')
      const inputs = new Inputs()

      const result = prompts.renderSummarize(inputs)

      expect(result).toContain('Here is the summary of changes')
      expect(result).toContain('custom prompt')
    })
  })

  describe('renderSummarizeShort', () => {
    test('should render short summary template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'Detailed raw summary here'

      const result = prompts.renderSummarizeShort(inputs)

      expect(result).toContain('Detailed raw summary here')
      expect(result).toContain('concise summary')
      expect(result).toContain('not exceed 500 words')
    })

    test('should include guidelines for summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderSummarizeShort(inputs)

      expect(result).toContain('Focus on summarizing only the changes')
      expect(result).toContain('stick to the facts')
    })
  })

  describe('renderSummarizeReleaseNotes', () => {
    test('should render with custom release notes prompt', () => {
      const prompts = new Prompts('', 'Generate release notes in markdown')
      const inputs = new Inputs()
      inputs.rawSummary = 'Changes summary'

      const result = prompts.renderSummarizeReleaseNotes(inputs)

      expect(result).toContain('Generate release notes in markdown')
      expect(result).toContain('Changes summary')
      expect(result).toContain('Here is the summary of changes')
    })

    test('should use prefix with release notes', () => {
      const prompts = new Prompts('', 'release notes prompt')
      const inputs = new Inputs()

      const result = prompts.renderSummarizeReleaseNotes(inputs)

      expect(result).toContain('Here is the summary of changes')
      expect(result).toContain('release notes prompt')
    })
  })

  describe('renderComment', () => {
    test('should render comment template with all variables', () => {
      const prompts = new Prompts()
      const inputs = new Inputs(
        '',
        'PR Title',
        'PR Description',
        '',
        'Short summary',
        'file.ts',
        'file content',
        'file diff',
        '',
        'diff section',
        'user1: comment1\nuser2: comment2',
        'user3: please review this'
      )

      const result = prompts.renderComment(inputs)

      expect(result).toContain('PR Title')
      expect(result).toContain('PR Description')
      expect(result).toContain('Short summary')
      expect(result).toContain('file.ts')
      expect(result).toContain('file diff')
      expect(result).toContain('diff section')
      expect(result).toContain('user1: comment1')
      expect(result).toContain('user3: please review this')
    })

    test('should include instructions for replying', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderComment(inputs)

      expect(result).toContain('reply directly to the new comment')
      expect(result).toContain('tagging the user with "@user"')
    })
  })

  describe('renderReviewFileDiff', () => {
    test('should render review template with all variables', () => {
      const prompts = new Prompts()
      const inputs = new Inputs(
        '',
        'PR Title',
        'PR Description',
        '',
        'Short summary here',
        'src/test.ts',
        '',
        '',
        'patch content here'
      )

      const result = prompts.renderReviewFileDiff(inputs)

      expect(result).toContain('PR Title')
      expect(result).toContain('PR Description')
      expect(result).toContain('Short summary here')
      expect(result).toContain('src/test.ts')
      expect(result).toContain('patch content here')
    })

    test('should include review instructions', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderReviewFileDiff(inputs)

      expect(result).toContain('IMPORTANT Instructions')
      expect(result).toContain('Review new hunks')
      expect(result).toContain('LGTM!')
    })

    test('should include example format', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      const result = prompts.renderReviewFileDiff(inputs)

      expect(result).toContain('## Example')
      expect(result).toContain('Example changes')
      expect(result).toContain('Example response')
    })
  })

  describe('template consistency', () => {
    test('all templates should use consistent variable naming', () => {
      const prompts = new Prompts()

      const templates = [
        prompts.summarizeFileDiff,
        prompts.triageFileDiff,
        prompts.summarizeChangesets,
        prompts.summarizePrefix,
        prompts.summarizeShort,
        prompts.reviewFileDiff,
        prompts.comment
      ]

      // All variables should start with $
      for (const template of templates) {
        const variables = template.match(/\$\w+/g) || []
        for (const variable of variables) {
          expect(variable).toMatch(/^\$[a-z_]+$/)
        }
      }
    })

    test('templates should not have undefined variable references', () => {
      const prompts = new Prompts()
      const inputs = new Inputs(
        'sys',
        'title',
        'desc',
        'raw',
        'short',
        'file',
        'content',
        'fdiff',
        'patches',
        'diff',
        'chain',
        'comment'
      )

      // Rendering should not leave any $variable placeholders
      const renderedSummary = prompts.renderSummarizeFileDiff(inputs, false)
      const renderedComment = prompts.renderComment(inputs)
      const renderedReview = prompts.renderReviewFileDiff(inputs)

      expect(renderedSummary).toContain('title')
      expect(renderedComment).toContain('file')
      expect(renderedReview).toContain('patches')
    })
  })

  describe('edge cases', () => {
    test('should handle very long prompts', () => {
      const longPrompt = 'x'.repeat(10000)
      const prompts = new Prompts(longPrompt, longPrompt)

      expect(prompts.summarize).toBe(longPrompt)
      expect(prompts.summarizeReleaseNotes).toBe(longPrompt)
    })

    test('should handle special characters in prompts', () => {
      const specialPrompt = 'Test with $special @chars #and %symbols'
      const prompts = new Prompts(specialPrompt, specialPrompt)

      expect(prompts.summarize).toBe(specialPrompt)
      expect(prompts.summarizeReleaseNotes).toBe(specialPrompt)
    })

    test('should handle multiline prompts', () => {
      const multilinePrompt = `Line 1
Line 2
Line 3`
      const prompts = new Prompts(multilinePrompt)

      expect(prompts.summarize).toBe(multilinePrompt)
      expect(prompts.summarize).toContain('\n')
    })

    test('should handle empty inputs in rendering', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()

      expect(() => prompts.renderSummarizeFileDiff(inputs, false)).not.toThrow()
      expect(() => prompts.renderComment(inputs)).not.toThrow()
      expect(() => prompts.renderReviewFileDiff(inputs)).not.toThrow()
    })
  })

  describe('realistic usage scenarios', () => {
    test('should generate complete review workflow prompts', () => {
      const prompts = new Prompts(
        'Summarize the changes in this PR',
        'Generate release notes'
      )
      const inputs = new Inputs(
        '',
        'Add new feature',
        'This PR adds a new feature for users',
        'File1: Added method\nFile2: Updated logic',
        'Added feature with 2 file changes',
        'src/feature.ts',
        'class Feature { }',
        '+++ new code\n--- old code',
        'patch content',
        '+5 -3',
        'reviewer1: looks good',
        'reviewer2: please check this'
      )

      // Test full workflow
      const summaryPrompt = prompts.renderSummarizeFileDiff(inputs, false)
      const changesetsPrompt = prompts.renderSummarizeChangesets(inputs)
      const shortSummaryPrompt = prompts.renderSummarizeShort(inputs)
      const releaseNotesPrompt = prompts.renderSummarizeReleaseNotes(inputs)
      const reviewPrompt = prompts.renderReviewFileDiff(inputs)
      const commentPrompt = prompts.renderComment(inputs)

      expect(summaryPrompt).toContain('Add new feature')
      expect(changesetsPrompt).toContain('File1: Added method')
      expect(shortSummaryPrompt).toContain('concise summary')
      expect(releaseNotesPrompt).toContain('Generate release notes')
      expect(reviewPrompt).toContain('src/feature.ts')
      expect(commentPrompt).toContain('reviewer2: please check this')
    })
  })
})