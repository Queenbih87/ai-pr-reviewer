import { Prompts } from '../src/prompts'
import { Inputs } from '../src/inputs'

describe('Prompts rendering', () => {
  const baseInputs = new Inputs(
    'SYSTEM',
    'My PR title',
    'PR description',
    'RAW',
    'SHORT',
    'file.ts',
    'CONTENT',
    'DIFF',
    'PATCHES',
    'HUNK_DIFF',
    'CHAIN',
    'COMMENT'
  )

  test('renderSummarizeFileDiff includes triage block when reviewSimpleChanges=false', () => {
    const p = new Prompts('SUMMARY HERE', 'RELEASE NOTES HERE')
    const out = p.renderSummarizeFileDiff(baseInputs, false)
    expect(out).toContain('TRIAGE')
    expect(out).toContain('NEEDS_REVIEW')
    expect(out).toContain('APPROVED')
  })

  test('renderSummarizeFileDiff omits triage block when reviewSimpleChanges=true', () => {
    const p = new Prompts('SUMMARY HERE', 'RELEASE NOTES HERE')
    const out = p.renderSummarizeFileDiff(baseInputs, true)
    expect(out).not.toContain('[TRIAGE]:')
  })

  test('renderReviewFileDiff includes filename marker and patches section', () => {
    const p = new Prompts('summary', 'notes')
    const out = p.renderReviewFileDiff(baseInputs)
    expect(out).toContain('## Changes made to `file.ts` for your review')
    expect(out).toContain('PATCHES')
  })

  test('renderSummarize includes provided summarize prompt', () => {
    const p = new Prompts('MY_SUMMARY_PROMPT', 'notes')
    const out = p.renderSummarize(baseInputs)
    expect(out).toContain('MY_SUMMARY_PROMPT')
    expect(out).toContain('RAW')
  })
})