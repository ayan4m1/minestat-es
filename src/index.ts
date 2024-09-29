import { connect } from 'net';
import { promises as dns } from 'dns';

/**
 * These two bytes will cause the server to send a reply.
 */
const queryBytes = Buffer.from([0xfe, 0x01]);

/**
 * Remove empty Unicode characters from a string.
 *
 * @param str Input string.
 * @returns String with Unicode characters removed.
 */
function stripString(str: string): string {
  return str.replace(/\u0000/g, '');
}

/**
 * Contains an `online` boolean plus the server reply data.
 */
export interface ServerInfo {
  online: boolean;
  error?: Error;
  version?: string;
  motd?: string;
  players?: number;
  maxPlayers?: number;
}

export interface CommonArgs {
  timeout?: number;
}

export interface HostnameArgs extends CommonArgs {
  hostname: string;
}

export interface AddressArgs extends CommonArgs {
  address: string;
  port: number;
}

/**
 * Open a TCP socket to query Minecraft server status.
 *
 * @param address An FQDN or IP address.
 * @param port A TCP port number.
 * @param timeout Connection timeout in milliseconds.
 * @returns Server information.
 */
export async function fetchServerInfo(
  options: HostnameArgs | AddressArgs
): Promise<ServerInfo> {
  let address: string = null,
    port: number = null;

  // obtain address/port from DNS if required
  if ('hostname' in options) {
    const hostOptions = options as HostnameArgs;
    const mcHost = `${hostOptions.hostname.startsWith('_minecraft._tcp.') ? '' : '_minecraft._tcp.'}${hostOptions.hostname}`;
    const records = await dns.resolveSrv(mcHost);

    if (!records.length) {
      throw new Error(`No DNS records found for hostname ${mcHost}`);
    }

    const record = records[Math.floor(Math.random() * records.length)];

    address = record.name;
    port = record.port;
  } else {
    const addrOptions = options as AddressArgs;

    address = addrOptions.address;
    port = addrOptions.port;
  }

  // fill in default timeout of 5 seconds
  if (!options.timeout) {
    options.timeout = 5000;
  }

  // perform socket connect/write/read/end
  return new Promise((resolve, reject) => {
    // guard against any exceptions that might occur
    try {
      const resolveOffline = (error?: Error) =>
        resolve({ online: false, error });
      const client = connect(port, address, () => {
        client.write(queryBytes);
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

        // empty response can indicate a server that is still starting up
        if (raw === null || raw.length === 0) {
          return resolveOffline();
        }

        const info = raw.toString().split('\x00\x00\x00');

        // ensure required data is available
        if (info.length < 6) {
          return resolveOffline(
            new Error('Got invalid reply from Minecraft server!')
          );
        }

        // attempt to parse data from server
        const version = stripString(info[2]);
        const motd = stripString(info[3]);
        const players = parseInt(stripString(info[4]), 10);
        const maxPlayers = parseInt(stripString(info[5]), 10);

        // validate player count parsing
        if (isNaN(players) || isNaN(maxPlayers)) {
          return resolveOffline(
            new Error('Failed to parse player count numbers!')
          );
        }

        // return server info
        resolve({
          online: true,
          version,
          motd,
          players,
          maxPlayers
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}
