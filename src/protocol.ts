import { ServerInfo } from './types';

/**
 * Represents a generic means of querying a Minecraft server for information.
 */
export interface QueryProtocol {
  /**
   * Creates a handshake packet for the given server information.
   *
   * @param address Server address (hostname or IP)
   * @param port Port number
   * @returns {Buffer} Handshake packet
   */
  handshakePacket(address: string, port: number): Buffer;

  /**
   * Creates a ping packet, to be sent after server handshake.
   */
  pingPacket(): Buffer;

  /**
   * Convert the response buffer into a ServerInfo object.
   *
   * @param response Buffer from Minecraft server
   * @returns {ServerInfo} Parsed server information
   */
  parse(response?: Buffer): ServerInfo;
}
