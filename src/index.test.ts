import { connect, Socket } from 'net';
import { promises as dns, SrvRecord } from 'dns';

import { fetchServerInfo } from './index';
import { QueryProtocols } from './types';
import { queryBytes } from './legacyProtocol';

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
    const offlineResult = { online: false };

    it('writes two bytes with legacy protocol', (done) => {
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
      fetchServerInfo({ address, port, protocol: QueryProtocols.Legacy });
    });
    it('writes to socket with modern protocol', (done) => {
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

            expect(socket.write).toHaveBeenCalled();

            done();
          });

          return socket;
        }
      );

      expect.assertions(5);
      fetchServerInfo({ address, port, protocol: QueryProtocols.Modern });
    });
    it('handles unhandled error', async () => {
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
    it('handles socket error', async () => {
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
    it('handles resolveSrv throwing an error', async () => {
      const expectedError = new Error('Something failed.');

      resolveMock.mockImplementation(() => Promise.reject(expectedError));

      expect.assertions(1);
      try {
        await fetchServerInfo({ hostname });
      } catch (error) {
        expect(error).toBe(expectedError);
      }
    });
    it('handles no SRV records', async () => {
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
    it('does not prepend _minecraft._tcp. to hostname if already present', async () => {
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
    it('selects a random SRV record if multiple are present', (done) => {
      const socket = createMockSocket();
      const mockData: SrvRecord[] = [
        {
          name: 'mc.example.com',
          port: 1234,
          priority: 1,
          weight: 1
        },
        {
          name: 'mc.example.com',
          port: 4567,
          priority: 1,
          weight: 1
        }
      ];

      connectMock.mockImplementation(
        (
          mockPort: number,
          mockHost: string,
          mockFn?: CallableFunction
        ): Socket => {
          expect(mockData.map((data) => data.port)).toContain(mockPort);
          expect(mockData.map((data) => data.name)).toContain(mockHost);
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
      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      expect.assertions(5);
      fetchServerInfo({ hostname: `_minecraft._tcp.${hostname}` });
    });
  });
});
