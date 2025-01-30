export enum ChatColor {
  Black = 'black', // 0
  DarkBlue = 'dark_blue', // 1
  DarkGreen = 'dark_green', // 2
  DarkCyan = 'dark_aqua', // 3
  DarkRed = 'dark_red', // 4
  DarkGray = 'dark_gray', // 8
  Purple = 'dark_purple', // 5
  Gold = 'gold', // 6
  Gray = 'gray', // 7
  Blue = 'blue', // 9
  Green = 'green', // a
  Cyan = 'aqua', // b
  Red = 'red', // c
  Pink = 'light_purple', // d
  Yellow = 'yellow', // e
  White = 'white' // f
}

export type Description = {
  text: string;
  bold?: boolean; // l
  italic?: boolean; // o
  underlined?: boolean; // n
  strikethrough?: boolean; // m
  obfuscated?: boolean; // k
  color?: ChatColor;
  extra?: Description[];
};

export type PlayerInfo = {
  online: number;
  max: number;
  sample: {
    id: string;
    name: string;
  }[];
};

/**
 * Contains an `online` boolean plus the server reply data.
 */
export type ServerInfo = {
  /**
   * Whether or not a successful connection to the server was established.
   */
  online: boolean;
  /**
   * Any error that occurred during the fetch process.
   */
  error?: Error;
  /**
   * Minecraft server version.
   */
  version?: string;
  /**
   * Minecraft server MOTD.
   */
  motd?: string;
  /**
   * Number of currently connected players.
   */
  players?: number;
  /**
   * Maximum number of players the server supports.
   */
  maxPlayers?: number;
  /**
   * Number of milliseconds between host and client.
   */
  pingMs?: number;
  /**
   * Optional list of player information.
   */
  playerInfo?: {
    id: string;
    name: string;
  }[];
};

/**
 * The modern protocol response's JSON schema
 */
export type ModernServerResponse = {
  description: Description;
  favicon?: string;
  players: PlayerInfo;
  version: {
    protocol: number;
    name: string;
  };
};

/**
 * List of the supported query protocols
 */
export enum QueryProtocols {
  Legacy = 'legacy',
  Modern = 'modern'
}

/**
 * Options common to all query protocols
 */
export type CommonOpts = {
  timeout?: number;
  ping?: boolean;
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
