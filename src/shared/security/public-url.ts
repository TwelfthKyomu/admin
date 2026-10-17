import 'server-only';

import { env } from '@/env';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const PRIVATE_NETWORKS = new BlockList();

for (const [network, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.168.0.0', 16],
    ['224.0.0.0', 4],
] as const) {
    PRIVATE_NETWORKS.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
    ['::', 128],
    ['::1', 128],
    ['::ffff:0:0', 96],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
] as const) {
    PRIVATE_NETWORKS.addSubnet(network, prefix, 'ipv6');
}

function isPrivateAddress(address: string): boolean {
    const family = isIP(address) === 6 ? 'ipv6' : 'ipv4';

    return PRIVATE_NETWORKS.check(address, family);
}

export async function isPublicHttpUrl(value: string): Promise<boolean> {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        return false;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (env.NODE_ENV === 'development') return true;

    const hostname = url.hostname.replace(/^\[|\]$/g, '');

    const addresses = isIP(hostname)
        ? [hostname]
        : await lookup(hostname, { all: true })
              .then((found) => found.map((entry) => entry.address))
              .catch(() => []);

    return addresses.length > 0 && !addresses.some(isPrivateAddress);
}
