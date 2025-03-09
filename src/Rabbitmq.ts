// src/RabbitMQService.ts
import amqp, { Channel, Connection, ConsumeMessage } from "amqplib";
import { Config } from "./Config";

const QUEUE_NAME = "agentTaskQueue";

export class RabbitMQService {
  private connection!: Connection;
  private channel!: Channel;
  public queueName: string

  constructor(private config: Config, queueName?:string) {
    this.queueName = queueName? queueName:QUEUE_NAME
  }

  async init(): Promise<Channel> {
    this.connection = await amqp.connect(this.config.rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
    // Limit the consumer to processing one message at a time
    await this.channel.prefetch(1);
    console.log("RabbitMQ channel and queue initialized.");
    return this.channel;
  }

  async publishTask(task: any): Promise<string> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(task)), {
      persistent: true,
    });
    return `Published task ${task.id} to RabbitMQ.`;
  }

  async consumeTasks(
    onMessage: (msg: ConsumeMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    this.channel.consume(
    this.queueName,
      async (msg) => {
        if (msg !== null) {
          try {
            await onMessage(msg);
            this.channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }
}
