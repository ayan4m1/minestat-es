/**
 * Contains an `online` boolean plus the server reply data.
 */
export type ServerInfo = {
  online: boolean;
  error?: Error;
  version?: string;
  motd?: string;
  players?: number;
  maxPlayers?: number;
};

/**
 * List the supported query protocols
 */
export enum QueryProtocols {
  Legacy = 'legacy',
  Modern = 'modern'
}

/**
 * Options common to both modes of invocation
 */
export type CommonOpts = {
  timeout?: number;
  protocol?: QueryProtocols;
};

/**
 * Options specific to hostname (SRV lookup) connections
 */
export type HostnameOpts = CommonOpts & {
  hostname: string;
};

/**
 * Options specific to host/port (direct) connections
 */
export type AddressOpts = CommonOpts & {
  address: string;
  port: number;
};
