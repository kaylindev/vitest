import { File, Task, TaskResultPack } from '../types'

export class StateManager {
  filesMap: Record<string, File> = {}
  idMap: Record<string, Task> = {}
  taskFileMap = new WeakMap<Task, File>()

  getFiles(keys?: string[]): File[] {
    if (keys)
      return keys.map(key => this.filesMap[key])
    return Object.values(this.filesMap)
  }

  collectFiles(files: File[]) {
    files.forEach((file) => {
      this.filesMap[file.filepath] = file
      this.updateId(file)
    })
  }

  updateId(task: Task) {
    if (this.idMap[task.id] === task)
      return
    this.idMap[task.id] = task
    if (task.type === 'suite') {
      task.tasks.forEach((task) => {
        this.updateId(task)
      })
    }
  }

  updateTasks(packs: TaskResultPack[]) {
    for (const [id, result] of packs) {
      if (this.idMap[id])
        this.idMap[id].result = result
    }
  }
}
