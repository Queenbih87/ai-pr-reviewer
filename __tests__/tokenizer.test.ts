// Mock @dqbd/tiktoken to avoid loading WASM in tests
jest.mock('@dqbd/tiktoken', () => ({
  get_encoding: () => ({
    // simple character-based tokenizer for tests
    encode: (s: string) => {
      const buf = Buffer.from(s, 'utf8')
      // Return a typed array with one element per byte (not real tokenization; sufficient for tests)
      const arr = Array.from({ length: buf.length }, () => 1)
      return Uint32Array.from(arr)
    }
  })
}))

import { getTokenCount, encode } from '../src/tokenizer'

describe('tokenizer (mocked)', () => {
  test('encode returns a Uint32Array', () => {
    const out = encode('hello')
    expect(out).toBeInstanceOf(Uint32Array)
    expect(out.length).toBeGreaterThan(0)
  })

  test('getTokenCount strips <|endoftext|> markers', () => {
    const base = 'hello world'
    const withMarker = 'hello <|endoftext|> world'
    const baseCount = getTokenCount(base)
    const markerCount = getTokenCount(withMarker)
    expect(markerCount).toBe(baseCount) // marker removed before counting
  })
})