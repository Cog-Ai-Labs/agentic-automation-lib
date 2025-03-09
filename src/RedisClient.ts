// src/RedisClient.ts
import Redis from "ioredis";

export class RedisClient {
  public client: Redis;

  constructor(redisUrl:string) {
    this.client = new Redis(redisUrl);
    // this.client.on("connect", () => {
    //     console.log("Redis Connection Successful")
    // })
    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }
}
