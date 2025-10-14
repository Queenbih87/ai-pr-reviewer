import {describe, expect, test} from '@jest/globals'
import {encode, getTokenCount} from '../src/tokenizer'

describe('tokenizer', () => {
  describe('encode', () => {
    test('should encode simple text', () => {
      const result = encode('hello world')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode empty string', () => {
      const result = encode('')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBe(0)
    })

    test('should encode unicode characters', () => {
      const result = encode('Hello 世界 🌍')
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should encode code snippets', () => {
      const code = `function hello() {
  return "world";
}`
      const result = encode(code)
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(5)
    })

    test('should encode special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const result = encode(text)
      
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBeGreaterThan(0)
    })

    test('should produce consistent results for same input', () => {
      const text = 'consistent encoding test'
      const result1 = encode(text)
      const result2 = encode(text)
      
      expect(result1.length).toBe(result2.length)
      expect(Array.from(result1)).toEqual(Array.from(result2))
    })

    test('should produce different results for different inputs', () => {
      const result1 = encode('first text')
      const result2 = encode('second text')
      
      expect(Array.from(result1)).not.toEqual(Array.from(result2))
    })
  })

  describe('getTokenCount', () => {
    test('should count tokens in simple text', () => {
      const count = getTokenCount('hello world')
      
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(10)
    })

    test('should return 0 for empty string', () => {
      const count = getTokenCount('')
      
      expect(count).toBe(0)
    })

    test('should count tokens in longer text', () => {
      const text = 'This is a longer piece of text that should have more tokens than a short sentence.'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(10)
      expect(count).toBeLessThan(50)
    })

    test('should handle text with endoftext marker', () => {
      const text = 'Before marker <|endoftext|> after marker'
      const count = getTokenCount(text)
      
      // The marker should be removed before counting
      expect(count).toBeGreaterThan(0)
    })

    test('should remove multiple endoftext markers', () => {
      const text = 'Text <|endoftext|> more text <|endoftext|> even more'
      const count = getTokenCount(text)
      
      const withoutMarkers = getTokenCount('Text  more text  even more')
      // Counts should be similar (within a small margin due to spacing)
      expect(Math.abs(count - withoutMarkers)).toBeLessThan(3)
    })

    test('should count tokens in code', () => {
      const code = `function calculateSum(a, b) {
  return a + b;
}`
      const count = getTokenCount(code)
      
      expect(count).toBeGreaterThan(5)
      expect(count).toBeLessThan(30)
    })

    test('should count tokens in markdown', () => {
      const markdown = `# Heading

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
`
      const count = getTokenCount(markdown)
      
      expect(count).toBeGreaterThan(10)
    })

    test('should handle very long text', () => {
      const longText = 'word '.repeat(1000)
      const count = getTokenCount(longText)
      
      expect(count).toBeGreaterThan(500)
      expect(count).toBeLessThan(2000)
    })

    test('should count unicode characters', () => {
      const text = '你好世界 Hello World'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should count emojis', () => {
      const text = '🚀 🌍 🎉 Emojis are fun!'
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(0)
    })

    test('should be consistent for same input', () => {
      const text = 'consistency test'
      const count1 = getTokenCount(text)
      const count2 = getTokenCount(text)
      
      expect(count1).toBe(count2)
    })
  })

  describe('token count accuracy', () => {
    test('single word should have fewer tokens than sentence', () => {
      const wordCount = getTokenCount('hello')
      const sentenceCount = getTokenCount('hello world this is a sentence')
      
      expect(sentenceCount).toBeGreaterThan(wordCount)
    })

    test('shorter text should have fewer tokens than longer text', () => {
      const shortText = 'Short text'
      const longText = 'This is a much longer piece of text with many more words and tokens'
      
      const shortCount = getTokenCount(shortText)
      const longCount = getTokenCount(longText)
      
      expect(longCount).toBeGreaterThan(shortCount * 2)
    })

    test('repeated text should scale linearly', () => {
      const text = 'test '
      const count1 = getTokenCount(text)
      const count10 = getTokenCount(text.repeat(10))
      
      // Should be approximately 10x (allowing for small variance)
      expect(count10).toBeGreaterThan(count1 * 8)
      expect(count10).toBeLessThan(count1 * 12)
    })
  })

  describe('realistic code examples', () => {
    test('should count tokens in TypeScript class', () => {
      const code = `export class Example {
  private value: string;
  
  constructor(value: string) {
    this.value = value;
  }
  
  getValue(): string {
    return this.value;
  }
}`
      const count = getTokenCount(code)
      
      expect(count).toBeGreaterThan(20)
      expect(count).toBeLessThan(100)
    })

    test('should count tokens in diff output', () => {
      const diff = `@@ -1,5 +1,5 @@
 function hello() {
-  return "old";
+  return "new";
 }
`
      const count = getTokenCount(diff)
      
      expect(count).toBeGreaterThan(10)
    })

    test('should count tokens in JSON', () => {
      const json = JSON.stringify({
        name: 'test',
        version: '1.0.0',
        description: 'A test package',
        dependencies: {
          package1: '^1.0.0',
          package2: '^2.0.0'
        }
      }, null, 2)
      
      const count = getTokenCount(json)
      
      expect(count).toBeGreaterThan(20)
    })

    test('should count tokens in PR description', () => {
      const description = `## Changes

This PR includes the following changes:

- Feature A: Implements new functionality
- Feature B: Improves performance
- Bug fix: Resolves issue #123

## Testing

All tests pass locally.
`
      const count = getTokenCount(description)
      
      expect(count).toBeGreaterThan(30)
      expect(count).toBeLessThan(100)
    })
  })

  describe('edge cases', () => {
    test('should handle null-like inputs gracefully', () => {
      // getTokenCount expects string, but testing runtime behavior
      const count = getTokenCount('')
      expect(count).toBe(0)
    })

    test('should handle whitespace-only text', () => {
      const count = getTokenCount('   \n   \t   ')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should handle text with many newlines', () => {
      const text = 'line1\n\n\n\nline2\n\n\n\nline3'
      const count = getTokenCount(text)
      expect(count).toBeGreaterThan(0)
    })

    test('should handle text with special unicode spaces', () => {
      const text = 'word\u00A0word\u2003word' // non-breaking space and em space
      const count = getTokenCount(text)
      expect(count).toBeGreaterThan(0)
    })

    test('should handle mixed content types', () => {
      const mixed = `
        # Heading
        
        Some text
        
        \`\`\`javascript
        const x = 1;
        \`\`\`
        
        More text with **markdown** and 🚀 emojis
      `
      const count = getTokenCount(mixed)
      expect(count).toBeGreaterThan(10)
    })
  })

  describe('performance characteristics', () => {
    test('should handle moderately large text efficiently', () => {
      const largeText = 'This is a sentence. '.repeat(100)
      
      const start = Date.now()
      const count = getTokenCount(largeText)
      const duration = Date.now() - start
      
      expect(count).toBeGreaterThan(100)
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    test('should handle text with many tokens', () => {
      const text = 'word '.repeat(500)
      const count = getTokenCount(text)
      
      expect(count).toBeGreaterThan(400)
      expect(count).toBeLessThan(700)
    })
  })

  describe('comparison tests', () => {
    test('should show that longer words generally have more tokens', () => {
      const shortWord = getTokenCount('a')
      const mediumWord = getTokenCount('hello')
      const longWord = getTokenCount('incomprehensibility')
      
      expect(mediumWord).toBeGreaterThanOrEqual(shortWord)
      expect(longWord).toBeGreaterThan(shortWord)
    })

    test('should show token count relationships', () => {
      const text1 = 'Hello'
      const text2 = 'Hello world'
      const text3 = 'Hello world, how are you?'
      
      const count1 = getTokenCount(text1)
      const count2 = getTokenCount(text2)
      const count3 = getTokenCount(text3)
      
      expect(count2).toBeGreaterThan(count1)
      expect(count3).toBeGreaterThan(count2)
    })
  })
})