// src/TaskRepository.ts
import { RedisClient } from "./RedisClient";
import { AgentTask } from "./AgentTaskScheduler";

export class TaskRepository {
  constructor(private redisClient: RedisClient) {}

  async saveTask(task: AgentTask): Promise<void> {
    const key = `task:${task.id}`;
    await this.redisClient.client.set(key, JSON.stringify(task));
    await this.redisClient.client.zadd(
      "tasks:pending",
      task.scheduledTime.getTime().toString(),
      task.id
    );
  }

  async removeTask(taskId: string): Promise<void> {
    const key = `task:${taskId}`;
    await this.redisClient.client.del(key);
    await this.redisClient.client.zrem("tasks:pending", taskId);
  }

  async getDueTasks(currentTime: Date): Promise<AgentTask[]> {
    const maxScore = currentTime.getTime();
    const taskIds = await this.redisClient.client.zrangebyscore(
      "tasks:pending",
      "0",
      maxScore.toString()
    );
    const tasks: AgentTask[] = [];
    for (const id of taskIds) {
        const key = `task:${id}`;
        const taskJson = await this.redisClient.client.get(key);
        if (taskJson) {
          const taskObj = JSON.parse(taskJson);
          taskObj.scheduledTime = new Date(taskObj.scheduledTime);
          // Convert recurrenceEndTime if it exists.
          if (taskObj.recurrenceEndTime) {
            taskObj.recurrenceEndTime = new Date(taskObj.recurrenceEndTime);
          }
          tasks.push(taskObj);
        }
      }
    return tasks;
  }
}
