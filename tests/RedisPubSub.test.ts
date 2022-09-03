import { RedisPubSub } from '../src'

let redisPubSubA: RedisPubSub
let redisPubSubB: RedisPubSub

afterEach(async (): Promise<void> => {
  await redisPubSubA.disconnect()
  await redisPubSubB.disconnect()
})

describe('RedisPubSub', (): void => {
  it('Publish and receives messages that are not being published by the same instance', async (): Promise<void> => {
    redisPubSubA = new RedisPubSub()
    redisPubSubB = new RedisPubSub()

    const receiverA = jest.fn()
    const receiverB = jest.fn()

    await redisPubSubA.connect()
    await redisPubSubB.connect()

    await redisPubSubA.psubscribe('channel*')
    await redisPubSubB.subscribe('channelA')
    await redisPubSubB.subscribe('channelB')

    redisPubSubA.on('channelA', receiverA)
    redisPubSubB.on('channelA', receiverB)
    redisPubSubA.on('channelB', receiverA)
    redisPubSubB.on('channelB', receiverB)
    redisPubSubA.on('channelC', receiverA)
    redisPubSubB.on('channelC', receiverB)

    await redisPubSubA.publish('channelA', { message: 'Hi A from A' })
    await redisPubSubB.publish('channelA', { message: 'Hi A from B' })
    await redisPubSubA.publish('channelB', { message: 'Hi B from A' })
    await redisPubSubB.publish('channelB', { message: 'Hi B from B' })
    await redisPubSubA.publish('channelC', { message: 'Hi C from A' })
    await redisPubSubB.publish('channelC', { message: 'Hi C from B' })

    expect(receiverA.mock.calls).toEqual([
      [{ payload: { message: 'Hi A from B' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from B' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi C from B' }, channel: 'channelC', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
    expect(receiverB.mock.calls).toEqual([
      [{ payload: { message: 'Hi A from A' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from A' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }]
    ])
  })

  it('Publish and receives all messages eben the ones from the same instance', async (): Promise<void> => {
    redisPubSubA = new RedisPubSub({ ignoreSelfPublications: false })
    redisPubSubB = new RedisPubSub({ ignoreSelfPublications: false })

    const receiverA = jest.fn()
    const receiverB = jest.fn()

    await redisPubSubA.connect()
    await redisPubSubB.connect()

    await redisPubSubA.psubscribe('channel*')
    await redisPubSubB.subscribe('channelA')
    await redisPubSubB.subscribe('channelB')

    redisPubSubA.on('channelA', receiverA)
    redisPubSubB.on('channelA', receiverB)
    redisPubSubA.on('channelB', receiverA)
    redisPubSubB.on('channelB', receiverB)
    redisPubSubA.on('channelC', receiverA)
    redisPubSubB.on('channelC', receiverB)

    await redisPubSubA.publish('channelA', { message: 'Hi A from A' })
    await redisPubSubB.publish('channelA', { message: 'Hi A from B' })
    await redisPubSubA.publish('channelB', { message: 'Hi B from A' })
    await redisPubSubB.publish('channelB', { message: 'Hi B from B' })
    await redisPubSubA.publish('channelC', { message: 'Hi C from A' })
    await redisPubSubB.publish('channelC', { message: 'Hi C from B' })

    expect(receiverA.mock.calls).toEqual([
      [{ payload: { message: 'Hi A from A' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi A from B' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from A' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from B' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi C from A' }, channel: 'channelC', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi C from B' }, channel: 'channelC', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
    expect(receiverB.mock.calls).toEqual([
      [{ payload: { message: 'Hi A from A' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi A from B' }, channel: 'channelA', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from A' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi B from B' }, channel: 'channelB', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
  })
})
