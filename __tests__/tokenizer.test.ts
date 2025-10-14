import {describe, expect, test} from '@jest/globals'
import {encode, getTokenCount} from '../src/tokenizer'

describe('Tokenizer Module', () => {
  describe('encode function', () => {
    test('should encode simple string', () => {
      const result = encode('hello')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode empty string', () => {
      const result = encode('')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBe(0)
    })

    test('should encode single character', () => {
      const result = encode('a')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode sentence with spaces', () => {
      const result = encode('hello world test')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode special characters', () => {
      const result = encode('!@#$%^&*()')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode newlines', () => {
      const result = encode('line1\nline2\nline3')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode unicode characters', () => {
      const result = encode('Hello 世界 🌍')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode code snippet', () => {
      const code = 'function test() { return true; }'
      const result = encode(code)
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should produce different encodings for different strings', () => {
      const result1 = encode('hello')
      const result2 = encode('world')
      
      expect(result1).not.toEqual(result2)
    })

    test('should produce same encoding for same string', () => {
      const result1 = encode('test')
      const result2 = encode('test')
      
      expect(result1).toEqual(result2)
    })
  })

  describe('getTokenCount function', () => {
    test('should count tokens in simple string', () => {
      const count = getTokenCount('hello world')
      
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThan(0)
    })

    test('should return 0 for empty string', () => {
      const count = getTokenCount('')
      
      expect(count).toBe(0)
    })

    test('should count tokens in single word', () => {
      const count = getTokenCount('hello')
      
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(5)
    })

    test('should count more tokens for longer text', () => {
      const short = getTokenCount('hi')
      const long = getTokenCount('This is a much longer sentence with many more words')
      
      expect(long).toBeGreaterThan(short)
    })

    test('should remove endoftext markers before counting', () => {
      const withMarker = getTokenCount('hello<|endoftext|>world')
      const without = getTokenCount('helloworld')
      
      // Should be similar since marker is removed
      expect(Math.abs(withMarker - without)).toBeLessThanOrEqual(1)
    })

    test('should handle multiple endoftext markers', () => {
      const text = '<|endoftext|>hello<|endoftext|>world<|endoftext|>'
      const count = getTokenCount(text)
      
      // Should only count tokens from hello and world
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(10)
    })

    test('should count tokens in code', () => {
      const code = `function test() {
  return true;
}`
      const count = getTokenCount(code)
      
      expect(count).toBeGreaterThan(5)
    })

    test('should handle unicode text', () => {
      const count = getTokenCount('Hello 世界')
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle emojis', () => {
      const count = getTokenCount('Hello 🌍 🚀 ✨')
      
      expect(count).toBeGreaterThan(0)
    })

    test('should count tokens consistently', () => {
      const text = 'consistent tokenization test'
      const count1 = getTokenCount(text)
      const count2 = getTokenCount(text)
      
      expect(count1).toBe(count2)
    })
  })

  describe('Token Count Patterns', () => {
    test('should count roughly one token per word for English', () => {
      const words = 'one two three four five'
      const count = getTokenCount(words)
      
      // English text typically has ~0.75 tokens per word
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count).toBeLessThanOrEqual(10)
    })

    test('should handle punctuation', () => {
      const withPunctuation = getTokenCount('Hello, world!')
      const withoutPunctuation = getTokenCount('Hello world')
      
      // Punctuation may add tokens
      expect(withPunctuation).toBeGreaterThanOrEqual(withoutPunctuation)
    })

    test('should handle numbers', () => {
      const count = getTokenCount('123 456 789')
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle mixed content', () => {
      const mixed = 'Code: const x = 123; // comment'
      const count = getTokenCount(mixed)
      
      expect(count).toBeGreaterThan(5)
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long string', () => {
      const longText = 'word '.repeat(1000)
      const count = getTokenCount(longText)
      
      expect(count).toBeGreaterThan(500)
    })

    test('should handle string with only whitespace', () => {
      const count = getTokenCount('     \n\n\t\t  ')
      
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should handle string with special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const count = getTokenCount(special)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle markdown', () => {
      const markdown = '# Heading\n\n**bold** and *italic*\n\n```code```'
      const count = getTokenCount(markdown)
      
      expect(count).toBeGreaterThan(5)
    })

    test('should handle JSON', () => {
      const json = '{"key": "value", "number": 123}'
      const count = getTokenCount(json)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle URL', () => {
      const url = 'https://github.com/user/repo'
      const count = getTokenCount(url)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle HTML', () => {
      const html = '<div class="test">Content</div>'
      const count = getTokenCount(html)
      
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Endoftext Marker Handling', () => {
    test('should strip endoftext at beginning', () => {
      const text = '<|endoftext|>hello'
      const count = getTokenCount(text)
      const countWithout = getTokenCount('hello')
      
      expect(Math.abs(count - countWithout)).toBeLessThanOrEqual(1)
    })

    test('should strip endoftext at end', () => {
      const text = 'hello<|endoftext|>'
      const count = getTokenCount(text)
      const countWithout = getTokenCount('hello')
      
      expect(Math.abs(count - countWithout)).toBeLessThanOrEqual(1)
    })

    test('should strip endoftext in middle', () => {
      const text = 'hello<|endoftext|>world'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should handle only endoftext marker', () => {
      const count = getTokenCount('<|endoftext|>')
      
      expect(count).toBe(0)
    })

    test('should handle multiple consecutive markers', () => {
      const text = 'text<|endoftext|><|endoftext|><|endoftext|>more'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    test('should handle many calls efficiently', () => {
      const start = Date.now()
      
      for (let i = 0; i < 100; i++) {
        getTokenCount('test text for performance')
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)
    })

    test('should encode large text efficiently', () => {
      const largeText = 'word '.repeat(10000)
      
      const start = Date.now()
      const count = getTokenCount(largeText)
      const duration = Date.now() - start
      
      expect(count).toBeGreaterThan(5000)
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Relationship between encode and getTokenCount', () => {
    test('getTokenCount should equal encode length for simple text', () => {
      const text = 'hello world'
      const encoded = encode(text)
      const count = getTokenCount(text)
      
      expect(count).toBe(encoded.length)
    })

    test('getTokenCount should handle endoftext but encode does not', () => {
      const text = 'hello<|endoftext|>world'
      const textWithout = 'helloworld'
      
      const countWith = getTokenCount(text)
      const countWithout = getTokenCount(textWithout)
      
      // After removal, should be similar
      expect(Math.abs(countWith - countWithout)).toBeLessThanOrEqual(1)
    })

    test('both should handle empty string consistently', () => {
      const encoded = encode('')
      const count = getTokenCount('')
      
      expect(encoded.length).toBe(0)
      expect(count).toBe(0)
    })

    test('both should handle unicode consistently', () => {
      const text = '测试'
      const encoded = encode(text)
      const count = getTokenCount(text)
      
      expect(count).toBe(encoded.length)
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Type Safety', () => {
    test('encode should always return Uint32Array', () => {
      const inputs = ['hello', '', '123', '!@#']
      
      inputs.forEach(input => {
        const result = encode(input)
        expect(result).toBeInstanceOf(Uint32Array)
      })
    })

    test('getTokenCount should always return number', () => {
      const inputs = ['hello', '', '123', '!@#']
      
      inputs.forEach(input => {
        const result = getTokenCount(input)
        expect(typeof result).toBe('number')
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Real-World Scenarios', () => {
    test('should count tokens in typical PR title', () => {
      const title = 'Fix: Update validation logic for user input'
      const count = getTokenCount(title)
      
      expect(count).toBeGreaterThan(5)
      expect(count).toBeLessThan(20)
    })

    test('should count tokens in typical PR description', () => {
      const description = `This PR fixes a bug in the validation logic.
      
Changes:
- Updated validator function
- Added unit tests
- Updated documentation`
      const count = getTokenCount(description)
      
      expect(count).toBeGreaterThan(15)
    })

    test('should count tokens in code diff', () => {
      const diff = `+  if (isValid(input)) {
+    return process(input);
+  }
-  return process(input);`
      const count = getTokenCount(diff)
      
      expect(count).toBeGreaterThan(10)
    })

    test('should count tokens in comment chain', () => {
      const chain = `user1: LGTM!
user2: Please add tests
user1: Tests added`
      const count = getTokenCount(chain)
      
      expect(count).toBeGreaterThan(8)
    })
  })
})