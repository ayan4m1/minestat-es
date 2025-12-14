import { connect } from 'net';
import { hrtime } from 'process';

import { QueryProtocol } from './protocol';
import { LegacyQueryProtocol } from './legacyProtocol';
import { ModernQueryProtocol } from './modernProtocol';
import { AddressOpts, QueryProtocols, ServerInfo } from './types';
import { getPingMs } from './utils';

/**
 * Open a TCP socket to query Minecraft server status.
 *
 * @param address An FQDN or IP address.
 * @param port A TCP port number.
 * @param timeout Connection timeout in milliseconds.
 * @returns Server information.
 */
export async function fetchServerInfo(
  options: AddressOpts
): Promise<ServerInfo> {
  let address: string = null,
    port: number = null;

  // obtain address/port from DNS if required
  const addrOptions = options as AddressOpts;

  address = addrOptions.address;
  port = addrOptions.port;

  // fill in default timeout of 5 seconds
  if (!options.timeout) {
    options.timeout = 5000;
  }

  // fill in default protocol type
  if (!options.protocol) {
    options.protocol = QueryProtocols.Legacy;
  }

  return new Promise((resolve, reject) => {
    // guard against any exceptions that might occur
    try {
      let protocol: QueryProtocol = null,
        startTime: [number, number] = [0, 0],
        serverInfo: ServerInfo = null;

      // instantiate appropriate protocol handler
      switch (options.protocol) {
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
      client.setTimeout(options.timeout, () => {
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
        } else if (options.ping) {
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
}

export { QueryProtocols, ServerInfo };
