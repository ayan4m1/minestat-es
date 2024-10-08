import { ServerInfo } from './types';

export interface QueryProtocol {
  handshakePacket(address: string, port: number): Buffer;
  parse(response: Buffer): ServerInfo;
}
