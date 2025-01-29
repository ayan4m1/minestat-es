import varint from 'varint';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encode, encodingLength } = varint;

export class PacketUtils {
  public static createPacket(id: number, payload: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(encode(encodingLength(id) + payload.length)),
      Buffer.from(encode(id)),
      payload
    ]);
  }

  public static encode(num: number, buffer?: number[], offset?: number) {
    return encode(num, buffer, offset);
  }

  public static encodingLength(num: number) {
    return encodingLength(num);
  }
}
