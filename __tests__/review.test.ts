import {describe, expect, test} from '@jest/globals'
import { splitPatch, patchStartEndLine, parsePatch, parseReview } from '../src/review'

describe('review.ts helper functions', () => {
  test('splitPatch should split multiple hunks', () => {
    const multiPatch = [
      '@@ -1,2 +1,2 @@',
      ' lineA',
      '-lineB',
      '+lineB2',
      '@@ -10,1 +10,1 @@',
      '-old',
      '+new'
    ].join('\n')

    const hunks = splitPatch(multiPatch)
    expect(hunks.length).toBe(2)
    expect(hunks[0]).toContain('@@ -1,2 +1,2 @@')
    expect(hunks[1]).toContain('@@ -10,1 +10,1 @@')
  })

  test('patchStartEndLine should parse old/new hunk ranges', () => {
    const patch = [
      '@@ -12,7 +20,8 @@',
      ' line1',
      ' line2'
    ].join('\n')
    const res = patchStartEndLine(patch)
    expect(res).not.toBeNull()
    // old: 12..18
    expect(res!.oldHunk.startLine).toBe(12)
    expect(res!.oldHunk.endLine).toBe(18)
    // new: 20..27
    expect(res!.newHunk.startLine).toBe(20)
    expect(res!.newHunk.endLine).toBe(27)
  })

  test('parsePatch should generate old/new hunks with proper line numbering', () => {
    const patch = [
      '@@ -1,2 +1,2 @@',
      ' lineA',
      '-lineB',
      '+lineB2'
    ].join('\n')

    const res = parsePatch(patch)
    expect(res).not.toBeNull()

    // Old hunk should include removed and context lines without numbering
    expect(res!.oldHunk).toContain('lineB')
    expect(res!.oldHunk).toContain(' lineA')

    // New hunk: additions must be numbered; context lines near edges may be unnumbered
    expect(res!.newHunk).toContain(' lineA')
    expect(res!.newHunk).toMatch(/2:\s+lineB2/)
  })

  test('parseReview should parse multiple comments and sanitize code blocks', () => {
    const response = [
      '22-22:',
      "There's a syntax error.",
      '```diff',
      '- retrn z',
      '+ return z',
      '```',
      '---',
      '24-25:',
      'LGTM!',
      '---'
    ].join('\n')

    const patches: Array<[number, number, string]> = [[20, 30, 'dummy']]
    const reviews = parseReview(response, patches, false)

    expect(reviews.length).toBe(2)
    expect(reviews[0].startLine).toBe(22)
    expect(reviews[0].endLine).toBe(22)
    expect(reviews[0].comment).toContain('syntax error')
    expect(reviews[0].comment).toContain('```diff')

    // Ensure LGTM comment is captured as well
    expect(reviews[1].startLine).toBe(24)
    expect(reviews[1].endLine).toBe(25)
    expect(reviews[1].comment).toMatch(/LGTM/i)
  })

  test('parseReview should map out-of-patch ranges and strip line numbers inside suggestion blocks', () => {
    const response = [
      '10-10:',
      'Fix suggestion',
      '```suggestion',
      '10: return foo',
      '```',
      '---'
    ].join('\n')

    // Patch range does not include [10-10], so it should map to [50-60]
    const patches: Array<[number, number, string]> = [[50, 60, 'dummy']]
    const reviews = parseReview(response, patches, false)

    expect(reviews.length).toBe(1)
    expect(reviews[0].startLine).toBe(50)
    expect(reviews[0].endLine).toBe(60)
    // Note text should be added for out-of-patch mapping
    expect(reviews[0].comment).toMatch(/outside of the patch/i)
    // Ensure "10: " prefix is stripped inside suggestion code block
    expect(reviews[0].comment).not.toMatch(/^\s*10:\s/m)
    expect(reviews[0].comment).toContain('return foo')
  })
})