import { connect } from 'net';
import { promises as dns, SrvRecord } from 'dns';

const queryBytes = Buffer.from([0xfe, 0x01]);

function stripString(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u0000/g, '');
}

export interface ServerInfo {
  online: boolean;
  version?: string;
  motd?: string;
  players?: number;
  maxPlayers?: number;
}

export async function resolveSrvRecord(hostname: string): Promise<SrvRecord> {
  const records = await dns.resolveSrv(hostname);

  if (!records.length) {
    return null;
  }

  const record = records[Math.floor(Math.random() * records.length)];

  return record;
}

export async function fetchServerInfo(
  address: string,
  port: number,
  timeout = 5000
): Promise<ServerInfo> {
  return new Promise((resolve, reject) => {
    try {
      const resolveOffline = () => resolve({ online: false });
      const client = connect(port, address, () => {
        client.write(queryBytes);
      });

      client.setTimeout(timeout, () => {
        client.end();
        resolveOffline();
      });
      client.on('error', (error) => {
        client.end();
        reject(error);
      });
      client.on('data', (raw) => {
        client.end();

        if (raw === null || raw.length === 0) {
          return resolveOffline();
        }

        const info = raw.toString().split('\x00\x00\x00');

        if (info.length < 6) {
          return reject(new Error('Got invalid reply from Minecraft server!'));
        }

        const version = stripString(info[2]);
        const motd = stripString(info[3]);
        const players = parseInt(stripString(info[4]), 10);
        const maxPlayers = parseInt(stripString(info[5]), 10);

        if (isNaN(players) || isNaN(maxPlayers)) {
          return reject(new Error('Failed to parse player count numbers!'));
        }

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
