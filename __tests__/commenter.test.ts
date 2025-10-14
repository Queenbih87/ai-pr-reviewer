import {describe, expect, test} from '@jest/globals'
import {
  Commenter,
  COMMIT_ID_START_TAG,
  COMMIT_ID_END_TAG,
  IN_PROGRESS_START_TAG,
  IN_PROGRESS_END_TAG
} from '../src/commenter'

describe('Commenter helpers', () => {
  test('commit id block add and parse', () => {
    const commenter = new Commenter()

    let body = 'Initial summary'
    // Add a commit id where block does not exist
    body = commenter.addReviewedCommitId(body, 'abc123')
    expect(body).toContain(COMMIT_ID_START_TAG)
    expect(body).toContain(COMMIT_ID_END_TAG)
    expect(commenter.getReviewedCommitIds(body)).toEqual(['abc123'])

    // Add another commit id
    body = commenter.addReviewedCommitId(body, 'def456')
    const ids = commenter.getReviewedCommitIds(body)
    expect(ids).toEqual(['abc123', 'def456'])

    // Extract exact block
    const block = commenter.getReviewedCommitIdsBlock(body)
    expect(block).toContain('abc123')
    expect(block).toContain('def456')
  })

  test('in-progress markers add and remove', () => {
    const commenter = new Commenter()
    const statusMsg = 'Processing updates...'

    let body = 'Existing comment content'
    body = commenter.addInProgressStatus(body, statusMsg)
    expect(body).toContain(IN_PROGRESS_START_TAG)
    expect(body).toContain(IN_PROGRESS_END_TAG)
    expect(body.indexOf(IN_PROGRESS_START_TAG)).toBeLessThan(body.indexOf('Existing comment content'))

    // Now remove
    const cleaned = commenter.removeInProgressStatus(body)
    expect(cleaned).not.toContain(IN_PROGRESS_START_TAG)
    expect(cleaned).not.toContain(IN_PROGRESS_END_TAG)
    expect(cleaned).toContain('Existing comment content')
  })
})