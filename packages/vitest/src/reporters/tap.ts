import type { Vitest } from '../node'
import type { Reporter, Task } from '../types'
import { parseStacktrace } from '../utils/source-map'

const IDENT = '    '

function yamlString(str: string): string {
  return `"${str.replace('"', '\\"')}"`
}

function tapString(str: string): string {
  // Test name cannot contain #
  // Test name cannot start with number
  return str.replace('#', '?').replace(/^[0-9]+/, '?')
}

export class TapReporter implements Reporter {
  protected ctx!: Vitest

  onInit(ctx: Vitest): void {
    this.ctx = ctx
  }

  protected logTasks(tasks: Task[], currentIdent: string) {
    this.ctx.log(`${currentIdent}1..${tasks.length}`)

    for (const [i, task] of tasks.entries()) {
      const id = i + 1

      const ok = task.result?.state === 'pass' || task.mode === 'skip' || task.mode === 'todo' ? 'ok' : 'not ok'

      let comment = ''
      if (task.mode === 'skip')
        comment = ' # SKIP'
      else if (task.mode === 'todo')
        comment = ' # TODO'
      else if (task.result?.duration != null)
        comment = ` # time=${task.result.duration.toFixed(2)}ms`

      if (task.type === 'suite' && task.tasks.length > 0) {
        this.ctx.log(`${currentIdent}${ok} ${id} - ${tapString(task.name)}${comment} {`)

        this.logTasks(task.tasks, `${currentIdent}${IDENT}`)

        this.ctx.log(`${currentIdent}}`)
      }
      else {
        this.ctx.log(`${currentIdent}${ok} ${id} - ${tapString(task.name)}${comment}`)

        if (task.result?.state === 'fail' && task.result.error) {
          const error = task.result.error

          const baseErrorIdent = `${currentIdent}  `
          const errorIdent = `${currentIdent}    `
          this.ctx.log(`${baseErrorIdent}---`)
          this.ctx.log(`${baseErrorIdent}error:`)
          this.ctx.log(`${errorIdent}name: ${yamlString(error.name)}`)
          this.ctx.log(`${errorIdent}message: ${yamlString(error.message)}`)

          const stacks = parseStacktrace(error)
          const stack = stacks[0]
          if (stack) {
            // For compatibility with tap-mocha-repoter
            this.ctx.log(`${errorIdent}stack: ${yamlString(`${stack.file}:${stack.line}:${stack.column}`)}`)

            this.ctx.log(`${baseErrorIdent}at: ${yamlString(`${stack.file}:${stack.line}:${stack.column}`)}`)
          }

          if (error.showDiff) {
            this.ctx.log(`${baseErrorIdent}actual: ${yamlString(error.actual)}`)
            this.ctx.log(`${baseErrorIdent}expected: ${yamlString(error.expected)}`)
          }

          this.ctx.log(`${baseErrorIdent}...`)
        }
      }
    }
  }

  async onFinished(files = this.ctx.state.getFiles()) {
    this.ctx.log('TAP version 13')

    this.logTasks(files, '')
  }
}
