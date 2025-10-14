// Mock minimal @actions/github context so importing commenter.ts doesn't break
jest.mock('@actions/github', () => ({
  context: { repo: { owner: 'owner', repo: 'repo' }, payload: {} }
}))

import {
  Commenter,
  DESCRIPTION_END_TAG,
  DESCRIPTION_START_TAG,
  RAW_SUMMARY_END_TAG,
  RAW_SUMMARY_START_TAG,
  SHORT_SUMMARY_END_TAG,
  SHORT_SUMMARY_START_TAG,
  COMMIT_ID_START_TAG,
  COMMIT_ID_END_TAG
} from '../src/commenter'

describe('Commenter string helpers', () => {
  const commenter = new Commenter()

  test('getContentWithinTags and removeContentWithinTags', () => {
    const content = `Hello
START_TAG
[inner]
END_TAG
Bye`
    const inner = commenter.getContentWithinTags(content, 'START_TAG', 'END_TAG')
    expect(inner).toBe('\n[inner]\n')

    const stripped = commenter.removeContentWithinTags(content, 'START_TAG', 'END_TAG')
    expect(stripped).toBe('Hello\nBye')
  })

  test('RAW and SHORT summary tags', () => {
    const body = `
${RAW_SUMMARY_START_TAG}
This is a raw summary
${RAW_SUMMARY_END_TAG}
${SHORT_SUMMARY_START_TAG}
This is a short summary
${SHORT_SUMMARY_END_TAG}
`.trim()

    expect(commenter.getRawSummary(body).trim()).toBe('This is a raw summary')
    expect(commenter.getShortSummary(body).trim()).toBe('This is a short summary')
  })

  test('getDescription removes release-notes block and getReleaseNotes extracts payload', () => {
    const body = `
Some intro
${DESCRIPTION_START_TAG}
> Any quoted header
Line A
Line B
${DESCRIPTION_END_TAG}
Footer
`.trim()

    const desc = commenter.getDescription(body)
    expect(desc).not.toContain(DESCRIPTION_START_TAG)
    expect(desc).not.toContain(DESCRIPTION_END_TAG)
    expect(desc).toContain('Some intro')
    expect(desc).toContain('Footer')

    const notes = commenter.getReleaseNotes(body)
    // quoted lines ("> ...") are removed
    expect(notes).toContain('Line A')
    expect(notes).toContain('Line B')
    expect(notes).not.toContain('Any quoted header')
  })

  test('add/remove In-Progress status', () => {
    const base = 'Body'
    const withStatus = commenter.addInProgressStatus(base, 'Status text')
    expect(withStatus).toContain('Currently reviewing new changes in this PR')
    const onceMore = commenter.addInProgressStatus(withStatus, 'Status text')
    // idempotent: not duplicated
    const count = (onceMore.match(/in progress by OSS CodeRabbit/g) || []).length
    expect(count).toBe(1)

    const removed = commenter.removeInProgressStatus(onceMore)
    expect(removed).not.toContain('in progress by OSS CodeRabbit')
    expect(removed).toContain('Body')
  })

  test('commit IDs helpers', () => {
    let body = 'Intro'
    body = commenter.addReviewedCommitId(body, 'abc123')
    body = commenter.addReviewedCommitId(body, 'def456')

    const block = commenter.getReviewedCommitIdsBlock(body)
    expect(block).toContain(COMMIT_ID_START_TAG)
    expect(block).toContain(COMMIT_ID_END_TAG)

    const ids = commenter.getReviewedCommitIds(body)
    expect(ids).toEqual(['abc123', 'def456'])

    // Highest reviewed from ordered commit list
    const highest = commenter.getHighestReviewedCommitId(
      ['aaa111', 'abc123', 'def456', 'zzz999'],
      ['abc123']
    )
    expect(highest).toBe('abc123')

    const none = commenter.getHighestReviewedCommitId(['x', 'y'], ['z'])
    expect(none).toBe('')
  })
})