import { QueryProtocol } from './protocol';
import { PacketUtils } from './packetUtils';
import { Description, ModernServerResponse, ServerInfo } from './types';

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

    const handshake = PacketUtils.createPacket(
      0,
      Buffer.concat([
        Buffer.from(PacketUtils.encode(protocolVersion)),
        Buffer.from(PacketUtils.encode(address.length)),
        Buffer.from(address),
        portBuffer,
        Buffer.from(PacketUtils.encode(1))
      ])
    );
    const request = PacketUtils.createPacket(0, Buffer.alloc(0));

    return Buffer.concat([handshake, request]);
  }

  pingPacket(): Buffer {
    const pingBuffer = Buffer.alloc(8);

    // value supplied to server does not matter
    pingBuffer.writeUint32BE(0);

    return PacketUtils.createPacket(1, pingBuffer);
  }

  parse(response?: Buffer): ServerInfo {
    if (!response?.length) {
      return {
        online: false,
        error: new Error('Got empty reply from Minecraft server!')
      };
    }

    const payload = response.subarray(
      PacketUtils.encodingLength(response.length) * 2 + 1
    );

    try {
      const result = JSON.parse(
        payload.toString('utf-8')
      ) as unknown as ModernServerResponse;

      return {
        online: true,
        players: result.players.online,
        maxPlayers: result.players.max,
        version: result.version.name,
        motd: buildMotd(result.description),
        playerInfo: result.players.sample
      };
    } catch (error) {
      return {
        online: false,
        error
      };
    }
  }
}
