import {describe, expect, test} from '@jest/globals'
import {
  Commenter,
  RAW_SUMMARY_START_TAG,
  RAW_SUMMARY_END_TAG,
  SHORT_SUMMARY_START_TAG,
  SHORT_SUMMARY_END_TAG,
  DESCRIPTION_START_TAG,
  DESCRIPTION_END_TAG,
  COMMIT_ID_START_TAG,
  COMMIT_ID_END_TAG,
  IN_PROGRESS_START_TAG,
  IN_PROGRESS_END_TAG
} from '../src/commenter'

describe('Commenter tag utilities', () => {
  const commenter = new Commenter()

  test('getContentWithinTags and removeContentWithinTags', () => {
    const content = `Header
${RAW_SUMMARY_START_TAG}
This is raw summary
${RAW_SUMMARY_END_TAG}
Footer`
    const extracted = commenter.getContentWithinTags(
      content,
      RAW_SUMMARY_START_TAG,
      RAW_SUMMARY_END_TAG
    )
    expect(extracted).toContain('This is raw summary')

    const removed = commenter.removeContentWithinTags(
      content,
      RAW_SUMMARY_START_TAG,
      RAW_SUMMARY_END_TAG
    )
    expect(removed).toContain('Header')
    expect(removed).toContain('Footer')
    expect(removed).not.toContain('This is raw summary')
  })

  test('getRawSummary and getShortSummary', () => {
    const body = `${RAW_SUMMARY_START_TAG}
RS
${RAW_SUMMARY_END_TAG}
${SHORT_SUMMARY_START_TAG}
SS
${SHORT_SUMMARY_END_TAG}`
    expect(commenter.getRawSummary(body)).toBe('\nRS\n')
    expect(commenter.getShortSummary(body)).toBe('\nSS\n')
  })

  test('getDescription strips release notes block', () => {
    const description = `Intro
${DESCRIPTION_START_TAG}
Release Notes here
${DESCRIPTION_END_TAG}
Outro`
    const result = commenter.getDescription(description)
    expect(result).toContain('Intro')
    expect(result).toContain('Outro')
    expect(result).not.toContain('Release Notes here')
    expect(result).not.toContain(DESCRIPTION_START_TAG)
    expect(result).not.toContain(DESCRIPTION_END_TAG)
  })

  test('getReleaseNotes removes blockquote lines', () => {
    const description = `${DESCRIPTION_START_TAG}
> This is a quote
- Real bullet 1
> Another quote
- Real bullet 2
${DESCRIPTION_END_TAG}`
    const releaseNotes = commenter.getReleaseNotes(description)
    expect(releaseNotes).not.toMatch(/^> /m)
    expect(releaseNotes).toContain('Real bullet 1')
    expect(releaseNotes).toContain('Real bullet 2')
  })
})

describe('Commenter reviewed commit id utilities', () => {
  const commenter = new Commenter()

  test('addReviewedCommitId creates markers and appends ids', () => {
    let body = 'Initial'
    body = commenter.addReviewedCommitId(body, 'abc123')
    expect(body).toContain(COMMIT_ID_START_TAG)
    expect(body).toContain(COMMIT_ID_END_TAG)
    expect(body).toContain('<!-- abc123 -->')

    body = commenter.addReviewedCommitId(body, 'def456')
    expect(body).toContain('<!-- abc123 -->')
    expect(body).toContain('<!-- def456 -->')

    const ids = commenter.getReviewedCommitIds(body)
    expect(ids).toEqual(['abc123', 'def456'])
  })

  test('getReviewedCommitIdsBlock returns only marker block', () => {
    const body = `Some text
${COMMIT_ID_START_TAG}
<!-- c1 -->
<!-- c2 -->
${COMMIT_ID_END_TAG}
Other text`
    const block = commenter.getReviewedCommitIdsBlock(body)
    expect(block).toContain(COMMIT_ID_START_TAG)
    expect(block).toContain(COMMIT_ID_END_TAG)
    expect(block).toContain('<!-- c1 -->')
    expect(block).toContain('<!-- c2 -->')
  })

  test('getHighestReviewedCommitId identifies the last reviewed in the commit list order', () => {
    const commitIds = ['a1', 'abc123', 'z9']
    const reviewed = ['abc123']
    expect(commenter.getHighestReviewedCommitId(commitIds, reviewed)).toBe('abc123')

    const noneReviewed = ['xxx']
    expect(commenter.getHighestReviewedCommitId(commitIds, noneReviewed)).toBe('')
  })
})

describe('Commenter in-progress status', () => {
  const commenter = new Commenter()

  test('addInProgressStatus adds block to the top and removeInProgressStatus removes it', () => {
    const original = 'Body content'
    const withStatus = commenter.addInProgressStatus(original, 'Status message')
    expect(withStatus).toContain(IN_PROGRESS_START_TAG)
    expect(withStatus).toContain(IN_PROGRESS_END_TAG)
    expect(withStatus).toContain('Currently reviewing new changes in this PR...')
    expect(withStatus).toMatch(/---\s*\n\s*Body content/)

    const removed = commenter.removeInProgressStatus(withStatus)
    expect(removed).not.toContain(IN_PROGRESS_START_TAG)
    expect(removed).not.toContain(IN_PROGRESS_END_TAG)
    expect(removed).toContain('Body content')
  })
})