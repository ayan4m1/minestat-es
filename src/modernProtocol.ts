import varint from 'varint';

import { QueryProtocol } from './protocol';
import { Description, ModernServerResponse, ServerInfo } from './types';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encode, encodingLength } = varint;

const protocolVersion = 757;

export const buildMotd = (
  description: Description,
  previous: string = ''
): string => {
  if (description.extra?.length) {
    previous += description.extra
      .map((innerDesc) => buildMotd(innerDesc, ''))
      .join('');
  }

  previous += description.text;

  return previous;
};

export class ModernQueryProtocol implements QueryProtocol {
  handshakePacket(address: string, port: number): Buffer {
    const portBuffer = Buffer.alloc(2);

    portBuffer.writeUInt16BE(port);

    const handshake = this.createPacket(
      0,
      Buffer.concat([
        Buffer.from(encode(protocolVersion)),
        Buffer.from(encode(address.length)),
        Buffer.from(address),
        portBuffer,
        Buffer.from(encode(1))
      ])
    );
    const request = this.createPacket(0, Buffer.alloc(0));

    return Buffer.concat([handshake, request]);
  }

  parse(response?: Buffer): ServerInfo {
    if (!response?.length) {
      return {
        online: false,
        error: new Error('Got empty reply from Minecraft server!')
      };
    }

    const payload = response.subarray(encodingLength(response.length) * 2 + 1);

    try {
      const result = JSON.parse(
        payload.toString('utf-8')
      ) as unknown as ModernServerResponse;

      return {
        online: true,
        players: result.players.online,
        maxPlayers: result.players.max,
        version: result.version.name,
        motd: buildMotd(result.description)
      };
    } catch (error) {
      return {
        online: false,
        error
      };
    }
  }

  createPacket(id: number, payload: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(encode(encodingLength(id) + payload.length)),
      Buffer.from(encode(id)),
      payload
    ]);
  }
}
