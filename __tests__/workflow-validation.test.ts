import {describe, expect, test} from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

describe('GitHub Workflow Files Validation', () => {
  const workflowsDir = path.join(__dirname, '..', '.github', 'workflows')

  /**
   * Get all files in the workflows directory
   */
  function getWorkflowFiles(): string[] {
    if (!fs.existsSync(workflowsDir)) {
      return []
    }
    return fs.readdirSync(workflowsDir).map(file => path.join(workflowsDir, file))
  }

  /**
   * Validate that a file is valid YAML
   */
  function isValidYaml(content: string): boolean {
    try {
      yaml.load(content)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if workflow has required GitHub Actions fields
   */
  function hasRequiredWorkflowFields(workflowObj: any): {
    valid: boolean
    missing: string[]
  } {
    const required = ['name', 'on', 'jobs']
    const missing: string[] = []

    for (const field of required) {
      if (!(field in workflowObj)) {
        missing.push(field)
      }
    }

    return {valid: missing.length === 0, missing}
  }

  describe('Workflow File Format', () => {
    test('should have workflows directory', () => {
      expect(fs.existsSync(workflowsDir)).toBe(true)
    })

    test('all .yml/.yaml files should be valid YAML', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      expect(workflowFiles.length).toBeGreaterThan(0)

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const isValid = isValidYaml(content)
        expect(isValid).toBe(true)
      }
    })

    test('should not have files with trailing spaces in names', () => {
      const files = fs.readdirSync(workflowsDir)
      const filesWithTrailingSpaces = files.filter(
        file => file !== file.trim()
      )

      expect(filesWithTrailingSpaces).toEqual([])
    })

    test('all workflow files should have proper file extensions', () => {
      const files = fs.readdirSync(workflowsDir)
      const validExtensions = ['.yml', '.yaml', '']
      const invalidFiles = files.filter(file => {
        const ext = path.extname(file)
        return !validExtensions.includes(ext)
      })

      // Files without extensions should be flagged for review
      const noExtFiles = files.filter(file => path.extname(file) === '')
      if (noExtFiles.length > 0) {
        console.warn(`Warning: Found files without extensions: ${noExtFiles.join(', ')}`)
      }

      expect(invalidFiles).toEqual([])
    })
  })

  describe('Workflow Schema Validation', () => {
    test('all .yml/.yaml workflows should have required top-level fields', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        const validation = hasRequiredWorkflowFields(workflowObj)
        expect(validation.valid).toBe(true)
        if (!validation.valid) {
          console.error(
            `Workflow ${path.basename(file)} is missing fields: ${validation.missing.join(', ')}`
          )
        }
      }
    })

    test('workflow "on" field should have valid trigger types', () => {
      const validTriggers = [
        'push',
        'pull_request',
        'pull_request_target',
        'pull_request_review',
        'pull_request_review_comment',
        'release',
        'workflow_dispatch',
        'schedule',
        'create',
        'delete',
        'fork',
        'gollum',
        'issue_comment',
        'issues',
        'label',
        'milestone',
        'project',
        'project_card',
        'project_column',
        'public',
        'registry_package',
        'status',
        'watch',
        'workflow_call',
        'workflow_run'
      ]

      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.on) {
          const triggers =
            typeof workflowObj.on === 'string'
              ? [workflowObj.on]
              : Object.keys(workflowObj.on)

          for (const trigger of triggers) {
            expect(validTriggers).toContain(trigger)
          }
        }
      }
    })

    test('workflow jobs should have valid structure', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.jobs) {
          expect(typeof workflowObj.jobs).toBe('object')

          // Each job should have required fields
          for (const [jobName, jobConfig] of Object.entries(
            workflowObj.jobs
          )) {
            expect(jobConfig).toHaveProperty('runs-on')
            expect(jobConfig).toHaveProperty('steps')
            expect(Array.isArray((jobConfig as any).steps)).toBe(true)
          }
        }
      }
    })

    test('workflow steps should have valid structure', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.jobs) {
          for (const [jobName, jobConfig] of Object.entries(
            workflowObj.jobs
          )) {
            const steps = (jobConfig as any).steps
            if (Array.isArray(steps)) {
              for (const step of steps) {
                // Each step should have either 'uses' or 'run'
                const hasUses = 'uses' in step
                const hasRun = 'run' in step
                expect(hasUses || hasRun).toBe(true)
              }
            }
          }
        }
      }
    })
  })

  describe('Specific File: workflows', () => {
    const workflowsFile = path.join(workflowsDir, 'workflows ')

    test('should exist', () => {
      expect(fs.existsSync(workflowsFile)).toBe(true)
    })

    test('should not be empty', () => {
      if (fs.existsSync(workflowsFile)) {
        const content = fs.readFileSync(workflowsFile, 'utf-8')
        expect(content.length).toBeGreaterThan(0)
      }
    })

    test('should be valid YAML or have a proper format', () => {
      if (fs.existsSync(workflowsFile)) {
        const content = fs.readFileSync(workflowsFile, 'utf-8')

        // Try to parse as YAML
        let parsedContent: any
        try {
          parsedContent = yaml.load(content)
        } catch (error) {
          // If not valid YAML, the file should be flagged
          console.error(
            `File "workflows " is not valid YAML: ${(error as Error).message}`
          )
          console.error(`Content: "${content}"`)
          expect(isValidYaml(content)).toBe(true) // This will fail
        }

        // If it parses, validate structure
        if (parsedContent) {
          const validation = hasRequiredWorkflowFields(parsedContent)
          expect(validation.valid).toBe(true)
        }
      }
    })

    test('should have proper line endings', () => {
      if (fs.existsSync(workflowsFile)) {
        const content = fs.readFileSync(workflowsFile, 'utf-8')
        
        // Check if file ends with newline (Unix convention)
        if (content.length > 0) {
          const endsWithNewline = content.endsWith('\n')
          // Warn if it doesn't
          if (!endsWithNewline) {
            console.warn(
              'Warning: File "workflows " does not end with a newline'
            )
          }
        }
      }
    })

    test('should not contain only whitespace or non-workflow content', () => {
      if (fs.existsSync(workflowsFile)) {
        const content = fs.readFileSync(workflowsFile, 'utf-8').trim()
        
        // If content is just a simple word, it's likely invalid
        if (content && !content.includes(':') && !content.includes('\n')) {
          console.error(
            `File "workflows " appears to contain invalid content: "${content}"`
          )
          expect(content.includes(':')).toBe(true) // YAML should have key-value pairs
        }
      }
    })

    test('content should match GitHub Actions workflow expectations', () => {
      if (fs.existsSync(workflowsFile)) {
        const content = fs.readFileSync(workflowsFile, 'utf-8')
        
        // Check if content looks like a workflow
        const looksLikeWorkflow =
          content.includes('name:') ||
          content.includes('on:') ||
          content.includes('jobs:') ||
          isValidYaml(content)

        if (!looksLikeWorkflow) {
          console.error(
            `File "workflows " does not appear to be a valid GitHub Actions workflow`
          )
          console.error(`Content: "${content}"`)
        }

        expect(looksLikeWorkflow).toBe(true)
      }
    })
  })

  describe('Workflow Best Practices', () => {
    test('workflows should have descriptive names', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.name) {
          expect(workflowObj.name.length).toBeGreaterThan(0)
          expect(workflowObj.name.trim()).toBe(workflowObj.name)
        }
      }
    })

    test('steps should have names or uses for clarity', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.jobs) {
          for (const [jobName, jobConfig] of Object.entries(
            workflowObj.jobs
          )) {
            const steps = (jobConfig as any).steps
            if (Array.isArray(steps)) {
              for (let i = 0; i < steps.length; i++) {
                const step = steps[i]
                const hasIdentifier =
                  'name' in step || 'uses' in step || 'run' in step
                expect(hasIdentifier).toBe(true)
              }
            }
          }
        }
      }
    })

    test('workflows should use supported runner types', () => {
      const validRunners = [
        'ubuntu-latest',
        'ubuntu-22.04',
        'ubuntu-20.04',
        'windows-latest',
        'windows-2022',
        'windows-2019',
        'macos-latest',
        'macos-12',
        'macos-11',
        'self-hosted'
      ]

      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.jobs) {
          for (const [jobName, jobConfig] of Object.entries(
            workflowObj.jobs
          )) {
            const runsOn = (jobConfig as any)['runs-on']
            if (typeof runsOn === 'string') {
              const isValid =
                validRunners.some(runner => runsOn.includes(runner)) ||
                runsOn.includes('self-hosted')
              expect(isValid).toBe(true)
            }
          }
        }
      }
    })
  })

  describe('File Integrity', () => {
    test('all workflow files should be readable', () => {
      const workflowFiles = getWorkflowFiles()

      for (const file of workflowFiles) {
        expect(() => {
          fs.readFileSync(file, 'utf-8')
        }).not.toThrow()
      }
    })

    test('no duplicate workflow names', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      const names = new Set<string>()
      const duplicates: string[] = []

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.name) {
          if (names.has(workflowObj.name)) {
            duplicates.push(workflowObj.name)
          }
          names.add(workflowObj.name)
        }
      }

      expect(duplicates).toEqual([])
    })

    test('workflow files should not be too large', () => {
      const maxSize = 1024 * 100 // 100KB
      const workflowFiles = getWorkflowFiles()

      for (const file of workflowFiles) {
        const stats = fs.statSync(file)
        expect(stats.size).toBeLessThan(maxSize)
      }
    })
  })

  describe('Security Best Practices', () => {
    test('workflows using pull_request_target should have appropriate permissions', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const workflowObj = yaml.load(content) as any

        if (workflowObj?.on) {
          const triggers =
            typeof workflowObj.on === 'string'
              ? [workflowObj.on]
              : Object.keys(workflowObj.on)

          if (triggers.includes('pull_request_target')) {
            // Should have permissions defined for security
            if (workflowObj.permissions) {
              expect(typeof workflowObj.permissions).toBe('object')
            } else {
              console.warn(
                `Workflow ${path.basename(file)} uses pull_request_target without explicit permissions`
              )
            }
          }
        }
      }
    })

    test('workflows should not expose secrets in plain text', () => {
      const workflowFiles = getWorkflowFiles().filter(
        file => file.endsWith('.yml') || file.endsWith('.yaml')
      )

      const sensitivePatterns = [
        /password\s*:\s*['"]/i,
        /api[_-]?key\s*:\s*['"]/i,
        /secret\s*:\s*['"][^$]/i,
        /token\s*:\s*['"][^$]/i
      ]

      for (const file of workflowFiles) {
        const content = fs.readFileSync(file, 'utf-8')

        for (const pattern of sensitivePatterns) {
          const matches = content.match(pattern)
          if (matches) {
            console.warn(
              `Potential plain-text secret in ${path.basename(file)}: ${matches[0]}`
            )
          }
          expect(matches).toBeNull()
        }
      }
    })
  })
})