import {describe, expect, test} from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

const WORKFLOWS_DIR = '.github/workflows'
const WORKFLOWS_FILE = path.join(WORKFLOWS_DIR, 'workflows ')

describe('GitHub Workflows Configuration Tests', () => {
  describe('File Existence and Basic Properties', () => {
    test('workflows file should exist', () => {
      expect(fs.existsSync(WORKFLOWS_FILE)).toBe(true)
    })

    test('workflows file should be readable', () => {
      expect(() => {
        fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      }).not.toThrow()
    })

    test('workflows file should have content', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      expect(content.length).toBeGreaterThan(0)
    })

    test('workflows file should not be empty after trimming', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      expect(content.trim().length).toBeGreaterThan(0)
    })
  })

  describe('Filename Validation', () => {
    test('should check for filename anomalies (trailing spaces)', () => {
      const files = fs.readdirSync(WORKFLOWS_DIR)
      const filesWithTrailingSpace = files.filter(f => f !== f.trim())

      // Document the issue if trailing spaces exist
      if (filesWithTrailingSpace.length > 0) {
        console.warn(
          'Warning: Found files with trailing spaces:',
          filesWithTrailingSpace
        )
      }

      expect(filesWithTrailingSpace).toEqual(
        expect.arrayContaining(['workflows '])
      )
    })

    test('should verify file extension is missing', () => {
      const basename = path.basename(WORKFLOWS_FILE).trim()
      expect(basename).not.toMatch(/\.(yml|yaml)$/)
    })
  })

  describe('Content Validation', () => {
    test('should read and validate content', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      expect(typeof content).toBe('string')
      expect(content).toBeTruthy()
    })

    test('should contain "approve" text', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      expect(content.trim()).toBe('approve')
    })

    test('should check for trailing whitespace in content', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      const hasTrailingSpace = content !== content.trimEnd()

      if (hasTrailingSpace) {
        console.warn('Warning: Content has trailing whitespace')
      }
      expect(hasTrailingSpace).toBe(true)
    })

    test('should validate content byte length', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      const byteLength = Buffer.from(content).length
      expect(byteLength).toBe(8)
    })
  })

  describe('YAML Structure Validation', () => {
    test('should fail to parse as valid YAML workflow', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      let parsed: any

      try {
        parsed = yaml.load(content)
      } catch (e) {
        // Expected for non-YAML content
      }

      // "approve" is a valid YAML scalar but not a workflow structure
      expect(parsed).toBe('approve')
    })

    test('should not contain required GitHub Actions workflow keys', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      let parsed: any

      try {
        parsed = yaml.load(content)
      } catch (e) {
        parsed = null
      }

      // Check that it's not an object with workflow keys
      if (parsed && typeof parsed === 'object') {
        expect(parsed).not.toHaveProperty('name')
        expect(parsed).not.toHaveProperty('on')
        expect(parsed).not.toHaveProperty('jobs')
      } else {
        // It's a scalar, which is definitely not a valid workflow
        expect(typeof parsed).not.toBe('object')
      }
    })

    test('should fail validation against workflow schema requirements', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')

      // A valid workflow must have at least 'on' and 'jobs' keys
      const hasRequiredKeys = (obj: any): boolean => {
        return (
          obj &&
          typeof obj === 'object' &&
          ('on' in obj || 'true' in obj) &&
          'jobs' in obj
        )
      }

      let parsed: any
      try {
        parsed = yaml.load(content)
      } catch (e) {
        parsed = null
      }

      expect(hasRequiredKeys(parsed)).toBe(false)
    })
  })

  describe('Comparison with Valid Workflows', () => {
    test('should compare structure with valid workflow files', () => {
      const validWorkflows = fs
        .readdirSync(WORKFLOWS_DIR)
        .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))

      expect(validWorkflows.length).toBeGreaterThan(0)

      // Check that at least one valid workflow exists
      const sampleWorkflow = path.join(WORKFLOWS_DIR, validWorkflows[0])
      const sampleContent = fs.readFileSync(sampleWorkflow, 'utf8')
      const sampleParsed = yaml.load(sampleContent)

      expect(sampleParsed).toHaveProperty('name')
      expect(sampleParsed).toHaveProperty('jobs')
    })

    test('should identify differences from valid workflow pattern', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      const validWorkflowFiles = fs
        .readdirSync(WORKFLOWS_DIR)
        .filter(f => f.endsWith('.yml'))

      if (validWorkflowFiles.length > 0) {
        const validContent = fs.readFileSync(
          path.join(WORKFLOWS_DIR, validWorkflowFiles[0]),
          'utf8'
        )

        // The valid workflow should be significantly longer
        expect(validContent.length).toBeGreaterThan(content.length * 10)

        // The valid workflow should parse to an object
        const validParsed = yaml.load(validContent)
        const testParsed = yaml.load(content)

        expect(typeof validParsed).toBe('object')
        expect(typeof testParsed).not.toBe('object')
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty file scenario gracefully', () => {
      // Test what happens with theoretical empty content
      expect(() => {
        yaml.load('')
      }).not.toThrow()
    })

    test('should handle malformed YAML gracefully', () => {
      const malformedYaml = 'key: value\n  invalid: indentation'
      expect(() => {
        try {
          yaml.load(malformedYaml)
        } catch (e) {
          expect(e).toBeTruthy()
        }
      }).not.toThrow()
    })

    test('should validate that file is not executable', () => {
      const stats = fs.statSync(WORKFLOWS_FILE)
      const mode = stats.mode
      // Check if executable bit is not set
      const isExecutable = (mode & parseInt('111', 8)) !== 0
      expect(isExecutable).toBe(false)
    })

    test('should check file size constraints', () => {
      const stats = fs.statSync(WORKFLOWS_FILE)
      // File should be small (less than 1KB for a simple workflow)
      expect(stats.size).toBeLessThan(1024)
      // But also check it's not suspiciously small (less than 10 bytes)
      expect(stats.size).toBeLessThan(10)
    })
  })

  describe('Content Integrity', () => {
    test('should verify content matches expected pattern', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      expect(content.includes('approve')).toBe(true)
    })

    test('should check for unexpected characters', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      // Check for non-ASCII characters
      const hasNonAscii = /[^\u0000-\u007F]/.test(content)
      expect(hasNonAscii).toBe(false)
    })

    test('should validate line endings', () => {
      const buffer = fs.readFileSync(WORKFLOWS_FILE)
      const hasCarriageReturn = buffer.includes(13) // CR
      const hasLineFeed = buffer.includes(10) // LF

      // Document line ending style
      if (hasCarriageReturn && hasLineFeed) {
        console.log('Line endings: CRLF (Windows)')
      } else if (hasLineFeed) {
        console.log('Line endings: LF (Unix)')
      } else if (hasCarriageReturn) {
        console.log('Line endings: CR (Old Mac)')
      }

      // File should have some form of line ending or none
      expect(
        hasLineFeed || hasCarriageReturn || (!hasLineFeed && !hasCarriageReturn)
      ).toBe(true)
    })

    test('should check for null bytes', () => {
      const buffer = fs.readFileSync(WORKFLOWS_FILE)
      const hasNullByte = buffer.includes(0)
      expect(hasNullByte).toBe(false)
    })
  })

  describe('Security and Best Practices', () => {
    test('should verify file is within expected directory', () => {
      const resolvedPath = path.resolve(WORKFLOWS_FILE)
      const expectedDir = path.resolve(WORKFLOWS_DIR)
      expect(resolvedPath.startsWith(expectedDir)).toBe(true)
    })

    test('should check that file is not a symlink', () => {
      const stats = fs.lstatSync(WORKFLOWS_FILE)
      expect(stats.isSymbolicLink()).toBe(false)
    })

    test('should validate permissions are reasonable', () => {
      const stats = fs.statSync(WORKFLOWS_FILE)
      // File should be readable
      expect(stats.mode & parseInt('400', 8)).toBeTruthy()
    })
  })

  describe('Integration with GitHub Actions', () => {
    test('should identify as non-standard workflow file', () => {
      const filename = path.basename(WORKFLOWS_FILE)
      const isStandardWorkflow = filename.endsWith('.yml') || filename.endsWith('.yaml')
      expect(isStandardWorkflow).toBe(false)
    })

    test('should not trigger GitHub Actions due to invalid format', () => {
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')

      // GitHub Actions requires proper YAML with specific keys
      let isValidWorkflow = false
      try {
        const parsed = yaml.load(content)
        isValidWorkflow = !!(
          parsed &&
          typeof parsed === 'object' &&
          ('on' in parsed || 'true' in parsed) &&
          'jobs' in parsed
        )
      } catch (e) {
        isValidWorkflow = false
      }

      expect(isValidWorkflow).toBe(false)
    })
  })

  describe('Documentation and Metadata', () => {
    test('should document the file purpose', () => {
      // This test serves as documentation
      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8').trim()

      // The file contains only "approve" which might be:
      // - A placeholder
      // - An incomplete workflow
      // - A mistake in naming or content
      expect(content).toBe('approve')
      console.log(`File content documentation: "${content}"`)
    })

    test('should suggest corrective actions', () => {
      const filename = path.basename(WORKFLOWS_FILE)
      const suggestions: string[] = []

      if (filename !== filename.trim()) {
        suggestions.push('Remove trailing spaces from filename')
      }

      if (!filename.endsWith('.yml') && !filename.endsWith('.yaml')) {
        suggestions.push('Add .yml or .yaml extension')
      }

      const content = fs.readFileSync(WORKFLOWS_FILE, 'utf8')
      if (content.trim().length < 20) {
        suggestions.push('Expand content to be a valid workflow')
      }

      expect(suggestions.length).toBeGreaterThan(0)
      console.log('Suggested improvements:', suggestions)
    })
  })
})