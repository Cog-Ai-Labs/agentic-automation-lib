// src/Worker.ts
import { ConsumeMessage } from "amqplib";
import { RabbitMQService } from "./Rabbitmq";
import { AgentTask } from "./AgentTaskScheduler";

export type TaskDispatchCallback = (task: AgentTask) => Promise<void>;

export class Worker {
  constructor(
    private rabbitMQService: RabbitMQService,
    private onTaskDispatch: TaskDispatchCallback
  ) {}

  async start(): Promise<void> {
    await this.rabbitMQService.consumeTasks(async (msg: ConsumeMessage) => {
      const task: AgentTask = JSON.parse(msg.content.toString());
      console.log(
        `Worker: Processing task ${task.id} for agent ${task.agentId}`
      );
      try {
        await this.onTaskDispatch(task);
        console.log(`Worker: Task ${task.id} executed successfully.`);
      } catch (error) {
        console.error(`Worker: Error executing task ${task.id}:`, error);
        throw error;
      }
    });
    console.log("Worker started, listening for tasks...");
  }
}
