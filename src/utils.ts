import { hrtime } from 'process';

export const prefixWith = (base: string, prefix: string): string =>
  `${base.startsWith(prefix) ? '' : prefix}${base}`;

export const getPingMs = (startTime: [number, number]): number => {
  const pingTime = hrtime(startTime);

  return pingTime[0] * 1e3 + pingTime[1] / 1e6;
};
