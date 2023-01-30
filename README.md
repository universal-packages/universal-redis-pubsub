# Redis Pubsub

[![npm version](https://badge.fury.io/js/@universal-packages%2Fredis-pubsub.svg)](https://www.npmjs.com/package/@universal-packages/redis-pubsub)
[![Testing](https://github.com/universal-packages/universal-redis-pubsub/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-redis-pubsub/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-redis-pubsub/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-redis-pubsub)

Redis identifiable messages pubsub system for [redis](https://github.com/redis/node-redis). This is useful to communicate between processes or even between servers or containers. You can already do this with just [redis](https://github.com/redis/node-redis) pub sub system but this package enhance that a little, for example you can subscribe to a channel but ignore messages if they are being published by itself, also it is being shared some useful metadata with every message so you can act more robustly with each message.

## Install

```shell
npm install @universal-packages/redis-pubsub
npm install redis
```

## RedisPubSub

An instance of `RedisPubSub` allows you to start publishing messages to any channel and any other `RedisPubSub` instance connected to the same redis server will be able to receive them if they are subcribed.

```js
import { RedisPubSub } from '@universal-packages/universal-redis-pubsub'

const redisPubSub = new RedisPubSub({ identifier: 'app' })
await redisPubSub.connect()
await redisPubSub.publish('job', { make: 'sandwich' })

redisPubSub.on('job-done', (message) => {
  console.log('thanks')
})

/// In other process
const redisPubSub = new RedisPubSub({ identifier: 'job-processor' })
await redisPubSub.connect()
await redisPubSub.subscribe('job')

redisPubSub.on('job', (message) => {
  const id = makeSandwich()
  redisPubSub.publish('job-done', { sandwichId: id })
})
```

### Options

`RedisPubSub` takes the same [options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) as the redis client.

Additionally takes the following ones:

- **`client`** `RedisClient`
  If you already have a client working in your app you can pass the instance here to not connect another client inside the `RedisPubSub` instance only a new subscription instance will be handled inside.
- **`identifier`** `String`
  This can be used to identify who is sending messages to other instances, we do not want unsolicited publishing.
- **`ignoreSelfPublications`** `Boolean` `default: true`
  Normally you don't want your current process to hear the same messages it is publishing but in case you want that for some reason set this to `false`.

### Instance methods

#### **`connect()`**

Connect the internal subscriptions client and the publish client in case it was not passed as option.

#### **`disconnect()`**

Disconnect the internal subscriptions client and the publish client in case it was not passed as option.

#### **`psubscribe(channel: string)`**

Subscribe the instance to a patter of channels, it will then emit to that pattern and to the exact channel for that a message was published.

```js
await redisPubSub.psubscribe('channel*')

redisPubSub.on('channel*', (message) => {
  // All publishing to any channel like 'channelA', 'channelB'
})

redisPubSub.on('channelA', (message) => {
  // It also matches channel* but will just receive channelA messages
})
```

#### **`subscribe(channel: string)`**

Subscribe the instance to specific channel or channels.

```js
await redisPubSub.subscribe('channelA')

redisPubSub.on('channel*', (message) => {
  // Not triggered
})

redisPubSub.on('channelA', (message) => {
  // It matches channelA so it will receive it
})
```

#### **`publish(channel: string, data: Object)`**

Publish to the specific channel.

```js
await redisPubSub.publish('channelA', { data: 'things to share to channel A' })
```

## Typescript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
