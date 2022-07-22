import { connect } from 'net';

// eslint-disable-next-line no-control-regex
const stripString = (str) => str.replace(/\u0000/g, '');

export const fetchServerInfo = (address, port, timeout = 5000) =>
  new Promise((resolve, reject) => {
    try {
      const resolveOffline = () => resolve({ offline: false });
      const client = connect(port, address, () => {
        client.write(Buffer.from([0xfe, 0x01]));
      });

      client.setTimeout(timeout);
      client.on('error', reject);
      client.on('timeout', () => {
        client.end();
        resolveOffline();
      });
      client.on('data', (raw) => {
        client.end();

        if (raw === null || raw === '') {
          return resolveOffline();
        }

        const info = raw.toString().split('\x00\x00\x00');
        const version = stripString(info[2]);
        const motd = stripString(info[3]);
        const players = parseInt(stripString(info[4]), 10);
        const maxPlayers = parseInt(stripString(info[5]), 10);

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
