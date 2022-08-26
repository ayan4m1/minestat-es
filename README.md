# minestat-es

![Package Version](https://badge.fury.io/js/minestat-es.svg)

## features

- Less than one kilobyte of code
- No runtime dependencies
- ESM support

## requirements

- Node 16+

## api

To query a Minecraft server, use `fetchServerInfo(address, port, timeout)`. It returns a promise which will resolve with an object containing the following properties:

| Key    | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| online | `boolean` | Whether the server is online or not |

If the server is online, the object will also contain the following properties:

| Key        | Type     | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| version    | `string` | The server's version string                       |
| motd       | `string` | The server's Message of the Day                   |
| players    | `number` | The number of players on the server               |
| maxPlayers | `number` | The maximum number of players the server supports |

The promise will reject if any error is encountered.

A utility method for performing SRV DNS lookups is provided. `resolveSrvRecord(hostname)` returns a promise which will resolve with an object containing the following properties:

| Key  | Type     | Description          |
| ---- | -------- | -------------------- |
| name | `string` | The server's address |
| port | `number` | The server's port    |

## usage

```js
import { fetchServerInfo } from 'minestat-es';

const execute = async () => {
  const { online, players } = await fetchServerInfo('1.2.3.4', 25565);

  console.log(`Server is ${online ? 'Online' : 'Offline'}`);

  if (online) {
    console.log(`There are ${players} player(s) online.`);
  }
};

execute();
```
