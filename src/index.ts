import { connect } from 'net';
import { promises as dns } from 'dns';

import { QueryProtocol } from './protocol';
import { LegacyQueryProtocol } from './legacyProtocol';
import { ModernQueryProtocol } from './modernProtocol';
import { AddressOpts, HostnameOpts, QueryProtocols, ServerInfo } from './types';

const prefixWith = (base: string, prefix: string): string =>
  `${base.startsWith(prefix) ? '' : prefix}${base}`;

/**
 * Open a TCP socket to query Minecraft server status.
 *
 * @param address An FQDN or IP address.
 * @param port A TCP port number.
 * @param timeout Connection timeout in milliseconds.
 * @returns Server information.
 */
export async function fetchServerInfo(
  options: HostnameOpts | AddressOpts
): Promise<ServerInfo> {
  let address: string = null,
    port: number = null;

  // obtain address/port from DNS if required
  if ('hostname' in options) {
    const hostOptions = options as HostnameOpts;
    const mcHost = prefixWith(hostOptions.hostname, '_minecraft._tcp.');
    const records = await dns.resolveSrv(mcHost);

    if (!records.length) {
      throw new Error(`No DNS records found for hostname ${mcHost}`);
    }

    const record = records[Math.floor(Math.random() * records.length)];

    address = record.name;
    port = record.port;
  } else {
    const addrOptions = options as AddressOpts;

    address = addrOptions.address;
    port = addrOptions.port;
  }

  // fill in default timeout of 5 seconds
  if (!options.timeout) {
    options.timeout = 5000;
  }

  if (!options.protocol) {
    options.protocol = QueryProtocols.Legacy;
  }

  return new Promise((resolve, reject) => {
    // guard against any exceptions that might occur
    try {
      let protocol: QueryProtocol = null;

      switch (options.protocol) {
        case QueryProtocols.Legacy:
          protocol = new LegacyQueryProtocol();
          break;
        case QueryProtocols.Modern:
          protocol = new ModernQueryProtocol();
          break;
      }

      const resolveOffline = (error?: Error) =>
        resolve({ online: false, error });
      const client = connect(port, address, () => {
        client.write(protocol.handshakePacket(address, port));
      });

      client.setTimeout(options.timeout, () => {
        client.end();
        resolveOffline();
      });
      client.on('error', (error) => {
        client.end();
        resolveOffline(error);
      });
      client.on('data', (raw) => {
        client.end();

        resolve(protocol.parse(raw));
      });
    } catch (error) {
      reject(error);
    }
  });
}
