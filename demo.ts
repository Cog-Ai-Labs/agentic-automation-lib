// demo.ts
import { Config } from "./src/Config";
import { RedisClient } from "./src/RedisClient";
import { RabbitMQService } from "./src/Rabbitmq";
import { TaskRepository } from "./src/TaskRepository";
import { AgentTaskScheduler } from "./src/AgentTaskScheduler";
import { Worker, TaskDispatchCallback } from "./src/Worker";

(async () => {
  // Create a configuration instance from environment variables.
const config = new Config({rabbitmq_url:"amqp://guest:guest@localhost:5672/",redis_url:"redis://localhost:6379", check_interval_ms: 1000});


// Instantiate the Redis client.
const redisClient = new RedisClient(config.redisUrl);

// Instantiate the RabbitMQ service and initialize it.
const rabbitMQService = new RabbitMQService(config);
await rabbitMQService.init();

// Instantiate the TaskRepository using the Redis client.
const taskRepository = new TaskRepository(redisClient);

// Create an instance of AgentTaskScheduler.
const scheduler = new AgentTaskScheduler(config, taskRepository, rabbitMQService);

// A sample task dispatch callback that simulates agent execution.
const dispatchAgentTask: TaskDispatchCallback = async (task) => {
  console.log(`Dispatching task ${task.id} to agent ${task.agentId}`);
  console.log(`Task instruction: "${task.taskDescription}"`);
  // Simulate processing delay (2 seconds)
  await new Promise((res) => setTimeout(res, 2000));
  console.log(`Agent ${task.agentId} completed task ${task.id}`);
};

// Instantiate and start the worker.
const worker = new Worker(rabbitMQService, dispatchAgentTask);
worker.start().catch((err) => console.error("Worker failed to start:", err));

  // Schedule a sample recurring task:
  // Run every 10 seconds for the next 1 minute.
  const agentId = "agent-1"; // Replace with your agent id.
  const userId = "user-123";
  const taskDescription = "Tweet: Check out our recurring product launch reminder!";
  const firstRun = new Date(Date.now() + 5000); // first run in 5 seconds.
  const recurrenceInterval = 10000; // every 10 seconds.
  const recurrenceEndTime = new Date(Date.now() + 60000); // stop after 1 minute.

  scheduler
    .scheduleTask(agentId, userId, "Check the weather in Tokyo", taskDescription, firstRun, recurrenceInterval, recurrenceEndTime)
    .then((taskId) => console.log(`Demo: Recurring task scheduled with ID: ${taskId}`))
    .catch((err) => console.error("Error scheduling recurring task:", err));
})();

