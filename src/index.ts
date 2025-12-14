import { promises as dns } from 'dns';

import { getResolver, prefixWith } from './utils';
import { AddressOpts, HostnameOpts, QueryProtocols, ServerInfo } from './types';

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

  return getResolver(
    address,
    port,
    options.protocol,
    options.timeout,
    options.ping
  );
}

export { QueryProtocols, ServerInfo };
