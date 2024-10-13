import { readFileSync } from 'fs';

import { padData } from './index.test';
import { ModernServerResponse } from './types';
import { buildMotd, ModernQueryProtocol } from './modernProtocol';

const emptyData = [undefined, Buffer.from([])];
const validData = readFileSync('./test/valid.json');
const invalidData = [
  readFileSync('./test/invalid.json'),
  readFileSync('./test/empty.json')
];

describe('ModernQueryProtocol', () => {
  const address = '1.2.3.4';
  const port = 22565;
  const protocol = new ModernQueryProtocol();

  it('can generate a handshake packet', () => {
    const packet = protocol.handshakePacket(address, port);

    expect(packet).toBeTruthy();
    expect(packet.byteLength).toBeGreaterThan(0);
  });

  it('can parse a valid response', () => {
    const parsed = JSON.parse(
      validData.toString('utf-8')
    ) as unknown as ModernServerResponse;
    const { online, error, playerInfo } = protocol.parse(padData(validData));

    expect(online).toBeTruthy();
    expect(error).toBeFalsy();
    expect(playerInfo).toEqual(parsed.players.sample);
  });

  it.each(emptyData)('can handle an empty buffer', (data) => {
    const expectedError = new Error('Got empty reply from Minecraft server!');
    const { online, error } = protocol.parse(data);

    expect(online).toBeFalsy();
    expect(error).toEqual(expectedError);
  });

  it.each(invalidData)('can handle invalid data', (data) => {
    const { online, error } = protocol.parse(padData(data));

    expect(online).toBeFalsy();
    expect(error).toBeTruthy();
  });
});

describe('buildMotd', () => {
  it('can perform simple MOTD building', () => {
    const text = 'Hello World';

    expect(buildMotd({ text })).toEqual(text);
  });

  it('can perform simple recursion', () => {
    const desc = {
      extra: [
        {
          extra: [
            {
              extra: [
                {
                  text: '1'
                }
              ],
              text: '2'
            }
          ],
          text: '3'
        }
      ],
      text: '4'
    };

    expect(buildMotd(desc)).toEqual('1234');
  });
});
