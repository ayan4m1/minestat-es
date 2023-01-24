# minestat-es

[![Package Version](https://badge.fury.io/js/minestat-es.svg)](https://www.npmjs.com/package/minestat-es)
[![Code Coverage](https://codecov.io/gh/ayan4m1/minestat-es/branch/main/graph/badge.svg?token=UKTTU7XNAM)](https://codecov.io/gh/ayan4m1/minestat-es)

## features

- Written in TypeScript
- Less than 5kB of code
- No runtime dependencies
- Supports ESM and CommonJS
- Unit tests

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
import { fetchServerInfo, resolveSrvRecord } from 'minestat-es';

(async () => {
  const { name, port } = await resolveSrvRecord('some.minecraft.host');
  const { online, players } = await fetchServerInfo(name, port);

  console.log(`Server is ${online ? 'Online' : 'Offline'}`);

  if (online) {
    console.log(`There are ${players} player(s) online.`);
  }
})();
```
