import {describe, expect, test} from '@jest/globals'
import {encode, getTokenCount} from '../src/tokenizer'

describe('Tokenizer Module', () => {
  describe('encode function', () => {
    test('should encode simple string', () => {
      const result = encode('hello world')
      
      expect(result).toBeDefined()
      expect(result instanceof Uint32Array).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode empty string', () => {
      const result = encode('')
      
      expect(result).toBeDefined()
      expect(result instanceof Uint32Array).toBe(true)
      expect(result.length).toBe(0)
    })

    test('should encode string with special characters', () => {
      const result = encode('Hello, World! @#$%^&*()')
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode string with numbers', () => {
      const result = encode('123 456 789')
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode multiline string', () => {
      const result = encode('Line 1\nLine 2\nLine 3')
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode string with unicode characters', () => {
      const result = encode('Hello 世界 🌍')
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode code snippet', () => {
      const code = `
function hello() {
  console.log('Hello, World!');
}
`
      const result = encode(code)
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getTokenCount function', () => {
    test('should count tokens in simple string', () => {
      const count = getTokenCount('hello world')
      
      expect(count).toBeGreaterThan(0)
      expect(typeof count).toBe('number')
    })

    test('should return 0 for empty string', () => {
      const count = getTokenCount('')
      
      expect(count).toBe(0)
    })

    test('should count tokens in longer text', () => {
      const text = 'The quick brown fox jumps over the lazy dog'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
      // Common tokenizers usually break this into ~10-12 tokens
      expect(count).toBeGreaterThan(5)
      expect(count).toBeLessThan(20)
    })

    test('should count tokens in code', () => {
      const code = `
function add(a, b) {
  return a + b;
}
`
      const count = getTokenCount(code)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should remove endoftext marker before counting', () => {
      const textWithMarker = 'Hello<|endoftext|>World'
      const textWithoutMarker = 'HelloWorld'
      
      const countWith = getTokenCount(textWithMarker)
      const countWithout = getTokenCount(textWithoutMarker)
      
      // Should be equal since marker is removed
      expect(countWith).toBe(countWithout)
    })

    test('should handle multiple endoftext markers', () => {
      const text = 'Hello<|endoftext|>World<|endoftext|>Test'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
      expect(typeof count).toBe('number')
    })

    test('should count tokens in markdown', () => {
      const markdown = `
# Heading 1

## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\`
`
      const count = getTokenCount(markdown)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should count tokens in JSON', () => {
      const json = JSON.stringify({
        name: 'John Doe',
        age: 30,
        city: 'New York',
        hobbies: ['reading', 'coding', 'gaming']
      })
      const count = getTokenCount(json)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle very long strings', () => {
      const longText = 'a'.repeat(10000)
      const count = getTokenCount(longText)
      
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(20000) // Sanity check
    })

    test('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle unicode emoji', () => {
      const text = '😀 😃 😄 😁 🌍 🌎 🌏'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle mixed content', () => {
      const text = `
Title: Fix Bug #123

Description: This PR fixes the parsing issue in the tokenizer.

Changes:
- Updated parser.ts
- Added tests
- Fixed edge cases

Code example:
\`\`\`typescript
function tokenize(input: string): Token[] {
  return input.split(' ').map(word => ({
    type: 'word',
    value: word
  }));
}
\`\`\`

Closes #123
`
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Token count comparisons', () => {
    test('longer text should have more tokens', () => {
      const short = 'Hello'
      const long = 'Hello World this is a much longer sentence with many more words'
      
      const shortCount = getTokenCount(short)
      const longCount = getTokenCount(long)
      
      expect(longCount).toBeGreaterThan(shortCount)
    })

    test('should be consistent for same input', () => {
      const text = 'This is a test string'
      
      const count1 = getTokenCount(text)
      const count2 = getTokenCount(text)
      
      expect(count1).toBe(count2)
    })

    test('similar strings should have similar token counts', () => {
      const text1 = 'The quick brown fox'
      const text2 = 'The fast brown dog'
      
      const count1 = getTokenCount(text1)
      const count2 = getTokenCount(text2)
      
      // Should be close (within a token or two)
      expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(2)
    })
  })

  describe('Edge cases', () => {
    test('should handle whitespace-only strings', () => {
      const count = getTokenCount('   \n\n   \t\t   ')
      
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should handle strings with only newlines', () => {
      const count = getTokenCount('\n\n\n\n\n')
      
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should handle repeated words', () => {
      const text = 'test '.repeat(100)
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle mixed languages', () => {
      const text = 'Hello world 你好世界 Bonjour monde'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Real-world scenarios', () => {
    test('should count tokens in PR description', () => {
      const prDescription = `
## Description
This PR implements a new feature for token counting.

## Changes
- Added new tokenizer module
- Updated documentation
- Added comprehensive tests

## Testing
Tested with various input types including code, markdown, and special characters.
`
      const count = getTokenCount(prDescription)
      
      expect(count).toBeGreaterThan(0)
      expect(count).toBeGreaterThan(20)
    })

    test('should count tokens in code review comment', () => {
      const comment = `
This implementation looks good, but I have a few suggestions:

1. Consider adding error handling for edge cases
2. The variable naming could be more descriptive
3. Add JSDoc comments for public methods

Overall, good work! 👍
`
      const count = getTokenCount(comment)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should count tokens in diff output', () => {
      const diff = `
@@ -1,5 +1,7 @@
 function hello() {
-  console.log('Hello');
+  console.log('Hello, World!');
+  return true;
 }
`
      const count = getTokenCount(diff)
      
      expect(count).toBeGreaterThan(0)
    })
  })
})