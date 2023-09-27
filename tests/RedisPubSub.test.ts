import { RedisPubSub } from '../src'

let redisPubSubA: RedisPubSub
let redisPubSubB: RedisPubSub

afterEach(async (): Promise<void> => {
  await redisPubSubA.disconnect()
  await redisPubSubB.disconnect()
})

describe(RedisPubSub, (): void => {
  it('Publish and receives messages that are not being published by the same instance', async (): Promise<void> => {
    redisPubSubA = new RedisPubSub()
    redisPubSubB = new RedisPubSub()

    const receiverA = jest.fn()
    const receiverB = jest.fn()

    await redisPubSubA.connect()
    await redisPubSubB.connect()

    await redisPubSubA.psubscribe('channel*')

    await redisPubSubB.subscribe('channel1')
    await redisPubSubB.subscribe('channel2')

    redisPubSubA.on('channel1', receiverA)
    redisPubSubA.on('channel2', receiverA)
    redisPubSubA.on('channel3', receiverA)

    redisPubSubB.on('channel1', receiverB)
    redisPubSubB.on('channel2', receiverB)
    redisPubSubB.on('channel3', receiverB)

    await redisPubSubA.publish('channel1', { message: 'Hi 1 from A' })
    await redisPubSubA.publish('channel2', { message: 'Hi 2 from A' })
    await redisPubSubA.publish('channel3', { message: 'Hi 3 from A' })

    await redisPubSubB.publish('channel1', { message: 'Hi 1 from B' })
    await redisPubSubB.publish('channel2', { message: 'Hi 2 from B' })
    await redisPubSubB.publish('channel3', { message: 'Hi 3 from B' })

    expect(receiverA.mock.calls).toEqual([
      [{ payload: { message: 'Hi 1 from B' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from B' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 3 from B' }, channel: 'channel3', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
    expect(receiverB.mock.calls).toEqual([
      [{ payload: { message: 'Hi 1 from A' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from A' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }]
    ])
  })

  it('Publish and receives all messages even the ones from the same instance', async (): Promise<void> => {
    redisPubSubA = new RedisPubSub({ ignoreSelfPublications: false })
    redisPubSubB = new RedisPubSub({ ignoreSelfPublications: false })

    const receiverA = jest.fn()
    const receiverB = jest.fn()

    await redisPubSubA.connect()
    await redisPubSubB.connect()

    await redisPubSubA.psubscribe('channel*')
    await redisPubSubB.subscribe('channel1')
    await redisPubSubB.subscribe('channel2')

    redisPubSubA.on('channel1', receiverA)
    redisPubSubB.on('channel1', receiverB)
    redisPubSubA.on('channel2', receiverA)
    redisPubSubB.on('channel2', receiverB)
    redisPubSubA.on('channel3', receiverA)
    redisPubSubB.on('channel3', receiverB)

    await redisPubSubA.publish('channel1', { message: 'Hi 1 from A' })
    await redisPubSubB.publish('channel1', { message: 'Hi 1 from B' })
    await redisPubSubA.publish('channel2', { message: 'Hi 2 from A' })
    await redisPubSubB.publish('channel2', { message: 'Hi 2 from B' })
    await redisPubSubA.publish('channel3', { message: 'Hi 3 from A' })
    await redisPubSubB.publish('channel3', { message: 'Hi 3 from B' })

    expect(receiverA.mock.calls).toEqual([
      [{ payload: { message: 'Hi 1 from A' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 1 from B' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from A' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from B' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 3 from A' }, channel: 'channel3', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 3 from B' }, channel: 'channel3', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
    expect(receiverB.mock.calls).toEqual([
      [{ payload: { message: 'Hi 1 from A' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 1 from B' }, channel: 'channel1', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from A' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubA.instanceId, processId: expect.any(Number) }],
      [{ payload: { message: 'Hi 2 from B' }, channel: 'channel2', publisher: 'redis', publisherId: redisPubSubB.instanceId, processId: expect.any(Number) }]
    ])
  })
})
