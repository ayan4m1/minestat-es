import varint from 'varint';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encode, encodingLength } = varint;

/**
 * Static utility methods for creating Minecraft packets
 */
export class PacketUtils {
  /**
   * Creates a packet with the specified Packet ID and payload.
   *
   * @param id An integer Packet ID as defined by the MC spec
   * @param payload A Buffer containing the packet data
   * @returns A Buffer containing the packet ID and payload wrapped as a Minecraft packet
   */
  public static createPacket(id: number, payload: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(encode(encodingLength(id) + payload.length)),
      Buffer.from(encode(id)),
      payload
    ]);
  }

  /**
   * Encodes a number into a VarInt byte array.
   *
   * @param num Number to encode
   * @param buffer Buffer to use, if specified
   * @param offset Offset in buffer, if specified
   * @returns Byte array representing "num" as a VarInt
   */
  public static encode(num: number, buffer?: number[], offset?: number) {
    return encode(num, buffer, offset);
  }

  /**
   * Get the byte length of a given number stored as a VarInt.
   *
   * @param num Number to check length of
   * @returns Length in bytes
   */
  public static encodingLength(num: number) {
    return encodingLength(num);
  }
}
