import { promises as dns, SrvRecord } from 'dns';
import { connect, Socket } from 'net';

import { fetchServerInfo, resolveSrvRecord, ServerInfo } from './index';

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

describe('minestat-es', () => {
  const hostname = 'example.com';
  const port = 25565;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchServerInfo', () => {
    const connectMock = connect as jest.MockedFunction<typeof connect>;
    const offlineResult: ServerInfo = { online: false };

    test('unhandled error', async () => {
      expect.assertions(1);
      try {
        await fetchServerInfo(hostname, port);
      } catch (error) {
        expect(error).not.toBeNull();
      }
    });
    test('socket timeout', async () => {
      const socket = new Socket();
      const timeout = 500;

      socket.on = jest.fn();
      socket.end = jest.fn();
      socket.setTimeout = jest
        .fn()
        .mockImplementation((time: number, fn: CallableFunction) => {
          expect(time).toBe(timeout);
          fn();
        });

      connectMock.mockImplementation(() => socket);

      const result = await fetchServerInfo(hostname, port, timeout);

      expect.assertions(3);
      expect(socket.end).toHaveBeenCalled();
      expect(result).toEqual(offlineResult);
    });
    test('socket error', async () => {
      const expectedError = new Error('Something failed.');
      const socket = new Socket();

      socket.on = jest
        .fn()
        .mockImplementation((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'error') {
            return;
          }

          callback(expectedError);
        });
      socket.end = jest.fn();
      socket.setTimeout = jest.fn();

      connectMock.mockImplementation(() => socket);

      expect.assertions(1);
      try {
        await fetchServerInfo(hostname, port);
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
    });
    test('empty reply from server', async () => {
      const socket = new Socket();
      const emptyData = Buffer.from([]);

      socket.on = jest
        .fn()
        .mockImplementation((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          callback(emptyData);
        });
      socket.end = jest.fn();
      socket.setTimeout = jest.fn();

      connectMock.mockImplementation(() => socket);

      const result = await fetchServerInfo(hostname, port);

      expect(result).not.toBeNull();
      expect(result.online).toBeFalsy();
    });
    test('short reply from server', async () => {
      const socket = new Socket();
      const shortData = Buffer.from([0x01, 0x02, 0x03]);
      const expectedError = new Error(
        'Got invalid reply from Minecraft server!'
      );

      socket.on = jest
        .fn()
        .mockImplementation((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          callback(shortData);
        });
      socket.end = jest.fn();
      socket.setTimeout = jest.fn();

      connectMock.mockImplementation(() => socket);

      expect.assertions(1);
      try {
        await fetchServerInfo(hostname, port);
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
    });
    test('invalid player count', async () => {
      const socket = new Socket();
      const invalidPlayerData = Buffer.from([
        0xff, 0x00, 0x23, 0x00, 0xa7, 0x00, 0x31, 0x00, 0x00, 0x00, 0x34, 0x00,
        0x37, 0x00, 0x00, 0x00, 0x31, 0x00, 0x2e, 0x00, 0x34, 0x00, 0x2e, 0x00,
        0x32, 0x00, 0x00, 0x00, 0x41, 0x00, 0x20, 0x00, 0x53, 0x00, 0x65, 0x00,
        0x72, 0x00, 0x76, 0x00, 0x65, 0x00, 0x72, 0x00, 0x00, 0x00, 0x30, 0x00,
        0x00, 0x00, 0x5a, 0x69
      ]);
      const expectedError = new Error('Failed to parse player count numbers!');

      socket.on = jest
        .fn()
        .mockImplementation((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          callback(invalidPlayerData);
        });
      socket.end = jest.fn();
      socket.setTimeout = jest.fn();

      connectMock.mockImplementation(() => socket);

      expect.assertions(1);
      try {
        await fetchServerInfo(hostname, port);
      } catch (error) {
        expect(error).toEqual(expectedError);
      }
    });
    test('valid reply from server', async () => {
      const socket = new Socket();
      const data = Buffer.from([
        0xff, 0x00, 0x23, 0x00, 0xa7, 0x00, 0x31, 0x00, 0x00, 0x00, 0x34, 0x00,
        0x37, 0x00, 0x00, 0x00, 0x31, 0x00, 0x2e, 0x00, 0x34, 0x00, 0x2e, 0x00,
        0x32, 0x00, 0x00, 0x00, 0x41, 0x00, 0x20, 0x00, 0x53, 0x00, 0x65, 0x00,
        0x72, 0x00, 0x76, 0x00, 0x65, 0x00, 0x72, 0x00, 0x00, 0x00, 0x30, 0x00,
        0x00, 0x00, 0x32, 0x00, 0x30
      ]);

      socket.on = jest
        .fn()
        .mockImplementation((eventName: string, callback: CallableFunction) => {
          if (eventName !== 'data') {
            return;
          }

          callback(data);
        });
      socket.end = jest.fn();
      socket.setTimeout = jest.fn();

      connectMock.mockImplementation(() => socket);

      const result = await fetchServerInfo(hostname, port);

      expect(result).not.toBeNull();
      expect(result.online).toBeTruthy();
    });
  });

  describe('resolveSrvRecord', () => {
    const resolveMock = dns.resolveSrv as jest.MockedFunction<
      typeof dns.resolveSrv
    >;

    test('resolveSrv throws error', async () => {
      const error = new Error('Something failed.');

      resolveMock.mockImplementation(() => Promise.reject(error));

      expect.assertions(1);
      try {
        await resolveSrvRecord(hostname);
      } catch (err) {
        expect(err).toBe(error);
      }
    });
    test('no results', async () => {
      const mockData: SrvRecord[] = [];

      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      const results = await resolveSrvRecord(hostname);

      expect(results).toBeNull();
    });
    test('success', async () => {
      const mockData: SrvRecord[] = [
        { name: hostname, port, priority: 1, weight: 1 }
      ];

      resolveMock.mockImplementation(() => Promise.resolve(mockData));

      const result = await resolveSrvRecord(hostname);

      expect(mockData.includes(result)).toBeTruthy();
    });
  });
});
