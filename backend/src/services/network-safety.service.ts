import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export function validatePublicHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed');
  if (url.username || url.password) throw new Error('Credentials in URLs are not allowed');
  if (url.port && !['80', '443', ''].includes(url.port)) throw new Error('Non-standard ports are not allowed');
  return url;
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const parts = address.split('.').map(Number);
    return parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 0;
  }

  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') ||
    normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') ||
    normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.') ||
    normalized.startsWith('::ffff:169.254.');
}

export async function assertPublicUrl(input: string): Promise<URL> {
  const url = validatePublicHttpUrl(input);
  const hostname = url.hostname.replace(/^[[]|[]]$/g, '');

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('Private and local network addresses are not allowed');
  } else {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0 || addresses.some((item) => isPrivateAddress(item.address))) {
      throw new Error('URL resolves to a private or local network address');
    }
  }

  return url;
}
