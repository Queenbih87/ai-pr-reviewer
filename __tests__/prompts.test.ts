import {describe, expect, test} from '@jest/globals'
import {Prompts} from '../src/prompts'
import {Inputs} from '../src/inputs'

describe('Prompts Class', () => {
  describe('Constructor', () => {
    test('should create instance with default values', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarize).toBe('')
      expect(prompts.summarizeReleaseNotes).toBe('')
    })

    test('should create instance with custom values', () => {
      const prompts = new Prompts('Custom summarize', 'Custom release notes')
      
      expect(prompts.summarize).toBe('Custom summarize')
      expect(prompts.summarizeReleaseNotes).toBe('Custom release notes')
    })

    test('should have predefined template properties', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toBeDefined()
      expect(prompts.triageFileDiff).toBeDefined()
      expect(prompts.summarizeChangesets).toBeDefined()
      expect(prompts.summarizePrefix).toBeDefined()
      expect(prompts.summarizeShort).toBeDefined()
      expect(prompts.reviewFileDiff).toBeDefined()
      expect(prompts.comment).toBeDefined()
    })
  })

  describe('Template content validation', () => {
    test('summarizeFileDiff should contain required placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeFileDiff).toContain('$title')
      expect(prompts.summarizeFileDiff).toContain('$description')
      expect(prompts.summarizeFileDiff).toContain('$file_diff')
    })

    test('triageFileDiff should contain TRIAGE format', () => {
      const prompts = new Prompts()
      
      expect(prompts.triageFileDiff).toContain('[TRIAGE]')
      expect(prompts.triageFileDiff).toContain('NEEDS_REVIEW')
      expect(prompts.triageFileDiff).toContain('APPROVED')
    })

    test('summarizeChangesets should contain raw_summary placeholder', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizeChangesets).toContain('$raw_summary')
    })

    test('summarizePrefix should contain raw_summary placeholder', () => {
      const prompts = new Prompts()
      
      expect(prompts.summarizePrefix).toContain('$raw_summary')
    })

    test('reviewFileDiff should contain all necessary placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.reviewFileDiff).toContain('$title')
      expect(prompts.reviewFileDiff).toContain('$description')
      expect(prompts.reviewFileDiff).toContain('$short_summary')
      expect(prompts.reviewFileDiff).toContain('$filename')
      expect(prompts.reviewFileDiff).toContain('$patches')
    })

    test('comment should contain all necessary placeholders', () => {
      const prompts = new Prompts()
      
      expect(prompts.comment).toContain('$filename')
      expect(prompts.comment).toContain('$title')
      expect(prompts.comment).toContain('$description')
      expect(prompts.comment).toContain('$short_summary')
      expect(prompts.comment).toContain('$file_diff')
      expect(prompts.comment).toContain('$diff')
      expect(prompts.comment).toContain('$comment_chain')
      expect(prompts.comment).toContain('$comment')
    })
  })

  describe('renderSummarizeFileDiff', () => {
    test('should render template with reviewSimpleChanges=true', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', 'Test Title', 'Test Description')
      inputs.fileDiff = '+const x = 1'
      
      const result = prompts.renderSummarizeFileDiff(inputs, true)
      
      expect(result).toContain('Test Title')
      expect(result).toContain('Test Description')
      expect(result).toContain('+const x = 1')
      expect(result).not.toContain('[TRIAGE]')
    })

    test('should render template with reviewSimpleChanges=false', () => {
      const prompts = new Prompts()
      const inputs = new Inputs('', 'Test Title', 'Test Description')
      inputs.fileDiff = '+const x = 1'
      
      const result = prompts.renderSummarizeFileDiff(inputs, false)
      
      expect(result).toContain('Test Title')
      expect(result).toContain('Test Description')
      expect(result).toContain('+const x = 1')
      expect(result).toContain('[TRIAGE]')
      expect(result).toContain('NEEDS_REVIEW')
      expect(result).toContain('APPROVED')
    })

    test('should handle empty inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeFileDiff(inputs, true)
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('renderSummarizeChangesets', () => {
    test('should render template with raw summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'File1: summary1\nFile2: summary2'
      
      const result = prompts.renderSummarizeChangesets(inputs)
      
      expect(result).toContain('File1: summary1')
      expect(result).toContain('File2: summary2')
      expect(result).toContain('changesets')
    })

    test('should handle empty raw summary', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeChangesets(inputs)
      
      expect(result).toBeDefined()
      expect(result).not.toContain('$raw_summary')
    })
  })

  describe('renderSummarize', () => {
    test('should render custom summarize prompt', () => {
      const prompts = new Prompts('Please provide a detailed summary')
      const inputs = new Inputs()
      inputs.rawSummary = 'Raw data here'
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('Please provide a detailed summary')
      expect(result).toContain('Raw data here')
    })

    test('should include summarizePrefix', () => {
      const prompts = new Prompts('Custom prompt')
      const inputs = new Inputs()
      inputs.rawSummary = 'Summary content'
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('Here is the summary of changes')
      expect(result).toContain('Custom prompt')
    })

    test('should handle empty custom summarize', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'Summary'
      
      const result = prompts.renderSummarize(inputs)
      
      expect(result).toContain('Summary')
    })
  })

  describe('renderSummarizeShort', () => {
    test('should render short summary template', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'Long detailed summary'
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('Long detailed summary')
      expect(result).toContain('concise summary')
      expect(result).toContain('500 words')
    })

    test('should include instructions about not providing review instructions', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('Do not provide any instructions to the bot')
    })
  })

  describe('renderSummarizeReleaseNotes', () => {
    test('should render release notes template', () => {
      const prompts = new Prompts('', 'Generate release notes in markdown')
      const inputs = new Inputs()
      inputs.rawSummary = 'Changes made'
      
      const result = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(result).toContain('Generate release notes in markdown')
      expect(result).toContain('Changes made')
    })

    test('should include summarizePrefix', () => {
      const prompts = new Prompts('', 'Custom release notes prompt')
      const inputs = new Inputs()
      inputs.rawSummary = 'Summary'
      
      const result = prompts.renderSummarizeReleaseNotes(inputs)
      
      expect(result).toContain('Here is the summary of changes')
      expect(result).toContain('Custom release notes prompt')
    })
  })

  describe('renderComment', () => {
    test('should render comment template with all inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.filename = 'test.ts'
      inputs.title = 'PR Title'
      inputs.description = 'PR Description'
      inputs.shortSummary = 'Short summary'
      inputs.fileDiff = '+const x = 1'
      inputs.diff = '@@ -1,1 +1,1 @@'
      inputs.commentChain = 'user1: comment1'
      inputs.comment = 'user2: new comment'
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toContain('test.ts')
      expect(result).toContain('PR Title')
      expect(result).toContain('PR Description')
      expect(result).toContain('Short summary')
      expect(result).toContain('+const x = 1')
      expect(result).toContain('@@ -1,1 +1,1 @@')
      expect(result).toContain('user1: comment1')
      expect(result).toContain('user2: new comment')
    })

    test('should include instructions about replying with @user', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toContain('@user')
      expect(result).toContain('Please reply directly')
    })

    test('should handle minimal inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderComment(inputs)
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('renderReviewFileDiff', () => {
    test('should render review template with all inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.title = 'Fix bug in parser'
      inputs.description = 'This PR fixes the parser bug'
      inputs.shortSummary = 'Parser bug fix'
      inputs.filename = 'parser.ts'
      inputs.patches = 'patch content here'
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Fix bug in parser')
      expect(result).toContain('This PR fixes the parser bug')
      expect(result).toContain('Parser bug fix')
      expect(result).toContain('parser.ts')
      expect(result).toContain('patch content here')
    })

    test('should include review instructions', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('IMPORTANT Instructions')
      expect(result).toContain('LGTM!')
      expect(result).toContain('Review comments in markdown')
    })

    test('should include example review format', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Example')
      expect(result).toContain('---new_hunk---')
      expect(result).toContain('---old_hunk---')
    })

    test('should mention not using suggestion code blocks', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Do not use `suggestion` code blocks')
    })
  })

  describe('Template immutability', () => {
    test('should not modify original templates during render', () => {
      const prompts = new Prompts('Original summarize', 'Original release notes')
      const inputs = new Inputs()
      inputs.rawSummary = 'Some summary'
      
      const originalSummarize = prompts.summarize
      const originalReleaseNotes = prompts.summarizeReleaseNotes
      const originalFileDiff = prompts.summarizeFileDiff
      
      prompts.renderSummarize(inputs)
      prompts.renderSummarizeReleaseNotes(inputs)
      prompts.renderSummarizeFileDiff(inputs, false)
      
      expect(prompts.summarize).toBe(originalSummarize)
      expect(prompts.summarizeReleaseNotes).toBe(originalReleaseNotes)
      expect(prompts.summarizeFileDiff).toBe(originalFileDiff)
    })
  })

  describe('Complex rendering scenarios', () => {
    test('should handle multiple renders with different inputs', () => {
      const prompts = new Prompts()
      const inputs1 = new Inputs()
      inputs1.title = 'Title 1'
      const inputs2 = new Inputs()
      inputs2.title = 'Title 2'
      
      const result1 = prompts.renderSummarizeFileDiff(inputs1, true)
      const result2 = prompts.renderSummarizeFileDiff(inputs2, true)
      
      expect(result1).toContain('Title 1')
      expect(result1).not.toContain('Title 2')
      expect(result2).toContain('Title 2')
      expect(result2).not.toContain('Title 1')
    })

    test('should handle special characters in inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.title = 'Fix: Handle $special & <chars>'
      inputs.description = 'Description with "quotes" and \n newlines'
      
      const result = prompts.renderReviewFileDiff(inputs)
      
      expect(result).toContain('Fix: Handle $special & <chars>')
      expect(result).toContain('Description with "quotes"')
    })

    test('should handle very long inputs', () => {
      const prompts = new Prompts()
      const inputs = new Inputs()
      inputs.rawSummary = 'A'.repeat(10000)
      
      const result = prompts.renderSummarizeShort(inputs)
      
      expect(result).toContain('A'.repeat(10000))
    })
  })
})