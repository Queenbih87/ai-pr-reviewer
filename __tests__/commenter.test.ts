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

describe('Commenter constants', () => {
  test('should have correct tag values', () => {
    expect(COMMENT_TAG).toContain('auto-generated comment')
    expect(COMMENT_REPLY_TAG).toContain('auto-generated reply')
    expect(SUMMARIZE_TAG).toContain('summarize')
    expect(IN_PROGRESS_START_TAG).toContain('in progress')
    expect(DESCRIPTION_START_TAG).toContain('release notes')
    expect(RAW_SUMMARY_START_TAG).toContain('raw summary')
    expect(SHORT_SUMMARY_START_TAG).toContain('short summary')
  })

  test('tags should be unique', () => {
    const tags = [
      COMMENT_TAG,
      COMMENT_REPLY_TAG,
      SUMMARIZE_TAG,
      IN_PROGRESS_START_TAG,
      DESCRIPTION_START_TAG,
      RAW_SUMMARY_START_TAG,
      SHORT_SUMMARY_START_TAG
    ]
    
    const uniqueTags = new Set(tags)
    expect(uniqueTags.size).toBe(tags.length)
  })
})

describe('Commenter', () => {
  let commenter: Commenter

  beforeEach(() => {
    commenter = new Commenter()
  })

  describe('getContentWithinTags', () => {
    test('should extract content between tags', () => {
      const content = 'before <!-- start --> middle <!-- end --> after'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe(' middle ')
    })

    test('should return empty string when start tag not found', () => {
      const content = 'no tags here'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should return empty string when end tag not found', () => {
      const content = 'before <!-- start --> middle'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should handle adjacent tags', () => {
      const content = 'before <!-- start --><!-- end --> after'
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('')
    })

    test('should handle multiline content', () => {
      const content = `before
<!-- start -->
line1
line2
<!-- end -->
after`
      const result = commenter.getContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toContain('line1')
      expect(result).toContain('line2')
    })
  })

  describe('removeContentWithinTags', () => {
    test('should remove content between tags including tags', () => {
      const content = 'before <!-- start --> middle <!-- end --> after'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('before  after')
    })

    test('should return original content when tags not found', () => {
      const content = 'no tags here'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe(content)
    })

    test('should handle nested similar patterns', () => {
      const content = 'a <!-- start --> b <!-- start --> c <!-- end --> d'
      const result = commenter.removeContentWithinTags(content, '<!-- start -->', '<!-- end -->')
      
      expect(result).toBe('a  d')
    })

    test('should use lastIndexOf for end tag', () => {
      const content = 'start <!-- tag --> middle <!-- tag --> end'
      const result = commenter.removeContentWithinTags(content, '<!-- tag -->', '<!-- tag -->')
      
      // Should remove from first to last occurrence
      expect(result).toBe('start  end')
    })
  })

  describe('getRawSummary', () => {
    test('should extract raw summary from comment', () => {
      const summary = `Some text
${RAW_SUMMARY_START_TAG}
Raw summary content here
${RAW_SUMMARY_END_TAG}
More text`
      
      const result = commenter.getRawSummary(summary)
      expect(result).toContain('Raw summary content here')
    })

    test('should return empty string when tags not found', () => {
      const summary = 'No raw summary tags'
      const result = commenter.getRawSummary(summary)
      
      expect(result).toBe('')
    })
  })

  describe('getShortSummary', () => {
    test('should extract short summary from comment', () => {
      const summary = `Some text
${SHORT_SUMMARY_START_TAG}
Short summary content
${SHORT_SUMMARY_END_TAG}
More text`
      
      const result = commenter.getShortSummary(summary)
      expect(result).toContain('Short summary content')
    })

    test('should return empty string when tags not found', () => {
      const summary = 'No short summary tags'
      const result = commenter.getShortSummary(summary)
      
      expect(result).toBe('')
    })
  })

  describe('getDescription', () => {
    test('should remove release notes from description', () => {
      const description = `Regular description
${DESCRIPTION_START_TAG}
Release notes here
${DESCRIPTION_END_TAG}
More description`
      
      const result = commenter.getDescription(description)
      expect(result).not.toContain('Release notes here')
      expect(result).toContain('Regular description')
      expect(result).toContain('More description')
    })

    test('should return original if no release notes tags', () => {
      const description = 'Simple description'
      const result = commenter.getDescription(description)
      
      expect(result).toBe(description)
    })
  })

  describe('getReleaseNotes', () => {
    test('should extract release notes and remove quote markers', () => {
      const description = `${DESCRIPTION_START_TAG}
> Release note 1
> Release note 2
Regular content
${DESCRIPTION_END_TAG}`
      
      const result = commenter.getReleaseNotes(description)
      expect(result).toContain('Release note 1')
      expect(result).toContain('Regular content')
      expect(result).not.toContain('>')
    })

    test('should handle release notes without quotes', () => {
      const description = `${DESCRIPTION_START_TAG}
Regular release notes
${DESCRIPTION_END_TAG}`
      
      const result = commenter.getReleaseNotes(description)
      expect(result).toContain('Regular release notes')
    })
  })

  describe('getReviewedCommitIds', () => {
    test('should extract commit IDs from comment body', () => {
      const commentBody = `Some content
${COMMIT_ID_START_TAG}
<!-- abc123 -->
<!-- def456 -->
${COMMIT_ID_END_TAG}
More content`
      
      const result = commenter.getReviewedCommitIds(commentBody)
      expect(result).toEqual(['abc123', 'def456'])
    })

    test('should return empty array when no commit IDs', () => {
      const commentBody = 'No commit ID markers'
      const result = commenter.getReviewedCommitIds(commentBody)
      
      expect(result).toEqual([])
    })

    test('should filter out empty strings', () => {
      const commentBody = `${COMMIT_ID_START_TAG}
<!-- abc123 -->
<!--  -->
<!-- def456 -->
${COMMIT_ID_END_TAG}`
      
      const result = commenter.getReviewedCommitIds(commentBody)
      expect(result).toEqual(['abc123', 'def456'])
    })
  })

  describe('getReviewedCommitIdsBlock', () => {
    test('should extract entire commit IDs block with markers', () => {
      const commentBody = `Before
${COMMIT_ID_START_TAG}
<!-- abc123 -->
${COMMIT_ID_END_TAG}
After`
      
      const result = commenter.getReviewedCommitIdsBlock(commentBody)
      expect(result).toContain(COMMIT_ID_START_TAG)
      expect(result).toContain(COMMIT_ID_END_TAG)
      expect(result).toContain('abc123')
    })

    test('should return empty string when markers not found', () => {
      const commentBody = 'No commit ID block'
      const result = commenter.getReviewedCommitIdsBlock(commentBody)
      
      expect(result).toBe('')
    })
  })

  describe('addReviewedCommitId', () => {
    test('should add commit ID to existing block', () => {
      const commentBody = `Content
${COMMIT_ID_START_TAG}
<!-- abc123 -->
${COMMIT_ID_END_TAG}`
      
      const result = commenter.addReviewedCommitId(commentBody, 'def456')
      expect(result).toContain('<!-- abc123 -->')
      expect(result).toContain('<!-- def456 -->')
    })

    test('should create new block if markers do not exist', () => {
      const commentBody = 'Content without markers'
      
      const result = commenter.addReviewedCommitId(commentBody, 'abc123')
      expect(result).toContain(COMMIT_ID_START_TAG)
      expect(result).toContain(COMMIT_ID_END_TAG)
      expect(result).toContain('<!-- abc123 -->')
    })

    test('should preserve existing content', () => {
      const commentBody = 'Original content'
      
      const result = commenter.addReviewedCommitId(commentBody, 'abc123')
      expect(result).toContain('Original content')
    })
  })

  describe('getHighestReviewedCommitId', () => {
    test('should return highest (most recent) reviewed commit', () => {
      const allCommits = ['commit1', 'commit2', 'commit3', 'commit4']
      const reviewedCommits = ['commit1', 'commit3']
      
      const result = commenter.getHighestReviewedCommitId(allCommits, reviewedCommits)
      expect(result).toBe('commit3')
    })

    test('should return empty string when no commits reviewed', () => {
      const allCommits = ['commit1', 'commit2', 'commit3']
      const reviewedCommits: string[] = []
      
      const result = commenter.getHighestReviewedCommitId(allCommits, reviewedCommits)
      expect(result).toBe('')
    })

    test('should return latest commit if it was reviewed', () => {
      const allCommits = ['commit1', 'commit2', 'commit3']
      const reviewedCommits = ['commit1', 'commit2', 'commit3']
      
      const result = commenter.getHighestReviewedCommitId(allCommits, reviewedCommits)
      expect(result).toBe('commit3')
    })

    test('should handle partial review history', () => {
      const allCommits = ['a', 'b', 'c', 'd', 'e']
      const reviewedCommits = ['a', 'c']
      
      const result = commenter.getHighestReviewedCommitId(allCommits, reviewedCommits)
      expect(result).toBe('c')
    })
  })

  describe('addInProgressStatus', () => {
    test('should add in-progress status to comment', () => {
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
Already in progress
${IN_PROGRESS_END_TAG}
Original content`
      const statusMsg = 'New status'
      
      const result = commenter.addInProgressStatus(commentBody, statusMsg)
      expect(result).toBe(commentBody)
    })
  })

  describe('removeInProgressStatus', () => {
    test('should remove in-progress status from comment', () => {
      const commentBody = `${IN_PROGRESS_START_TAG}
In progress status
${IN_PROGRESS_END_TAG}
Remaining content`
      
      const result = commenter.removeInProgressStatus(commentBody)
      expect(result).not.toContain(IN_PROGRESS_START_TAG)
      expect(result).not.toContain(IN_PROGRESS_END_TAG)
      expect(result).toContain('Remaining content')
    })

    test('should return original if no in-progress status', () => {
      const commentBody = 'No in-progress markers'
      
      const result = commenter.removeInProgressStatus(commentBody)
      expect(result).toBe(commentBody)
    })

    test('should handle comments with status at beginning', () => {
      const commentBody = `${IN_PROGRESS_START_TAG}
Status
${IN_PROGRESS_END_TAG}Content`
      
      const result = commenter.removeInProgressStatus(commentBody)
      expect(result).toBe('Content')
    })
  })

  describe('composeCommentChain', () => {
    test('should compose comment chain with user and body', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'First comment', in_reply_to_id: null },
        { id: 2, user: { login: 'user2' }, body: 'Reply to first', in_reply_to_id: 1 }
      ]
      
      const result = commenter.composeCommentChain(reviewComments, reviewComments[0])
      expect(result).toContain('user1: First comment')
      expect(result).toContain('user2: Reply to first')
      expect(result).toContain('---')
    })

    test('should handle single comment with no replies', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'Standalone comment', in_reply_to_id: null }
      ]
      
      const result = commenter.composeCommentChain(reviewComments, reviewComments[0])
      expect(result).toBe('user1: Standalone comment')
    })

    test('should filter comments by reply relationship', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'First', in_reply_to_id: null },
        { id: 2, user: { login: 'user2' }, body: 'Reply to 1', in_reply_to_id: 1 },
        { id: 3, user: { login: 'user3' }, body: 'Different thread', in_reply_to_id: null }
      ]
      
      const result = commenter.composeCommentChain(reviewComments, reviewComments[0])
      expect(result).toContain('user1: First')
      expect(result).toContain('user2: Reply to 1')
      expect(result).not.toContain('user3: Different thread')
    })
  })

  describe('getTopLevelComment', () => {
    test('should find top level comment', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'Top', in_reply_to_id: null },
        { id: 2, user: { login: 'user2' }, body: 'Reply', in_reply_to_id: 1 }
      ]
      
      const result = commenter.getTopLevelComment(reviewComments, reviewComments[1])
      expect(result.id).toBe(1)
    })

    test('should return same comment if already top level', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'Top', in_reply_to_id: null }
      ]
      
      const result = commenter.getTopLevelComment(reviewComments, reviewComments[0])
      expect(result.id).toBe(1)
    })

    test('should traverse multiple levels', () => {
      const reviewComments = [
        { id: 1, user: { login: 'user1' }, body: 'Top', in_reply_to_id: null },
        { id: 2, user: { login: 'user2' }, body: 'Level 1', in_reply_to_id: 1 },
        { id: 3, user: { login: 'user3' }, body: 'Level 2', in_reply_to_id: 2 }
      ]
      
      const result = commenter.getTopLevelComment(reviewComments, reviewComments[2])
      expect(result.id).toBe(1)
    })
  })

  describe('edge cases', () => {
    test('should handle empty strings in content methods', () => {
      expect(commenter.getContentWithinTags('', 'start', 'end')).toBe('')
      expect(commenter.removeContentWithinTags('', 'start', 'end')).toBe('')
      expect(commenter.getRawSummary('')).toBe('')
    })

    test('should handle very long content', () => {
      const longContent = 'x'.repeat(10000)
      const tagged = `${RAW_SUMMARY_START_TAG}${longContent}${RAW_SUMMARY_END_TAG}`
      
      const result = commenter.getRawSummary(tagged)
      expect(result).toBe(longContent)
    })

    test('should handle special characters in tags', () => {
      const content = 'before <!-- <script> --> middle <!-- </script> --> after'
      const result = commenter.getContentWithinTags(content, '<!-- <script> -->', '<!-- </script> -->')
      
      expect(result).toBe(' middle ')
    })
  })
})