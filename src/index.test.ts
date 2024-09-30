import { promises as dns, SrvRecord } from 'dns';
import { connect, Socket } from 'net';

import { fetchServerInfo, ServerInfo } from './index';

// Mock the node modules we depend on
jest.mock('net', () => ({
  ...jest.requireActual('net'),
  connect: jest.fn(),
  Socket: jest.fn()
}));

jest.mock('dns', () => ({
  ...jest.requireActual('dns'),
  promises: {
    resolveSrv: jest.fn()
  }
}));

/**
 * Represents a function which takes a port, hostname, and callback
 * and returns a Socket.
 */
type ConnectMock = (
  port: number,
  hostname: string,
  fn?: CallableFunction
) => Socket;

/**
 * Creates a mocked Socket using the supplied method implementations.
 *
 * @param on Handler for .on()
 * @param end Handler for .end()
 * @param setTimeout Handler for .setTimeout()
 * @param write Handler for .write()
 * @returns A mock Socket instance
 */
const createMockSocket = (
  on: jest.Mock = jest.fn(),
  end: jest.Mock = jest.fn(),
  setTimeout: jest.Mock = jest.fn(),
  write: jest.Mock = jest.fn()
): Socket => {
  const result = new Socket();

  result.on = on;
  result.end = end;
  result.setTimeout = setTimeout;
  result.write = write;

  return result;
};

// Create mock functions for the node modules we depend on
const connectMock = connect as unknown as jest.MockedFunction<ConnectMock>;
const resolveMock = dns.resolveSrv as jest.MockedFunction<
  typeof dns.resolveSrv
>;

describe('minestat-es', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchServerInfo', () => {
    const hostname = 'example.com';
    const address = '1.2.3.4';
    const port = 25565;
    const offlineResult: ServerInfo = { online: false };
    const queryBytes = Buffer.from([0xfe, 0x01]);
    const validData = [
      Buffer.from([
        0xff, 0x00, 0x19, 0x00, 0xa7, 0x00, 0x31, 0x00, 0x00, 0x00, 0x34, 0x00,
        0x37, 0x00, 0x00, 0x00, 0x31, 0x00, 0x2e, 0x00, 0x34, 0x00, 0x2e, 0x00,
        0x32, 0x00, 0x00, 0x00, 0x41, 0x00, 0x20, 0x00, 0x53, 0x00, 0x65, 0x00,
        0x72, 0x00, 0x76, 0x00, 0x65, 0x00, 0x72, 0x00, 0x00, 0x00, 0x30, 0x00,
        0x00, 0x00, 0x32, 0x00, 0x30
      ]),
      Buffer.from([
        0xff, 0x00, 0x13, 0x00, 0xa7, 0x00, 0x31, 0x00, 0x00, 0x00, 0x31, 0x00,
        0x32, 0x00, 0x37, 0x00, 0x00, 0x00, 0x31, 0x00, 0x2e, 0x00, 0x31, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x33, 0x00, 0x00, 0x00, 0x32, 0x00, 0x30
      ])
    ];
    const invalidPlayerData = Buffer.from([
      0xff, 0x00, 0x23, 0x00, 0xa7, 0x00, 0x31, 0x00, 0x00, 0x00, 0x34, 0x00,
      0x37, 0x00, 0x00, 0x00, 0x31, 0x00, 0x2e, 0x00, 0x34, 0x00, 0x2e, 0x00,
      0x32, 0x00, 0x00, 0x00, 0x41, 0x00, 0x20, 0x00, 0x53, 0x00, 0x65, 0x00,
      0x72, 0x00, 0x76, 0x00, 0x65, 0x00, 0x72, 0x00, 0x00, 0x00, 0x30, 0x00,
      0x00, 0x00, 0x5a, 0x69
    ]);
    const emptyData = Buffer.from([]);
    const invalidData = [
      Buffer.from([0xff, 0x30, 0x00]),
      Buffer.from([0xfa, 0xbe, 0xef, 0xff, 0xff, 0xff, 0xff])
    ];
    const shortData = Buffer.from([0xff, 0x00, 0x00]);

    test('writes two bytes when connected', (done) => {
      const socket = createMockSocket();

      connectMock.mockImplementation(
        (
          mockPort: number,
          mockHost: string,
          mockFn?: CallableFunction
        ): Socket => {
          expect(mockPort).toBe(port);
          expect(mockHost).toBe(address);
          expect(mockFn).toBeInstanceOf(Function);

          setImmediate(() => {
            expect(socket.write).not.toHaveBeenCalled();

            if (mockFn) {
              mockFn();
            }

            expect(socket.write).toHaveBeenCalledWith(queryBytes);

            done();
          });

          return socket;
        }
      );

      expect.assertions(5);
      fetchServerInfo({ address, port });
    });
    test('unhandled error', async () => {
      expect.assertions(1);
      try {
        await fetchServerInfo({
          address,
          port
        });
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });
    test('socket timeout', async () => {
      const socket = createMockSocket(
        undefined,
        undefined,
        jest.fn().mockImplementation((time: number, fn: CallableFunction) => {
          expect(time).toBe(timeout);
          fn();
        })
      );
      const timeout = 500;

      connectMock.mockImplementation(() => socket);

      const result = await fetchServerInfo({
        address,
        port,
        timeout
      });

      expect.assertions(3);
      expect(socket.end).toHaveBeenCalled();
      expect(result).toEqual(offlineResult);
    });
    test('socket error', async () => {
      const expectedError = new Error('Something failed.');
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'error') {
                return;
              }

              callback(expectedError);
            }
          )
      );

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toEqual(expectedError);
    });
    test('empty reply from server', async () => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(emptyData);
            }
          )
      );
      const emptyData = Buffer.from([]);

      connectMock.mockImplementation(() => socket);

      const { online } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
    });
    test.each(invalidData)('invalid reply from server', async (data) => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(data);
            }
          )
      );
      const expectedError = new Error(
        'Got invalid reply from Minecraft server!'
      );

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toEqual(expectedError);
    });
    test('empty reply from socket', async () => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(null);
            }
          )
      );

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toBeUndefined();
    });
    test('empty reply from server', async () => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(emptyData);
            }
          )
      );

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toBeUndefined();
    });
    test('short reply from server', async () => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(shortData);
            }
          )
      );
      const expectedError = new Error('Got short reply from Minecraft server!');

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toEqual(expectedError);
    });
    test('invalid player count', async () => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(invalidPlayerData);
            }
          )
      );
      const expectedError = new Error('Failed to parse player count numbers!');

      connectMock.mockImplementation(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toEqual(expectedError);
    });
    test.each(validData)('valid reply from server', async (data) => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(data);
            }
          )
      );

      connectMock.mockImplementation(() => socket);

      const { online } = await fetchServerInfo({ address, port });

      expect(online).toBeTruthy();
    });
    test('resolveSrv throws error', async () => {
      const expectedError = new Error('Something failed.');

      resolveMock.mockImplementation(() => Promise.reject(expectedError));

      expect.assertions(1);
      try {
        await fetchServerInfo({ hostname });
      } catch (error) {
        expect(error).toBe(expectedError);
      }
    });
    test('no SRV records', async () => {
      const expectedError = new Error(
        `No DNS records found for hostname _minecraft._tcp.${hostname}`
      );
      const mockData: SrvRecord[] = [];

      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      expect.assertions(1);
      try {
        await fetchServerInfo({ hostname });
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
    });
    test('does not prepend _minecraft._tcp. to hostname if already present', async () => {
      const expectedError = new Error(
        `No DNS records found for hostname _minecraft._tcp.${hostname}`
      );
      const mockData: SrvRecord[] = [];

      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      expect.assertions(1);
      try {
        await fetchServerInfo({ hostname: `_minecraft._tcp.${hostname}` });
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
    });
    test.each(validData)('successful SRV lookup', async (data) => {
      const socket = createMockSocket(
        jest
          .fn()
          .mockImplementation(
            (eventName: string, callback: CallableFunction) => {
              if (eventName !== 'data') {
                return;
              }

              callback(data);
            }
          )
      );
      const mockData: SrvRecord[] = [
        { name: `_minecraft._tcp.${hostname}`, port, priority: 1, weight: 1 }
      ];

      connectMock.mockImplementation(() => socket);
      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      const { online } = await fetchServerInfo({ hostname });

      expect(online).toBeTruthy();
    });
  });
});
