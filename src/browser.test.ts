import { readFileSync } from 'fs';
import { connect, Socket } from 'net';

import { padData } from './packetUtils';
import { queryBytes } from './legacyProtocol';
import { validData } from './legacyProtocol.test';
import { QueryProtocols, fetchServerInfo } from './browser';

// Mock the node modules we depend on
jest.mock('net', () => ({
  ...jest.requireActual('net'),
  connect: jest.fn(),
  Socket: jest.fn()
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
 * @param write Handler for .write()
 * @param setTimeout Handler for .setTimeout()
 * @returns A mock Socket instance
 */
const createMockSocket = (
  on: jest.Mock = jest.fn(),
  write: jest.Mock = jest.fn(),
  setTimeout: jest.Mock = jest.fn()
): Socket => {
  const result = new Socket();

  result.on = on;
  result.end = jest.fn();
  result.setTimeout = setTimeout;
  result.write = write;

  return result;
};

const mockTimer = () => {
  jest
    .spyOn(process, 'hrtime')
    .mockImplementation((previous?: [number, number]) => {
      return [(previous?.[0] ?? -1) + 1, 0];
    });
};

// Create mock functions for the node modules we depend on
const connectMock = connect as unknown as jest.MockedFunction<ConnectMock>;

describe('minestat-es', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('exports', () => {
    it('exports fetchServerInfo', async () => {
      const module = await import('./index');

      expect(module.fetchServerInfo).toBeTruthy();
    });

    it('exports QueryProtocols', async () => {
      const module = await import('./index');

      expect(module.QueryProtocols).toBeTruthy();
    });
  });

  describe('fetchServerInfo', () => {
    const address = '1.2.3.4';
    const port = 25565;
    const offlineResult = { online: false };

    it('writes two bytes with legacy protocol', (done) => {
      const socket = createMockSocket();

      connectMock.mockImplementationOnce(
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
      fetchServerInfo({ address, port, protocol: QueryProtocols.Legacy });
    });
    it('writes JSON with modern protocol', (done) => {
      const socket = createMockSocket();

      connectMock.mockImplementationOnce(
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

            expect(socket.write).toHaveBeenCalled();

            done();
          });

          return socket;
        }
      );

      expect.assertions(5);
      fetchServerInfo({ address, port, protocol: QueryProtocols.Modern });
    });
    it('parses modern response if received', async () => {
      const socket = createMockSocket(
        jest.fn((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          callback(padData(readFileSync('./test/valid.json')));
        })
      );

      connectMock.mockImplementationOnce(() => socket);

      const { online, error, pingMs } = await fetchServerInfo({
        address,
        port,
        protocol: QueryProtocols.Modern
      });

      expect(online).toBeTruthy();
      expect(error).toBeFalsy();
      expect(pingMs).toBeUndefined();
    });
    it('handles unhandled socket errors', async () => {
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
    it('handles socket timeout', async () => {
      const socket = createMockSocket(
        jest.fn(),
        jest.fn(),
        jest.fn().mockImplementation((time: number, fn: CallableFunction) => {
          expect(time).toBe(timeout);
          fn();
        })
      );
      const timeout = 500;

      connectMock.mockImplementationOnce(() => socket);

      const result = await fetchServerInfo({
        address,
        port,
        timeout
      });

      expect.assertions(3);
      expect(socket.end).toHaveBeenCalled();
      expect(result).toEqual(offlineResult);
    });
    it('handles explicit socket error', async () => {
      const expectedError = new Error('Something failed.');
      const socket = createMockSocket(
        jest.fn((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'error') {
            return;
          }

          callback(expectedError);
        })
      );

      connectMock.mockImplementationOnce(() => socket);

      const { online, error } = await fetchServerInfo({ address, port });

      expect(online).toBeFalsy();
      expect(error).toEqual(expectedError);
    });
    it('obtains ping with legacy protocol', async () => {
      mockTimer();

      let dataListener: CallableFunction = () => {};

      const socket = createMockSocket(
        jest.fn((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          dataListener = callback;
          callback(validData);
        }),
        jest.fn(() => {
          dataListener(Buffer.alloc(0));
        })
      );

      connectMock.mockImplementationOnce(() => socket);

      const { pingMs } = await fetchServerInfo({
        address,
        port,
        ping: true
      });

      expect(pingMs).toBeDefined();
      expect(pingMs).toBeGreaterThan(0);
    });
    it('obtains ping with modern protocol', async () => {
      mockTimer();

      let dataListener: CallableFunction = () => {};

      const socket = createMockSocket(
        jest.fn((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          dataListener = callback;
          callback(padData(readFileSync('./test/valid.json')));
        }),
        jest.fn(() => {
          dataListener(Buffer.alloc(0));
        })
      );

      connectMock.mockImplementationOnce(() => socket);

      const { online, error, pingMs } = await fetchServerInfo({
        address,
        port,
        protocol: QueryProtocols.Modern,
        ping: true
      });

      expect(online).toBeTruthy();
      expect(error).toBeFalsy();
      expect(pingMs).toBeGreaterThan(0);
    });
    it('obtains ping if connection is closed early', async () => {
      mockTimer();

      const socket = createMockSocket(
        jest.fn((eventName: string, callback: CallableFunction) => {
          if (eventName === 'close') {
            callback();
          } else if (eventName === 'data') {
            callback(padData(readFileSync('./test/valid.json')));
          }
        }),
        jest.fn((_: Buffer, callback: CallableFunction) => callback())
      );

      connectMock.mockImplementationOnce(() => socket);

      const { online, error, pingMs } = await fetchServerInfo({
        address,
        port,
        protocol: QueryProtocols.Modern,
        ping: true
      });

      expect(online).toBeTruthy();
      expect(error).toBeFalsy();
      expect(pingMs).toBeGreaterThan(0);
    });
  });
});
