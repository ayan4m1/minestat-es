import varint from 'varint';

// eslint-disable-next-line import-x/no-named-as-default-member
const { encodingLength } = varint;

export const padData = (data: Buffer): Buffer => {
  const skipBytes = encodingLength(data.length) * 2 + 1;
  const padded = Buffer.alloc(data.byteLength + skipBytes);
  data.copy(padded, skipBytes);

  return padded;
};
