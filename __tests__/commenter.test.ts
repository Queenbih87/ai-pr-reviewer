import {describe, expect, test, jest, beforeEach} from '@jest/globals'
import {
  Commenter,
  COMMENT_GREETING,
  COMMENT_TAG,
  COMMENT_REPLY_TAG,
  SUMMARIZE_TAG,
  IN_PROGRESS_START_TAG,
  IN_PROGRESS_END_TAG,
  DESCRIPTION_START_TAG,
  DESCRIPTION_END_TAG,
  RAW_SUMMARY_START_TAG,
  RAW_SUMMARY_END_TAG,
  SHORT_SUMMARY_START_TAG,
  SHORT_SUMMARY_END_TAG,
  COMMIT_ID_START_TAG,
  COMMIT_ID_END_TAG
} from '../src/commenter'

// Mock dependencies
jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/octokit')

describe('Commenter Constants', () => {
  test('should have correct COMMENT_GREETING', () => {
    expect(COMMENT_GREETING).toContain('CodeRabbit')
  })

  test('should have HTML comment tags', () => {
    expect(COMMENT_TAG).toContain('<!--')
    expect(COMMENT_TAG).toContain('-->')
    expect(COMMENT_REPLY_TAG).toContain('<!--')
    expect(COMMENT_REPLY_TAG).toContain('-->')
    expect(SUMMARIZE_TAG).toContain('<!--')
    expect(SUMMARIZE_TAG).toContain('-->')
  })

  test('should have unique tag identifiers', () => {
    expect(COMMENT_TAG).not.toBe(COMMENT_REPLY_TAG)
    expect(COMMENT_TAG).not.toBe(SUMMARIZE_TAG)
    expect(COMMENT_REPLY_TAG).not.toBe(SUMMARIZE_TAG)
  })
})

describe('Commenter Class', () => {
  let commenter: Commenter

  beforeEach(() => {
    commenter = new Commenter()
  })

  describe('getContentWithinTags', () => {
    test('should extract content between tags', () => {
      const content = 'Before<!-- start -->Middle content<!-- end -->After'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('Middle content')
    })

    test('should return empty string if start tag not found', () => {
      const content = 'Some content<!-- end -->After'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should return empty string if end tag not found', () => {
      const content = 'Before<!-- start -->Some content'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should return empty string if both tags missing', () => {
      const content = 'No tags here'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should handle multiline content', () => {
      const content = `Before
<!-- start -->
Line 1
Line 2
Line 3
<!-- end -->
After`
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
      expect(result).toContain('Line 3')
    })

    test('should handle empty content between tags', () => {
      const content = 'Before<!-- start --><!-- end -->After'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should handle tags at start and end of string', () => {
      const content = '<!-- start -->Content<!-- end -->'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('Content')
    })
  })

  describe('removeContentWithinTags', () => {
    test('should remove content between tags including tags', () => {
      const content = 'Before<!-- start -->Remove this<!-- end -->After'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('BeforeAfter')
      expect(result).not.toContain('Remove this')
      expect(result).not.toContain('<!-- start -->')
      expect(result).not.toContain('<!-- end -->')
    })

    test('should return original content if start tag not found', () => {
      const content = 'Content without start tag<!-- end -->After'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe(content)
    })

    test('should return original content if end tag not found', () => {
      const content = 'Before<!-- start -->Content without end tag'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe(content)
    })

    test('should handle multiline content removal', () => {
      const content = `Keep this
<!-- start -->
Remove line 1
Remove line 2
<!-- end -->
Keep this too`
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toContain('Keep this')
      expect(result).toContain('Keep this too')
      expect(result).not.toContain('Remove line 1')
      expect(result).not.toContain('Remove line 2')
    })

    test('should use lastIndexOf for end tag', () => {
      const content = 'Before<!-- start -->Middle<!-- end -->Content<!-- end -->After'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('BeforeAfter')
    })
  })

  describe('getRawSummary', () => {
    test('should extract raw summary from summary string', () => {
      const summary = `Some text
${RAW_SUMMARY_START_TAG}
Raw summary content here
${RAW_SUMMARY_END_TAG}
More text`
      const result = commenter.getRawSummary(summary)
      
      expect(result).toContain('Raw summary content here')
    })

    test('should return empty string if tags not found', () => {
      const summary = 'No raw summary tags here'
      const result = commenter.getRawSummary(summary)
      
      expect(result).toBe('')
    })
  })

  describe('getShortSummary', () => {
    test('should extract short summary from summary string', () => {
      const summary = `Some text
${SHORT_SUMMARY_START_TAG}
Short summary content
${SHORT_SUMMARY_END_TAG}
More text`
      const result = commenter.getShortSummary(summary)
      
      expect(result).toContain('Short summary content')
    })

    test('should return empty string if tags not found', () => {
      const summary = 'No short summary tags here'
      const result = commenter.getShortSummary(summary)
      
      expect(result).toBe('')
    })
  })

  describe('getDescription', () => {
    test('should remove description tags and keep rest', () => {
      const description = `Main description
${DESCRIPTION_START_TAG}
Release notes content
${DESCRIPTION_END_TAG}
More content`
      const result = commenter.getDescription(description)
      
      expect(result).toContain('Main description')
      expect(result).toContain('More content')
      expect(result).not.toContain('Release notes content')
    })

    test('should return original if no tags', () => {
      const description = 'Plain description without tags'
      const result = commenter.getDescription(description)
      
      expect(result).toBe(description)
    })
  })

  describe('getReleaseNotes', () => {
    test('should extract release notes and remove quote markers', () => {
      const description = `Main text
${DESCRIPTION_START_TAG}
Release notes here
> Quoted line
Normal line
${DESCRIPTION_END_TAG}
After`
      const result = commenter.getReleaseNotes(description)
      
      expect(result).toContain('Release notes here')
      expect(result).toContain('Normal line')
      expect(result).not.toContain('> Quoted line')
    })

    test('should return empty string if no tags', () => {
      const description = 'No release notes tags'
      const result = commenter.getReleaseNotes(description)
      
      expect(result).toBe('')
    })

    test('should remove quote markers at line start', () => {
      const description = `${DESCRIPTION_START_TAG}
> Line 1
> Line 2
Line 3
${DESCRIPTION_END_TAG}`
      const result = commenter.getReleaseNotes(description)
      
      expect(result).not.toContain('> Line 1')
      expect(result).not.toContain('> Line 2')
      expect(result).toContain('Line 3')
    })
  })

  describe('getReviewedCommitIds', () => {
    test('should extract commit IDs from comment body', () => {
      const commentBody = `Some text
${COMMIT_ID_START_TAG}
<!-- abc123 -->
<!-- def456 -->
<!-- ghi789 -->
${COMMIT_ID_END_TAG}
More text`
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toHaveLength(3)
      expect(result).toContain('abc123')
      expect(result).toContain('def456')
      expect(result).toContain('ghi789')
    })

    test('should return empty array if no commit ID tags', () => {
      const commentBody = 'No commit ID markers here'
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toEqual([])
    })

    test('should return empty array if only start tag present', () => {
      const commentBody = `${COMMIT_ID_START_TAG}
<!-- abc123 -->`
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toEqual([])
    })

    test('should filter out empty strings', () => {
      const commentBody = `${COMMIT_ID_START_TAG}
<!-- abc123 -->
<!--  -->
<!-- def456 -->
<!---->
${COMMIT_ID_END_TAG}`
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toHaveLength(2)
      expect(result).toContain('abc123')
      expect(result).toContain('def456')
    })

    test('should trim whitespace from commit IDs', () => {
      const commentBody = `${COMMIT_ID_START_TAG}
<!--  abc123  -->
${COMMIT_ID_END_TAG}`
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toEqual(['abc123'])
    })
  })

  describe('getReviewedCommitIdsBlock', () => {
    test('should extract the entire commit IDs block including markers', () => {
      const commentBody = `Before
${COMMIT_ID_START_TAG}
<!-- abc123 -->
<!-- def456 -->
${COMMIT_ID_END_TAG}
After`
      const result = commenter.getReviewedCommitIdsBlock(commentBody)
      
      expect(result).toContain(COMMIT_ID_START_TAG)
      expect(result).toContain(COMMIT_ID_END_TAG)
      expect(result).toContain('<!-- abc123 -->')
      expect(result).toContain('<!-- def456 -->')
      expect(result).not.toContain('Before')
      expect(result).not.toContain('After')
    })

    test('should return empty string if markers not found', () => {
      const commentBody = 'No commit ID block here'
      const result = commenter.getReviewedCommitIdsBlock(commentBody)
      
      expect(result).toBe('')
    })
  })

  describe('addReviewedCommitId', () => {
    test('should add commit ID to existing block', () => {
      const commentBody = `Text
${COMMIT_ID_START_TAG}
<!-- abc123 -->
${COMMIT_ID_END_TAG}
More text`
      const result = commenter.addReviewedCommitId(commentBody, 'def456')
      
      expect(result).toContain('<!-- abc123 -->')
      expect(result).toContain('<!-- def456 -->')
    })

    test('should create new block if markers do not exist', () => {
      const commentBody = 'Original comment text'
      const result = commenter.addReviewedCommitId(commentBody, 'abc123')
      
      expect(result).toContain('Original comment text')
      expect(result).toContain(COMMIT_ID_START_TAG)
      expect(result).toContain('<!-- abc123 -->')
      expect(result).toContain(COMMIT_ID_END_TAG)
    })

    test('should maintain order of existing and new commit IDs', () => {
      const commentBody = `${COMMIT_ID_START_TAG}
<!-- first -->
<!-- second -->
${COMMIT_ID_END_TAG}`
      const result = commenter.addReviewedCommitId(commentBody, 'third')
      
      const firstIndex = result.indexOf('<!-- first -->')
      const secondIndex = result.indexOf('<!-- second -->')
      const thirdIndex = result.indexOf('<!-- third -->')
      
      expect(firstIndex).toBeLessThan(secondIndex)
      expect(secondIndex).toBeLessThan(thirdIndex)
    })
  })

  describe('getHighestReviewedCommitId', () => {
    test('should return highest reviewed commit from list', () => {
      const commitIds = ['aaa', 'bbb', 'ccc', 'ddd', 'eee']
      const reviewedIds = ['aaa', 'ccc']
      
      const result = commenter.getHighestReviewedCommitId(commitIds, reviewedIds)
      
      expect(result).toBe('ccc')
    })

    test('should return empty string if no commits reviewed', () => {
      const commitIds = ['aaa', 'bbb', 'ccc']
      const reviewedIds: string[] = []
      
      const result = commenter.getHighestReviewedCommitId(commitIds, reviewedIds)
      
      expect(result).toBe('')
    })

    test('should return last commit if all reviewed', () => {
      const commitIds = ['aaa', 'bbb', 'ccc']
      const reviewedIds = ['aaa', 'bbb', 'ccc']
      
      const result = commenter.getHighestReviewedCommitId(commitIds, reviewedIds)
      
      expect(result).toBe('ccc')
    })

    test('should work with single commit', () => {
      const commitIds = ['aaa']
      const reviewedIds = ['aaa']
      
      const result = commenter.getHighestReviewedCommitId(commitIds, reviewedIds)
      
      expect(result).toBe('aaa')
    })

    test('should handle non-sequential reviewed commits', () => {
      const commitIds = ['aaa', 'bbb', 'ccc', 'ddd', 'eee']
      const reviewedIds = ['aaa', 'ddd']
      
      const result = commenter.getHighestReviewedCommitId(commitIds, reviewedIds)
      
      expect(result).toBe('ddd')
    })
  })

  describe('addInProgressStatus', () => {
    test('should add in-progress status to comment body', () => {
      const commentBody = 'Original comment'
      const statusMsg = 'Reviewing changes...'
      
      const result = commenter.addInProgressStatus(commentBody, statusMsg)
      
      expect(result).toContain(IN_PROGRESS_START_TAG)
      expect(result).toContain(IN_PROGRESS_END_TAG)
      expect(result).toContain('Reviewing changes...')
      expect(result).toContain('Original comment')
    })

    test('should not add duplicate status if already present', () => {
      const commentBody = `${IN_PROGRESS_START_TAG}
Existing status
${IN_PROGRESS_END_TAG}
Original comment`
      const statusMsg = 'New status'
      
      const result = commenter.addInProgressStatus(commentBody, statusMsg)
      
      // Should not add another status block
      expect(result).toBe(commentBody)
    })

    test('should place status at beginning of comment', () => {
      const commentBody = 'Important content here'
      const statusMsg = 'Status message'
      
      const result = commenter.addInProgressStatus(commentBody, statusMsg)
      
      const statusIndex = result.indexOf(IN_PROGRESS_START_TAG)
      const contentIndex = result.indexOf('Important content here')
      
      expect(statusIndex).toBeLessThan(contentIndex)
    })
  })

  describe('removeInProgressStatus', () => {
    test('should remove in-progress status from comment body', () => {
      const commentBody = `${IN_PROGRESS_START_TAG}
Status message
${IN_PROGRESS_END_TAG}
Main content`
      
      const result = commenter.removeInProgressStatus(commentBody)
      
      expect(result).not.toContain(IN_PROGRESS_START_TAG)
      expect(result).not.toContain(IN_PROGRESS_END_TAG)
      expect(result).not.toContain('Status message')
      expect(result).toContain('Main content')
    })

    test('should return unchanged if no status present', () => {
      const commentBody = 'Just normal content'
      
      const result = commenter.removeInProgressStatus(commentBody)
      
      expect(result).toBe(commentBody)
    })

    test('should handle status at different positions', () => {
      const commentBody = `Content before
${IN_PROGRESS_START_TAG}
In progress
${IN_PROGRESS_END_TAG}
Content after`
      
      const result = commenter.removeInProgressStatus(commentBody)
      
      expect(result).toContain('Content before')
      expect(result).toContain('Content after')
      expect(result).not.toContain('In progress')
    })
  })

  describe('composeCommentChain', () => {
    test('should compose chain with top-level and replies', () => {
      const topLevelComment = {
        id: 1,
        user: { login: 'user1' },
        body: 'Top level comment',
        in_reply_to_id: null
      }
      
      const reviewComments = [
        topLevelComment,
        {
          id: 2,
          user: { login: 'user2' },
          body: 'Reply 1',
          in_reply_to_id: 1
        },
        {
          id: 3,
          user: { login: 'user3' },
          body: 'Reply 2',
          in_reply_to_id: 1
        }
      ]
      
      const result = commenter.composeCommentChain(reviewComments, topLevelComment)
      
      expect(result).toContain('user1: Top level comment')
      expect(result).toContain('user2: Reply 1')
      expect(result).toContain('user3: Reply 2')
      expect(result).toContain('---')
    })

    test('should handle single comment with no replies', () => {
      const topLevelComment = {
        id: 1,
        user: { login: 'user1' },
        body: 'Solo comment',
        in_reply_to_id: null
      }
      
      const result = commenter.composeCommentChain([topLevelComment], topLevelComment)
      
      expect(result).toBe('user1: Solo comment')
    })

    test('should maintain order of conversation', () => {
      const topLevel = {
        id: 1,
        user: { login: 'alice' },
        body: 'Question',
        in_reply_to_id: null
      }
      
      const reviewComments = [
        topLevel,
        {
          id: 2,
          user: { login: 'bob' },
          body: 'First reply',
          in_reply_to_id: 1
        },
        {
          id: 3,
          user: { login: 'charlie' },
          body: 'Second reply',
          in_reply_to_id: 1
        }
      ]
      
      const result = commenter.composeCommentChain(reviewComments, topLevel)
      
      const aliceIndex = result.indexOf('alice')
      const bobIndex = result.indexOf('bob')
      const charlieIndex = result.indexOf('charlie')
      
      expect(aliceIndex).toBeLessThan(bobIndex)
      expect(bobIndex).toBeLessThan(charlieIndex)
    })
  })
})