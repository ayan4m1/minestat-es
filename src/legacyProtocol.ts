import { ServerInfo } from './types';
import { QueryProtocol } from './protocol';

/**
 * These two bytes will cause the server to send a reply.
 */
export const queryBytes = Buffer.from([0xfe, 0x01]);

export class LegacyQueryProtocol implements QueryProtocol {
  handshakePacket(): Buffer {
    return queryBytes;
  }

  parse(response?: Buffer): ServerInfo {
    // empty response can indicate a server that is still starting up
    if (!response?.length) {
      return {
        online: false,
        error: new Error('Got empty reply from Minecraft server!')
      };
    }

    if (response[0] !== 0xff) {
      return {
        online: false,
        error: new Error('Got invalid reply from Minecraft server!')
      };
    }

    // read reply length
    const bufferSize = response.readInt16BE(1);

    if (bufferSize < 0 || bufferSize > response.byteLength) {
      return {
        online: false,
        error: new Error('Got invalid reply from Minecraft server!')
      };
    }

    // allocate, copy, and swap byte order
    const buffer = Buffer.alloc(bufferSize * 2, 0, 'binary');
    response.copy(buffer, 0, 3);
    buffer.swap16();

    // decode into utf-16 tokens
    const info = buffer.toString('utf-16le').split('\x00');

    if (info.length < 6) {
      return {
        online: false,
        error: new Error('Got short reply from Minecraft server!')
      };
    }

    // attempt to parse data from server
    const version = info[2];
    const motd = info[3];
    const players = parseInt(info[4], 10);
    const maxPlayers = parseInt(info[5], 10);

    // validate player count parsing
    if (isNaN(players) || isNaN(maxPlayers)) {
      return {
        online: false,
        error: new Error('Failed to parse player count numbers!')
      };
    }

    // return server info
    return {
      online: true,
      version,
      motd,
      players,
      maxPlayers
    };
  }
}
