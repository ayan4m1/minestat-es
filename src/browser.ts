import { getResolver } from './utils';
import { AddressOpts, QueryProtocols, ServerInfo } from './types';

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
  return getResolver(
    options.address,
    options.port,
    options.protocol,
    options.timeout,
    options.ping
  );
}

export { QueryProtocols, ServerInfo };
