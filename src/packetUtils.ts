import varint from 'varint';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encode: varintEncode, encodingLength: varintEncodingLength } = varint;

export const createPacket = (id: number, payload: Buffer): Buffer =>
  Buffer.concat([
    Buffer.from(varintEncode(encodingLength(id) + payload.length)),
    Buffer.from(varintEncode(id)),
    payload
  ]);

export const encode = varintEncode;

export const encodingLength = varintEncodingLength;

export const padData = (data: Buffer): Buffer => {
  const skipBytes = encodingLength(data.length) * 2 + 1;
  const padded = Buffer.alloc(data.byteLength + skipBytes);
  data.copy(padded, skipBytes);

  return padded;
};
