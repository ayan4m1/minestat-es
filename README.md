# minestat-es

Get the status of any Minecraft server from JavaScript.

[![Package Version](https://badge.fury.io/js/minestat-es.svg?2)](https://www.npmjs.com/package/minestat-es)
[![Code Coverage](https://codecov.io/gh/ayan4m1/minestat-es/branch/main/graph/badge.svg?token=UKTTU7XNAM)](https://codecov.io/gh/ayan4m1/minestat-es)

![Build Status](https://img.shields.io/github/actions/workflow/status/ayan4m1/minestat-es/publish.yml)
![Node Support](https://img.shields.io/node/v/minestat-es.svg?2)
![Last Build](https://img.shields.io/npm/last-update/minestat-es)

## features

- Written in TypeScript
- Less than 6kB of code
- One runtime dependency
- Supports ESM and CommonJS
- Comprehensive unit tests

## requirements

- Node 22+

## usage

**NOTE**: This library does not support the browser. Polyfills are available for [net](https://www.npmjs.com/package/net-browserify) and [process.hrtime()](https://github.com/kumavis/browser-process-hrtime), but not for `dns`.

### by address/port

To query a Minecraft server using an IP/hostname and a port, use:

```ts
import { fetchServerInfo } from 'minestat-es';

fetchServerInfo({
  address: '1.2.3.4',
  port: 25565,
  timeout: 1000
});
```

### by hostname

To perform an SRV record lookup and query a Minecraft server using only a hostname, use:

```ts
import { fetchServerInfo } from 'minestat-es';

// makes an SRV lookup for _minecraft._tcp.example.com
fetchServerInfo({
  hostname: 'example.com',
  timeout: 1000
});
```

### query protocols

This library supports two methods of querying the server. The _legacy_ protocol works with any Minecraft server. The _modern_ protocol is only compatible with Minecraft v1.6 and higher. The **default** protocol is the legacy protocol.

To specify the modern protocol, pass it as the `protocol` option:

```ts
import { fetchServerInfo, QueryProtocols } from 'minestat-es';

fetchServerInfo({
  hostname: 'example.com',
  protocol: QueryProtocols.Modern
});
```

### ping

This library can optionally return the ping time in milliseconds. This is defined as the time between sending the ping packet and receiving a response. Pinging is possible for both legacy and modern query protocols.

```ts
import { fetchServerInfo } from 'minestat-es';

fetchServerInfo({
  hostname: 'example.com',
  ping: true
});
```

Regardless of the way it was invoked, `fetchServerInfo` returns a promise which will resolve with an object containing the following properties:

| Key    | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| online | `boolean` | Whether the server is online or not |

If the server is offline, the object will also contain the properties:

| Key   | Type    | Description                                           |
| ----- | ------- | ----------------------------------------------------- |
| error | `Error` | A communications or validation error, if one occurred |

If the server is online, the object will also contain the following properties:

| Key        | Type       | Description                                                             |
| ---------- | ---------- | ----------------------------------------------------------------------- |
| version    | `string`   | The server's version string                                             |
| motd       | `string`   | The server's Message of the Day                                         |
| players    | `number`   | The number of players on the server                                     |
| maxPlayers | `number`   | The maximum number of players the server supports                       |
| playerInfo | `object[]` | An aray of { id, name } objects for each connected player               |
| pingMs     | `number`   | The number of milliseconds between sending and receiving a ping packet. |

**NOTE**: playerInfo is only populated when using the modern query protocol and the server chooses to send it.

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
