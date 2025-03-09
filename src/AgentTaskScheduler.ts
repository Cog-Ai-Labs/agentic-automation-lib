// src/AgentTaskScheduler.ts
import { v4 as uuidv4 } from "uuid";
import { RabbitMQService } from "./Rabbitmq";
import { TaskRepository } from "./TaskRepository";
import { Config } from "./Config";

export interface AgentTask {
  id: string;
  userId: string;
  agentId: string;
  taskQuery: string;
  taskDescription: string;
  scheduledTime: Date;
  status: "pending" | "queued" | "running" | "completed" | "failed";
  recurrenceInterval?: number; // milliseconds (optional for recurring tasks)
  recurrenceEndTime?: Date; // optional end time for recurrence
}

export class AgentTaskScheduler {
  private checkInterval: NodeJS.Timeout;

  constructor(
    private config: Config,
    private taskRepository: TaskRepository,
    private rabbitMQService: RabbitMQService
  ) {
    // Replace cron with setInterval to allow for more frequent checks
    // config.checkIntervalMs should be set to the desired interval in milliseconds (e.g., 1000 for 1 second)
    this.checkInterval = setInterval(() => {
      this.checkDueTasks();
    }, this.config.checkIntervalMs);
  }

  // Method to stop the interval when needed (e.g., during shutdown)
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async scheduleTask(
    agentId: string,
    userId: string,
    taskQuery: string,
    taskDescription: string,
    scheduledTime: Date,
    recurrenceInterval?: number,
    recurrenceEndTime?: Date
  ): Promise<string> {
    const id = uuidv4();
    const task: AgentTask = {
      id,
      userId,
      agentId,
      taskQuery,
      taskDescription,
      scheduledTime,
      status: "pending",
      recurrenceInterval,
      recurrenceEndTime,
    };
    await this.taskRepository.saveTask(task);
    return id;
  }

  private async checkDueTasks(): Promise<void> {
    const now = new Date();
    const dueTasks = await this.taskRepository.getDueTasks(now);
    for (const task of dueTasks) {
      //console.log(`Task ${task.id} is due. Publishing to queue...`);
      task.status = "queued";
      await this.taskRepository.saveTask(task); // update status
      await this.rabbitMQService.publishTask(task);
      // If the task is recurring, update its scheduledTime.
      if (task.recurrenceInterval) {
        const nextTime = new Date(task.scheduledTime.getTime() + task.recurrenceInterval);
        if (task.recurrenceEndTime && nextTime.getTime() > task.recurrenceEndTime.getTime()) {
          //console.log(`Task ${task.id} recurrence ended.`);
          await this.taskRepository.removeTask(task.id);
        } else {
          task.scheduledTime = nextTime;
          task.status = "pending";
          await this.taskRepository.saveTask(task);
          //console.log(`Task ${task.id} rescheduled for ${nextTime.toISOString()}`);
        }
      } else {
        await this.taskRepository.removeTask(task.id);
      }
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    await this.taskRepository.removeTask(taskId);
    //console.log(`Cancelled task ${taskId}`);
    return true;
  }
}
