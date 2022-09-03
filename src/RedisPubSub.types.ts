import { RedisClientOptions, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'

export interface RedisPubSubOptions extends RedisClientOptions {
  client?: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  identifier?: string
  ignoreSelfPublications?: boolean
}

export interface RedisMessage {
  payload: Record<string, any>
  channel: string
  publisher: string
  publisherId: string
  processId: number
}
