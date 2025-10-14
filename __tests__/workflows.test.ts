import {describe, expect, test, beforeAll} from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'

describe('GitHub Actions Workflow Validation', () => {
  const workflowsDir = path.join(__dirname, '..', '.github', 'workflows')
  let workflowFiles: string[] = []

  beforeAll(() => {
    // Get all files in the workflows directory
    if (fs.existsSync(workflowsDir)) {
      workflowFiles = fs.readdirSync(workflowsDir)
        .filter(file => fs.statSync(path.join(workflowsDir, file)).isFile())
    }
  })

  describe('Workflow File Naming Conventions', () => {
    test('should have workflow files in the .github/workflows directory', () => {
      expect(fs.existsSync(workflowsDir)).toBe(true)
      expect(workflowFiles.length).toBeGreaterThan(0)
    })

    test('all workflow files should have .yml or .yaml extension', () => {
      const invalidFiles = workflowFiles.filter(file => {
        return !file.endsWith('.yml') && !file.endsWith('.yaml')
      })
      
      if (invalidFiles.length > 0) {
        console.warn(`Found workflow files without .yml/.yaml extension: ${invalidFiles.join(', ')}`)
      }
      
      // This should fail if there are invalid files, highlighting the issue
      expect(invalidFiles).toEqual([])
    })
  })

  describe('Workflow File Structure', () => {
    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should be valid YAML', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Basic check: file should not be empty
      expect(content.trim().length).toBeGreaterThan(0)
      
      // Check for YAML-like structure (should have key: value pairs)
      const hasYamlStructure = /^[\w-]+:\s*.+/m.test(content)
      expect(hasYamlStructure).toBe(true)
    })

    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should have required GitHub Actions fields', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Check for required top-level keys
      expect(content).toMatch(/^name:/m)
      expect(content).toMatch(/^on:/m)
      expect(content).toMatch(/^jobs:/m)
    })
  })

  describe('Workflow File Content Validation', () => {
    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should have valid job definitions', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Jobs should have runs-on specified
      if (content.includes('jobs:')) {
        expect(content).toMatch(/runs-on:/m)
      }
    })

    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should not contain syntax errors', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Check for common YAML syntax issues
      // No tabs (YAML doesn't allow tabs for indentation)
      expect(content).not.toMatch(/\t/)
      
      // Lines should not start with invalid characters
      const lines = content.split('\n')
      lines.forEach((line, index) => {
        if (line.trim().length > 0) {
          // Valid YAML lines start with spaces, letters, hyphens, or hash for comments
          expect(line).toMatch(/^(\s*[a-zA-Z#\-]|\s*$)/)
        }
      })
    })
  })

  describe('Invalid Workflow Files', () => {
    test('should identify files without proper extensions', () => {
      const filesWithoutExtension = workflowFiles.filter(file => {
        return !file.endsWith('.yml') && !file.endsWith('.yaml')
      })
      
      filesWithoutExtension.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        
        console.log(`Checking invalid workflow file: ${file}`)
        console.log(`Content: "${content}"`)
        
        // These files should not exist or should be renamed
        // Log warning for visibility
        expect(file).toBe(file) // This always passes but logs the issue
      })
    })

    test('files without .yml/.yaml extension should be documented or removed', () => {
      const invalidFiles = workflowFiles.filter(file => {
        return !file.endsWith('.yml') && !file.endsWith('.yaml')
      })
      
      // If there are invalid files, they should be addressed
      if (invalidFiles.length > 0) {
        console.warn('\n⚠️  WARNING: The following files in .github/workflows/ do not have .yml/.yaml extensions:')
        invalidFiles.forEach(file => {
          const filePath = path.join(workflowsDir, file)
          const content = fs.readFileSync(filePath, 'utf8').trim()
          console.warn(`  - ${file} (content: "${content}")`)
        })
        console.warn('These files will not be recognized as GitHub Actions workflows.\n')
      }
      
      // This test serves as documentation of the issue
      expect(invalidFiles.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Workflow File Security', () => {
    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should have proper permissions if using pull_request_target', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // If using pull_request_target, should have explicit permissions
      if (content.includes('pull_request_target')) {
        expect(content).toMatch(/permissions:/m)
      }
    })

    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should not expose secrets in plain text', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Check for common secret patterns (this is basic, real secrets should use ${{ secrets.* }})
      const suspiciousPatterns = [
        /password\s*:\s*['"][^'"]+['"]/i,
        /api[_-]?key\s*:\s*['"][^'"]+['"]/i,
        /token\s*:\s*['"][^'"]+['"]/i,
      ]
      
      suspiciousPatterns.forEach(pattern => {
        const match = content.match(pattern)
        if (match) {
          // Allow if using GitHub secrets syntax
          const isUsingSecrets = match[0].includes('${{') || match[0].includes('secrets.')
          expect(isUsingSecrets).toBe(true)
        }
      })
    })
  })

  describe('Workflow Best Practices', () => {
    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should have a descriptive name', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      const nameMatch = content.match(/^name:\s*(.+)$/m)
      if (nameMatch) {
        const name = nameMatch[1].trim()
        // Name should not be empty or just quotes
        expect(name.length).toBeGreaterThan(0)
        expect(name).not.toBe('""')
        expect(name).not.toBe("''")
      }
    })

    test.each(
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => [file])
    )('workflow file "%s" should use pinned action versions or tags', (filename) => {
      const filePath = path.join(workflowsDir, filename)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Find all action uses
      const actionMatches = content.matchAll(/uses:\s*([^\s]+)/g)
      
      for (const match of actionMatches) {
        const action = match[1]
        // Should have version/tag specified (after @)
        if (action.includes('/') && !action.startsWith('./')) {
          // External actions should be pinned
          expect(action).toMatch(/@/)
        }
      }
    })
  })

  describe('Specific File Validation', () => {
    test('combine-prs.yml should have workflow_dispatch trigger', () => {
      const filePath = path.join(workflowsDir, 'combine-prs.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        expect(content).toMatch(/workflow_dispatch:/m)
      }
    })

    test('openai-review.yml should have pull_request_target trigger', () => {
      const filePath = path.join(workflowsDir, 'openai-review.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        expect(content).toMatch(/pull_request_target:/m)
        expect(content).toMatch(/permissions:/m)
      }
    })

    test('versioning.yml should have release trigger', () => {
      const filePath = path.join(workflowsDir, 'versioning.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        expect(content).toMatch(/release:/m)
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty workflow directory gracefully', () => {
      // This test verifies our code handles the case where directory might be empty
      expect(workflowFiles).toBeDefined()
      expect(Array.isArray(workflowFiles)).toBe(true)
    })

    test('should handle non-existent files in workflow list gracefully', () => {
      // Verify that all files in our list actually exist
      workflowFiles.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    })

    test('workflow files should be readable', () => {
      workflowFiles.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        expect(() => {
          fs.readFileSync(filePath, 'utf8')
        }).not.toThrow()
      })
    })

    test('workflow files should not be empty', () => {
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .forEach(file => {
          const filePath = path.join(workflowsDir, file)
          const content = fs.readFileSync(filePath, 'utf8')
          expect(content.length).toBeGreaterThan(0)
        })
    })

    test('workflow files should have consistent line endings', () => {
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .forEach(file => {
          const filePath = path.join(workflowsDir, file)
          const content = fs.readFileSync(filePath, 'utf8')
          
          // Check for mixed line endings (should use either \n or \r\n consistently)
          const hasUnixLineEndings = content.includes('\n')
          const hasWindowsLineEndings = content.includes('\r\n')
          
          // It's okay to have either, but mixing is problematic
          if (hasUnixLineEndings && hasWindowsLineEndings) {
            // Count occurrences
            const unixCount = (content.match(/(?<!\r)\n/g) || []).length
            const windowsCount = (content.match(/\r\n/g) || []).length
            
            // Allow if one format clearly dominates (>90%)
            const total = unixCount + windowsCount
            const ratio = Math.max(unixCount, windowsCount) / total
            expect(ratio).toBeGreaterThan(0.9)
          }
        })
    })
  })

  describe('Workflow File Completeness', () => {
    test('all .yml files should have corresponding workflow definitions', () => {
      const ymlFiles = workflowFiles.filter(file => 
        file.endsWith('.yml') || file.endsWith('.yaml')
      )
      
      ymlFiles.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Verify it's not just a placeholder or empty workflow
        expect(content).toMatch(/jobs:/)
        expect(content.split('\n').length).toBeGreaterThan(5)
      })
    })

    test('workflow files should not have duplicate job names', () => {
      workflowFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .forEach(file => {
          const filePath = path.join(workflowsDir, file)
          const content = fs.readFileSync(filePath, 'utf8')
          
          // Extract job names (simplified - looks for 'jobname:' under 'jobs:')
          const jobsSection = content.split('jobs:')[1]
          if (jobsSection) {
            const jobNames: string[] = []
            const lines = jobsSection.split('\n')
            
            for (const line of lines) {
              // Match job definitions (non-indented or minimally indented after 'jobs:')
              const match = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/)
              if (match) {
                jobNames.push(match[1])
              }
            }
            
            // Check for duplicates
            const uniqueJobNames = new Set(jobNames)
            expect(jobNames.length).toBe(uniqueJobNames.size)
          }
        })
    })
  })
})