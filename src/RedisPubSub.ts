import { v4 as uuidV4 } from 'uuid'
import { RedisMessage, RedisPubSubOptions } from './RedisPubSub.types'
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'
import EventEmitter from 'events'

export default class RedisPubSub extends EventEmitter {
  public readonly options: RedisPubSubOptions
  public readonly instanceId = uuidV4()
  public readonly pubClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  public readonly subClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>

  private isPubMine = false

  public constructor(options?: RedisPubSubOptions) {
    super()
    this.options = { ignoreSelfPublications: true, ...options }
    this.isPubMine = !this.options.client
    this.pubClient = this.isPubMine ? createClient(this.options) : this.options.client
    this.subClient = this.pubClient.duplicate()
  }

  public async connect(): Promise<void> {
    if (this.isPubMine) await this.pubClient.connect()
    await this.subClient.connect()
  }

  public async disconnect(): Promise<void> {
    if (this.isPubMine) await this.pubClient.disconnect()
    await this.subClient.disconnect()
  }

  public async psubscribe(patterns: string | string[]): Promise<void> {
    const finalPatterns = [].concat(patterns)
    return await this.subClient.pSubscribe(finalPatterns, (serialized: string, channel: string): void => {
      const message: RedisMessage = JSON.parse(serialized)

      if (!this.options.ignoreSelfPublications || message.publisherId !== this.instanceId) {
        this.emit(channel, message)
        finalPatterns.forEach((pattern: string): void => {
          if (pattern != channel) this.emit(pattern, message)
        })
      }
    })
  }

  public async subscribe(channels: string | string[]): Promise<void> {
    return await this.subClient.subscribe(channels, (serialized: string, channel: string): void => {
      const message: RedisMessage = JSON.parse(serialized)

      if (!this.options.ignoreSelfPublications || message.publisherId !== this.instanceId) this.emit(channel, message)
    })
  }

  public async publish(channel: string, payload: Record<string, any>): Promise<void> {
    const message: RedisMessage = {
      payload,
      channel,
      publisher: this.options.identifier || 'redis',
      publisherId: this.instanceId,
      processId: process.pid
    }

    await this.pubClient.publish(channel, JSON.stringify(message))
  }
}
