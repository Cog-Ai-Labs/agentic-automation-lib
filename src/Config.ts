export class Config {
  public redisUrl: string;
  public rabbitmqUrl: string;
  public cronSchedule: string;
  public checkIntervalMs: number;

  constructor({redis_url, rabbitmq_url, cron_schedule, check_interval_ms}:{redis_url:string, rabbitmq_url:string, cron_schedule?:string, check_interval_ms?:number}) {
    this.redisUrl = redis_url || "redis://localhost:6379";
    this.rabbitmqUrl = rabbitmq_url || "amqp://localhost";
    this.cronSchedule = cron_schedule || "* * * * *"; // every minute
    this.checkIntervalMs = check_interval_ms || 5000; // 5 seconds
  }
}
