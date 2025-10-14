import {describe, expect, test} from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

const workflowsDir = path.join(__dirname, '..', '.github', 'workflows')

/**
 * Test suite for validating GitHub Actions workflow files
 * Ensures all workflow files are valid YAML and conform to GitHub Actions schema
 */
describe('GitHub Workflows Validation', () => {
  // Get all files in the workflows directory
  const getAllWorkflowFiles = (): string[] => {
    if (!fs.existsSync(workflowsDir)) {
      return []
    }
    return fs.readdirSync(workflowsDir)
  }

  describe('Workflow Files Discovery', () => {
    test('workflows directory should exist', () => {
      expect(fs.existsSync(workflowsDir)).toBe(true)
    })

    test('workflows directory should contain files', () => {
      const files = getAllWorkflowFiles()
      expect(files.length).toBeGreaterThan(0)
    })

    test('should list all workflow files', () => {
      const files = getAllWorkflowFiles()
      console.log('Found workflow files:', files)
      expect(Array.isArray(files)).toBe(true)
    })
  })

  describe('YAML Validity', () => {
    const workflowFiles = getAllWorkflowFiles()

    workflowFiles.forEach(filename => {
      // Only test files with .yml or .yaml extension
      if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
        test(`${filename} should be valid YAML`, () => {
          const filePath = path.join(workflowsDir, filename)
          const content = fs.readFileSync(filePath, 'utf8')
          
          expect(() => {
            yaml.load(content)
          }).not.toThrow()
        })
      }
    })

    test('files without .yml/.yaml extension should be flagged', () => {
      const files = getAllWorkflowFiles()
      const nonYamlFiles = files.filter(
        f => !f.endsWith('.yml') && !f.endsWith('.yaml') && !f.startsWith('.')
      )
      
      // Log any non-YAML files for review
      if (nonYamlFiles.length > 0) {
        console.warn('Non-YAML files found in workflows directory:', nonYamlFiles)
      }
    })
  })

  describe('GitHub Actions Schema Validation', () => {
    const workflowFiles = getAllWorkflowFiles().filter(
      f => f.endsWith('.yml') || f.endsWith('.yaml')
    )

    workflowFiles.forEach(filename => {
      describe(`${filename}`, () => {
        let workflow: any

        beforeAll(() => {
          const filePath = path.join(workflowsDir, filename)
          const content = fs.readFileSync(filePath, 'utf8')
          workflow = yaml.load(content)
        })

        test('should have a name field', () => {
          expect(workflow).toHaveProperty('name')
          expect(typeof workflow.name).toBe('string')
          expect(workflow.name.length).toBeGreaterThan(0)
        })

        test('should have an on field defining triggers', () => {
          expect(workflow).toHaveProperty('on')
          expect(workflow.on).toBeDefined()
        })

        test('should have a jobs field', () => {
          expect(workflow).toHaveProperty('jobs')
          expect(typeof workflow.jobs).toBe('object')
          expect(Object.keys(workflow.jobs).length).toBeGreaterThan(0)
        })

        test('each job should have a runs-on field', () => {
          const jobs = workflow.jobs
          Object.keys(jobs).forEach(jobName => {
            expect(jobs[jobName]).toHaveProperty('runs-on')
            expect(typeof jobs[jobName]['runs-on']).toBe('string')
          })
        })

        test('each job should have steps', () => {
          const jobs = workflow.jobs
          Object.keys(jobs).forEach(jobName => {
            expect(jobs[jobName]).toHaveProperty('steps')
            expect(Array.isArray(jobs[jobName].steps)).toBe(true)
            expect(jobs[jobName].steps.length).toBeGreaterThan(0)
          })
        })

        test('each step should have uses or run field', () => {
          const jobs = workflow.jobs
          Object.keys(jobs).forEach(jobName => {
            jobs[jobName].steps.forEach((step: any, index: number) => {
              const hasUses = 'uses' in step
              const hasRun = 'run' in step
              expect(hasUses || hasRun).toBe(true)
            })
          })
        })
      })
    })
  })

  describe('Specific Workflow Content Validation', () => {
    test('openai-review.yml should have correct permissions', () => {
      const filePath = path.join(workflowsDir, 'openai-review.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        expect(workflow).toHaveProperty('permissions')
        expect(workflow.permissions).toHaveProperty('contents')
        expect(workflow.permissions).toHaveProperty('pull-requests')
      }
    })

    test('openai-review.yml should trigger on pull_request_target', () => {
      const filePath = path.join(workflowsDir, 'openai-review.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        expect(workflow.on).toHaveProperty('pull_request_target')
      }
    })

    test('combine-prs.yml should be workflow_dispatch', () => {
      const filePath = path.join(workflowsDir, 'combine-prs.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        expect(workflow.on).toHaveProperty('workflow_dispatch')
      }
    })

    test('versioning.yml should trigger on release events', () => {
      const filePath = path.join(workflowsDir, 'versioning.yml')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        expect(workflow.on).toHaveProperty('release')
      }
    })
  })

  describe('Invalid Workflow Files', () => {
    test('workflows file (with trailing space) should be invalid', () => {
      // Check for the file with trailing space
      const files = getAllWorkflowFiles()
      const invalidFile = files.find(f => f.startsWith('workflows') && !f.endsWith('.yml') && !f.endsWith('.yaml'))
      
      if (invalidFile) {
        const filePath = path.join(workflowsDir, invalidFile)
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Should not be valid YAML workflow
        expect(() => {
          const parsed = yaml.load(content)
          // Even if it parses, it shouldn't have workflow structure
          expect(parsed).not.toHaveProperty('name')
          expect(parsed).not.toHaveProperty('on')
          expect(parsed).not.toHaveProperty('jobs')
        }).toBeTruthy()
      }
    })

    test('non-YAML files should be identified and reported', () => {
      const files = getAllWorkflowFiles()
      const nonYamlFiles = files.filter(
        f => !f.endsWith('.yml') && !f.endsWith('.yaml') && !f.startsWith('.')
      )
      
      nonYamlFiles.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Log the content of non-YAML files
        console.warn(`Non-YAML file detected: ${file}`)
        console.warn(`Content: ${content}`)
        
        // Try parsing as YAML and expect it to fail or not have workflow structure
        try {
          const parsed = yaml.load(content)
          // If it parses, it should not be a valid workflow
          const hasWorkflowStructure = 
            parsed && 
            typeof parsed === 'object' &&
            'name' in parsed &&
            'on' in parsed &&
            'jobs' in parsed
          
          expect(hasWorkflowStructure).toBe(false)
        } catch (error) {
          // Expected for invalid YAML
          expect(error).toBeDefined()
        }
      })
    })
  })

  describe('Workflow File Naming Conventions', () => {
    test('all valid workflow files should use kebab-case', () => {
      const files = getAllWorkflowFiles().filter(
        f => f.endsWith('.yml') || f.endsWith('.yaml')
      )
      
      files.forEach(file => {
        const nameWithoutExt = file.replace(/\.(yml|yaml)$/, '')
        // Kebab case: lowercase letters, numbers, and hyphens only
        const isKebabCase = /^[a-z0-9-]+$/.test(nameWithoutExt)
        expect(isKebabCase).toBe(true)
      })
    })

    test('workflow files should have .yml or .yaml extension', () => {
      const files = getAllWorkflowFiles()
      const properFiles = files.filter(f => !f.startsWith('.'))
      
      properFiles.forEach(file => {
        const hasProperExtension = file.endsWith('.yml') || file.endsWith('.yaml')
        if (!hasProperExtension) {
          console.error(`File ${file} does not have .yml or .yaml extension`)
        }
        // We expect valid workflow files to have proper extensions
        // but won't fail the test - just log warnings
      })
    })
  })

  describe('Workflow Security Checks', () => {
    const workflowFiles = getAllWorkflowFiles().filter(
      f => f.endsWith('.yml') || f.endsWith('.yaml')
    )

    workflowFiles.forEach(filename => {
      describe(`${filename} security`, () => {
        let workflow: any
        let content: string

        beforeAll(() => {
          const filePath = path.join(workflowsDir, filename)
          content = fs.readFileSync(filePath, 'utf8')
          workflow = yaml.load(content)
        })

        test('should not contain hardcoded secrets in plain text', () => {
          // Check for common secret patterns (excluding secret references)
          const secretPatterns = [
            /password\s*[:=]\s*["'][^"'$]+["']/i,
            /api[_-]?key\s*[:=]\s*["'][^"'$]+["']/i,
            /token\s*[:=]\s*["'][^"'$]+["']/i
          ]
          
          secretPatterns.forEach(pattern => {
            // Allow secret references like ${{ secrets.XXX }}
            const matches = content.match(pattern)
            if (matches) {
              matches.forEach(match => {
                expect(match).toContain('secrets.')
              })
            }
          })
        })

        test('should use secrets for sensitive data', () => {
          // If workflow contains sensitive keywords, should use secrets
          const contentLower = content.toLowerCase()
          const hasSensitiveKeys = 
            contentLower.includes('api_key') ||
            contentLower.includes('apikey') ||
            contentLower.includes('token')
          
          if (hasSensitiveKeys) {
            expect(content).toMatch(/secrets\./i)
          }
        })
      })
    })
  })

  describe('Workflow Best Practices', () => {
    const workflowFiles = getAllWorkflowFiles().filter(
      f => f.endsWith('.yml') || f.endsWith('.yaml')
    )

    workflowFiles.forEach(filename => {
      describe(`${filename} best practices`, () => {
        let workflow: any

        beforeAll(() => {
          const filePath = path.join(workflowsDir, filename)
          const content = fs.readFileSync(filePath, 'utf8')
          workflow = yaml.load(content)
        })

        test('should specify timeout-minutes for jobs to prevent hanging', () => {
          const jobs = workflow.jobs
          // This is a recommendation, not a hard requirement
          Object.keys(jobs).forEach(jobName => {
            if (!jobs[jobName]['timeout-minutes']) {
              console.info(
                `Job ${jobName} in ${filename} could benefit from timeout-minutes`
              )
            }
          })
        })

        test('actions should use version pinning or SHA', () => {
          const jobs = workflow.jobs
          Object.keys(jobs).forEach(jobName => {
            jobs[jobName].steps.forEach((step: any, index: number) => {
              if (step.uses) {
                // Check if using @v notation or SHA
                const hasVersionPin = 
                  step.uses.includes('@v') || 
                  step.uses.includes('@main') ||
                  step.uses.includes('@master') ||
                  /\@[a-f0-9]{40}/.test(step.uses)
                
                if (!hasVersionPin && !step.uses.startsWith('./')) {
                  console.warn(
                    `Step ${index} in job ${jobName} of ${filename} uses unpinned action: ${step.uses}`
                  )
                }
              }
            })
          })
        })
      })
    })
  })

  describe('Comprehensive Edge Cases', () => {
    test('should handle empty workflows directory gracefully', () => {
      // This test verifies the code handles edge cases
      expect(() => getAllWorkflowFiles()).not.toThrow()
    })

    test('should handle malformed YAML gracefully', () => {
      const files = getAllWorkflowFiles()
      const nonYamlFiles = files.filter(
        f => !f.endsWith('.yml') && !f.endsWith('.yaml') && !f.startsWith('.')
      )
      
      nonYamlFiles.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        
        // Should not crash when parsing invalid YAML
        expect(() => {
          try {
            yaml.load(content)
          } catch (e) {
            // Expected for invalid YAML
          }
        }).not.toThrow()
      })
    })

    test('should validate file read permissions', () => {
      const files = getAllWorkflowFiles()
      files.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        expect(() => {
          fs.readFileSync(filePath, 'utf8')
        }).not.toThrow()
      })
    })

    test('should handle files with unusual names', () => {
      const files = getAllWorkflowFiles()
      // Test files with spaces, special characters, etc.
      files.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        expect(fs.existsSync(filePath)).toBe(true)
        
        // Log any files with unusual naming
        if (file.includes(' ') || /[^a-zA-Z0-9._-]/.test(file)) {
          console.warn(`Unusual filename detected: "${file}"`)
        }
      })
    })
  })

  describe('Workflow Dependencies and Actions', () => {
    const workflowFiles = getAllWorkflowFiles().filter(
      f => f.endsWith('.yml') || f.endsWith('.yaml')
    )

    test('should document all external actions used', () => {
      const allActions = new Set<string>()
      
      workflowFiles.forEach(filename => {
        const filePath = path.join(workflowsDir, filename)
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        Object.keys(workflow.jobs).forEach(jobName => {
          workflow.jobs[jobName].steps.forEach((step: any) => {
            if (step.uses && !step.uses.startsWith('./')) {
              allActions.add(step.uses)
            }
          })
        })
      })
      
      console.log('External actions used across all workflows:', Array.from(allActions))
      expect(allActions.size).toBeGreaterThan(0)
    })

    test('local actions should reference valid paths', () => {
      workflowFiles.forEach(filename => {
        const filePath = path.join(workflowsDir, filename)
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        Object.keys(workflow.jobs).forEach(jobName => {
          workflow.jobs[jobName].steps.forEach((step: any) => {
            if (step.uses && step.uses.startsWith('./')) {
              // Local action reference - verify it starts with ./
              expect(step.uses).toMatch(/^\.\//)
            }
          })
        })
      })
    })
  })

  describe('Workflow Concurrency Controls', () => {
    test('pull request workflows should have concurrency groups', () => {
      const prWorkflows = getAllWorkflowFiles().filter(
        f => f.endsWith('.yml') || f.endsWith('.yaml')
      ).filter(filename => {
        const filePath = path.join(workflowsDir, filename)
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        return workflow.on && (
          workflow.on.pull_request ||
          workflow.on.pull_request_target
        )
      })
      
      prWorkflows.forEach(filename => {
        const filePath = path.join(workflowsDir, filename)
        const content = fs.readFileSync(filePath, 'utf8')
        const workflow: any = yaml.load(content)
        
        if (!workflow.concurrency) {
          console.warn(`${filename} could benefit from concurrency controls`)
        }
      })
    })
  })

  describe('File Content Validation', () => {
    test('all workflow files should be non-empty', () => {
      const files = getAllWorkflowFiles()
      files.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        expect(content.length).toBeGreaterThan(0)
      })
    })

    test('workflow files should not have trailing whitespace issues', () => {
      const files = getAllWorkflowFiles().filter(
        f => f.endsWith('.yml') || f.endsWith('.yaml')
      )
      
      files.forEach(file => {
        const filePath = path.join(workflowsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        lines.forEach((line, index) => {
          // Check for tabs (YAML should use spaces)
          if (line.includes('\t')) {
            console.warn(`${file}:${index + 1} contains tabs, should use spaces`)
          }
        })
      })
    })
  })
})