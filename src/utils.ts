import { hrtime } from 'process';

import { QueryProtocol } from './protocol';
import { LegacyQueryProtocol } from './legacyProtocol';
import { ModernQueryProtocol } from './modernProtocol';
import { QueryProtocols, ServerInfo } from './types';
import { connect } from 'net';

export const prefixWith = (base: string, prefix: string): string =>
  `${base.startsWith(prefix) ? '' : prefix}${base}`;

export const getPingMs = (startTime: [number, number]): number => {
  const pingTime = hrtime(startTime);

  return pingTime[0] * 1e3 + pingTime[1] / 1e6;
};

export const getResolver = (
  address: string,
  port: number,
  queryProtocol: QueryProtocols = QueryProtocols.Legacy,
  timeout: number = 5000,
  ping: boolean = false
): Promise<ServerInfo> =>
  new Promise((resolve, reject) => {
    // guard against any exceptions that might occur
    try {
      let protocol: QueryProtocol = null,
        startTime: [number, number] = [0, 0],
        serverInfo: ServerInfo = null;

      // instantiate appropriate protocol handler
      switch (queryProtocol) {
        case QueryProtocols.Legacy:
          protocol = new LegacyQueryProtocol();
          break;
        case QueryProtocols.Modern:
          protocol = new ModernQueryProtocol();
      }

      const resolveOffline = (error?: Error) =>
        resolve({ online: false, error });
      const client = connect(port, address, () => {
        // start timing now if we are using legacy protocol
        if (protocol instanceof LegacyQueryProtocol) {
          startTime = hrtime();
        }

        // write the handshake packet
        client.write(protocol.handshakePacket(address, port));
      });

      // set client event handlers
      client.setTimeout(timeout, () => {
        client.end();
        resolveOffline();
      });
      client.on('error', (error) => {
        client.end();
        resolveOffline(error);
      });
      client.on('data', (raw) => {
        if (protocol instanceof LegacyQueryProtocol) {
          // if legacy protocol, we have ping and response already
          const pingMs = getPingMs(startTime);

          resolve({ ...protocol.parse(raw), pingMs });
        } else if (ping) {
          // if modern and pinging, we need to send the ping request packet
          if (!serverInfo) {
            serverInfo = protocol.parse(raw);
            startTime = hrtime();
            client.write(protocol.pingPacket(), () => {
              client.on('close', () => {
                const pingMs = getPingMs(startTime);

                client.end();
                resolve({ ...serverInfo, pingMs });
              });
            });
          } else {
            // we have received the ping response packet, return our result
            const pingMs = getPingMs(startTime);

            client.end();
            resolve({ ...serverInfo, pingMs });
          }
        } else {
          // modern protocol but no ping requested, parse response and return
          client.end();
          resolve(protocol.parse(raw));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
