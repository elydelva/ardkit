import type { ADR } from "../entities/adr.js";
import type { Task } from "../entities/task.js";
import { TaskId } from "../value-objects/task-id.js";

export class DAGService {
  areGatesCleared(task: Task, allTasks: Task[]): boolean {
    for (const gate of task.gates) {
      if (gate instanceof TaskId) {
        const dep = allTasks.find((t) => t.id.equals(gate));
        if (!dep || dep.status !== "completed") {
          return false;
        }
      }
      // String gates are treated as external references — assumed cleared
    }
    return true;
  }

  getBlockedTasks(tasks: Task[]): Task[] {
    return tasks.filter((t) => t.status === "blocked" || !this.areGatesCleared(t, tasks));
  }

  getEligibleTasks(tasks: Task[], adrs: ADR[]): Task[] {
    const activeADRIds = new Set(
      adrs
        .filter((a) => a.status === "accepted" || a.status === "in-progress")
        .map((a) => a.id.toString())
    );

    return tasks.filter((task) => {
      if (!activeADRIds.has(task.adrId.toString())) return false;
      if (task.status !== "not-started" && task.status !== "blocked") return false;
      if (!this.areGatesCleared(task, tasks)) return false;
      return true;
    });
  }
}
