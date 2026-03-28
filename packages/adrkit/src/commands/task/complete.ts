import { TaskId } from "@adrkit/core";
import type { Container } from "../../container.js";

export async function runTaskComplete(container: Container, taskIdRaw: string): Promise<void> {
  const taskId = TaskId.from(taskIdRaw);
  const actor = process.env.GIT_AUTHOR_NAME ?? process.env.USER ?? "unknown";

  const task = await container.completeTask.execute({ id: taskId, actor });
  console.log(`✓ Completed ${task.id.toString()} — ${task.title}`);
}
