# minestat-es

[![Package Version](https://badge.fury.io/js/minestat-es.svg?)](https://www.npmjs.com/package/minestat-es)
[![Code Coverage](https://codecov.io/gh/ayan4m1/minestat-es/branch/main/graph/badge.svg?token=UKTTU7XNAM)](https://codecov.io/gh/ayan4m1/minestat-es)

## features

- Written in TypeScript
- Less than 5kB of code
- No runtime dependencies
- Supports ESM and CommonJS
- Comprehensive unit tests

## requirements

- Node 18+

## usage

This library supports two methods of querying the server. The _legacy_ protocol works with any Minecraft server. The _modern_ protocol is only compatible with Minecraft v1.6 and higher.

### by address/port

To query a Minecraft server using an IP/hostname and a port, use:

```ts
fetchServerInfo({
  address: '1.2.3.4',
  port: 25565,
  timeout: 1000
});
```

### by hostname

To perform an SRV record lookup and query a Minecraft server using only a hostname, use:

```ts
// makes an SRV lookup for _minecraft._tcp.example.com
fetchServerInfo({
  hostname: 'example.com',
  timeout: 1000
});
```

Regardless of which way it was invoked, `fetchServerInfo` returns a promise which will resolve with an object containing the following properties:

| Key    | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| online | `boolean` | Whether the server is online or not |

If the server is offline, the object will also contain the properties:

| Key   | Type    | Description                                           |
| ----- | ------- | ----------------------------------------------------- |
| error | `Error` | A communications or validation error, if one occurred |

If the server is online, the object will also contain the following properties:

| Key        | Type     | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| version    | `string` | The server's version string                       |
| motd       | `string` | The server's Message of the Day                   |
| players    | `number` | The number of players on the server               |
| maxPlayers | `number` | The maximum number of players the server supports |

`fetchServerInfo` rejects if an error occurs during SRV record resolution.

## example

```ts
import { fetchServerInfo } from 'minestat-es';

(async () => {
  try {
    // query by hostname (SRV lookup)
    // _minecraft._tcp. will be prepended unless you supply it
    const { online, error, players } = await fetchServerInfo({
      hostname: 'mc.example.com'
    });

    // OR

    // query by address/port
    const { online, error, players } = await fetchServerInfo({
      address: 'example.com', // could also be an IP address
      port: 25565
    });

    // interpret the results
    console.log(`Server is ${online ? 'Online' : 'Offline'}`);
    if (online) {
      console.log(`There are ${players} player(s) online.`);
    } else if (error) {
      // either the SRV record failed to resolve, a socket error occurred,
      // or the response from the server was invalid
      console.error(error);
    }
  } catch (error) {
    // an unexpected error occurred
    console.error(error);
  }
})();
```
