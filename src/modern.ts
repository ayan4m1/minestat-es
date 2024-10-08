import varint from 'varint';

import { ServerInfo } from './types';
import { QueryProtocol } from './protocol';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encode, encodingLength } = varint;

const protocolVersion = 757;

export class ModernQueryProtocol implements QueryProtocol {
  handshakePacket(address: string, port: number): Buffer {
    const portBuffer = Buffer.alloc(2);

    portBuffer.writeUInt16BE(port);

    const payload = Buffer.concat([
      Buffer.from(encode(protocolVersion)),
      Buffer.from(encode(address.length)),
      Buffer.from(address),
      portBuffer,
      Buffer.from(encode(1))
    ]);
    const handshake = this.createPacket(0, payload);
    const request = this.createPacket(0, Buffer.alloc(0));

    return Buffer.concat([handshake, request]);
  }

  parse(response: Buffer): ServerInfo {
    const payload = Uint8Array.prototype.slice.apply(response, [
      encodingLength(response.length) * 2 + 1
    ]);

    console.dir(JSON.parse(payload.toString()));

    return { online: false };
  }

  createPacket(id: number, payload: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(encode(encodingLength(id) + payload.length)),
      Buffer.from(encode(id)),
      payload
    ]);
  }
}
