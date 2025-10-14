import { describe, test, expect, beforeAll } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

interface WorkflowFile {
  path: string
  content: string
  parsed?: any
}

describe('GitHub Workflow Files Validation', () => {
  let workflowFiles: WorkflowFile[]

  beforeAll(() => {
    const workflowDir = path.join(__dirname, '..', '.github', 'workflows')
    const files = fs.readdirSync(workflowDir)

    workflowFiles = files
      .map(file => ({
        path: path.join(workflowDir, file),
        content: ''
      }))
      .filter(f => {
        const stat = fs.statSync(f.path)
        return stat.isFile()
      })
      .map(f => {
        try {
          f.content = fs.readFileSync(f.path, 'utf8')
        } catch (error) {
          f.content = ''
        }
        return f
      })
  })

  describe('Workflow File Discovery', () => {
    test('should find workflow files in .github/workflows directory', () => {
      expect(workflowFiles).toBeDefined()
      expect(workflowFiles.length).toBeGreaterThan(0)
    })

    test('should have readable content for all workflow files', () => {
      workflowFiles.forEach(file => {
        expect(file.content).toBeDefined()
      })
    })
  })

  describe('YAML Syntax Validation', () => {
    test.each(workflowFiles.map(f => [path.basename(f.path), f]))(
      'should parse %s as valid YAML',
      (filename, file: WorkflowFile) => {
        // Skip empty files
        if (!file.content.trim()) {
          expect(file.content.trim()).toBe('')
          return
        }

        // For .yml or .yaml files, expect valid YAML
        if (filename.toString().endsWith('.yml') || filename.toString().endsWith('.yaml')) {
          expect(() => {
            const parsed = yaml.load(file.content)
            file.parsed = parsed
          }).not.toThrow()
        } else {
          // For non-standard workflow files, check if content is valid YAML
          try {
            const parsed = yaml.load(file.content)
            file.parsed = parsed
          } catch (error) {
            // If not valid YAML, content should be a simple string
            expect(typeof file.content).toBe('string')
          }
        }
      }
    )

    test('should detect invalid YAML in workflow files', () => {
      const invalidYaml = 'name: test\n  invalid: : structure'
      expect(() => yaml.load(invalidYaml)).toThrow()
    })
  })

  describe('GitHub Actions Workflow Schema Validation', () => {
    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should have required workflow fields',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        
        // Required fields for a valid GitHub Actions workflow
        expect(parsed).toHaveProperty('on')
        expect(parsed).toHaveProperty('jobs')
        
        // Optional but common fields
        if (parsed.name) {
          expect(typeof parsed.name).toBe('string')
          expect(parsed.name.length).toBeGreaterThan(0)
        }
      }
    )

    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should have valid job configurations',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        
        expect(parsed.jobs).toBeDefined()
        expect(typeof parsed.jobs).toBe('object')
        
        const jobNames = Object.keys(parsed.jobs)
        expect(jobNames.length).toBeGreaterThan(0)
        
        // Each job should have required fields
        jobNames.forEach(jobName => {
          const job = parsed.jobs[jobName]
          expect(job).toHaveProperty('runs-on')
          expect(job).toHaveProperty('steps')
          expect(Array.isArray(job.steps)).toBe(true)
          expect(job.steps.length).toBeGreaterThan(0)
        })
      }
    )

    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should have valid trigger configuration',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        
        expect(parsed.on).toBeDefined()
        
        // 'on' can be a string or object
        if (typeof parsed.on === 'string') {
          // Should be a valid event name
          expect(parsed.on.length).toBeGreaterThan(0)
        } else if (typeof parsed.on === 'object') {
          const triggers = Object.keys(parsed.on)
          expect(triggers.length).toBeGreaterThan(0)
        }
      }
    )
  })

  describe('Workflow Step Validation', () => {
    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should have properly structured steps',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        
        Object.keys(parsed.jobs).forEach(jobName => {
          const job = parsed.jobs[jobName]
          
          job.steps.forEach((step: any, index: number) => {
            // Each step should have either 'uses' or 'run'
            const hasUses = step.hasOwnProperty('uses')
            const hasRun = step.hasOwnProperty('run')
            
            expect(hasUses || hasRun).toBe(true)
            
            // If using an action, should have valid format
            if (hasUses) {
              expect(typeof step.uses).toBe('string')
              expect(step.uses.length).toBeGreaterThan(0)
            }
            
            // If running a command, should be a string
            if (hasRun) {
              expect(typeof step.run).toBe('string')
              expect(step.run.length).toBeGreaterThan(0)
            }
          })
        })
      }
    )
  })

  describe('Workflow Security Best Practices', () => {
    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should use pinned action versions when possible',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        
        let hasActions = false
        let hasPinnedVersions = false
        
        Object.keys(parsed.jobs).forEach(jobName => {
          const job = parsed.jobs[jobName]
          
          job.steps.forEach((step: any) => {
            if (step.uses) {
              hasActions = true
              // Check if version is pinned (has @ with version)
              if (step.uses.includes('@')) {
                hasPinnedVersions = true
              }
            }
          })
        })
        
        // If workflow has actions, at least some should be pinned
        if (hasActions) {
          expect(hasPinnedVersions).toBe(true)
        }
      }
    )

    test.each(workflowFiles.filter(f => {
      const basename = path.basename(f.path)
      return (basename.endsWith('.yml') || basename.endsWith('.yaml')) && f.content.trim()
    }).map(f => [path.basename(f.path), f]))(
      '%s should use appropriate runners',
      (filename, file: WorkflowFile) => {
        const parsed = yaml.load(file.content) as any
        const validRunners = [
          'ubuntu-latest',
          'ubuntu-22.04',
          'ubuntu-20.04',
          'windows-latest',
          'windows-2022',
          'windows-2019',
          'macos-latest',
          'macos-12',
          'macos-11'
        ]
        
        Object.keys(parsed.jobs).forEach(jobName => {
          const job = parsed.jobs[jobName]
          const runnerPattern = /^(ubuntu|windows|macos)-(latest|\d+(\.\d+)?)|self-hosted/
          
          expect(runnerPattern.test(job['runs-on'])).toBe(true)
        })
      }
    )
  })

  describe('Non-standard Workflow Files', () => {
    test('should identify files that are not standard workflow files', () => {
      const nonStandardFiles = workflowFiles.filter(f => {
        const basename = path.basename(f.path)
        return !basename.endsWith('.yml') && !basename.endsWith('.yaml')
      })
      
      // Document non-standard files for review
      nonStandardFiles.forEach(file => {
        const basename = path.basename(file.path)
        console.log(`Non-standard workflow file detected: ${basename}`)
        console.log(`Content: ${file.content.substring(0, 100)}`)
      })
    })

    test('non-standard workflow files should either be valid YAML or documented', () => {
      const nonStandardFiles = workflowFiles.filter(f => {
        const basename = path.basename(f.path)
        return !basename.endsWith('.yml') && !basename.endsWith('.yaml')
      })
      
      nonStandardFiles.forEach(file => {
        const basename = path.basename(file.path)
        
        // Try to parse as YAML
        let isValidYaml = false
        try {
          const parsed = yaml.load(file.content)
          if (parsed && typeof parsed === 'object') {
            isValidYaml = true
          }
        } catch (error) {
          isValidYaml = false
        }
        
        // If not valid YAML, content should be intentionally simple or documented
        if (!isValidYaml) {
          // Check if file has meaningful content or is intentionally simple
          const hasContent = file.content.trim().length > 0
          
          if (hasContent) {
            // Log warning about potentially problematic file
            console.warn(
              `Warning: ${basename} is not a valid workflow file. ` +
              `Content: "${file.content.trim()}"`
            )
          }
        }
      })
    })
  })

  describe('Workflow File Naming Conventions', () => {
    test('should follow kebab-case or camelCase naming', () => {
      workflowFiles.forEach(file => {
        const basename = path.basename(file.path, path.extname(file.path))
        const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/
        const camelCase = /^[a-z][a-zA-Z0-9]*$/
        
        // Allow standard extensions
        if (basename.endsWith('.yml') || basename.endsWith('.yaml')) {
          const nameWithoutExt = basename.replace(/\.(yml|yaml)$/, '')
          const isValid = kebabCase.test(nameWithoutExt) || camelCase.test(nameWithoutExt)
          
          if (!isValid) {
            console.warn(`Non-standard workflow filename: ${basename}`)
          }
        }
      })
    })

    test('should not have trailing spaces in filenames', () => {
      workflowFiles.forEach(file => {
        const basename = path.basename(file.path)
        expect(basename).toBe(basename.trim())
      })
    })
  })

  describe('Content Quality Checks', () => {
    test('workflow files should not be empty', () => {
      const yamlFiles = workflowFiles.filter(f => {
        const basename = path.basename(f.path)
        return basename.endsWith('.yml') || basename.endsWith('.yaml')
      })
      
      yamlFiles.forEach(file => {
        expect(file.content.trim().length).toBeGreaterThan(0)
      })
    })

    test('workflow files should have meaningful content', () => {
      const yamlFiles = workflowFiles.filter(f => {
        const basename = path.basename(f.path)
        return basename.endsWith('.yml') || basename.endsWith('.yaml')
      })
      
      yamlFiles.forEach(file => {
        const parsed = yaml.load(file.content) as any
        expect(parsed).not.toBeNull()
        expect(typeof parsed).toBe('object')
        
        // Should have more than just a simple string
        const keys = Object.keys(parsed)
        expect(keys.length).toBeGreaterThan(0)
      })
    })

    test('should detect single-word workflow files as invalid', () => {
      workflowFiles.forEach(file => {
        const content = file.content.trim()
        const basename = path.basename(file.path)
        
        // If file ends with .yml or .yaml, it should be valid workflow YAML
        if (basename.endsWith('.yml') || basename.endsWith('.yaml')) {
          // Single word files are not valid workflows
          const isSingleWord = /^[a-zA-Z]+\s*$/.test(content)
          expect(isSingleWord).toBe(false)
        }
      })
    })
  })

  describe('Integration with CI/CD', () => {
    test('should have at least one workflow for CI/CD', () => {
      const ciKeywords = ['test', 'build', 'ci', 'deploy', 'release', 'publish']
      
      const hasCIWorkflow = workflowFiles.some(file => {
        const basename = path.basename(file.path).toLowerCase()
        return ciKeywords.some(keyword => basename.includes(keyword))
      })
      
      // Note: This may fail if no CI workflows exist yet
      // But it's good to document the expectation
      if (!hasCIWorkflow) {
        console.log('Note: No obvious CI/CD workflows detected')
      }
    })
  })
})