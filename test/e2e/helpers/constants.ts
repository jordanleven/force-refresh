export const WP_INSTANCES = [
  { name: 'WordPress 6.3', baseURL: 'http://wp6-3.force-refresh.localhost' },
  { name: 'WordPress 6.9', baseURL: 'http://wp6.force-refresh.localhost' },
];

export function getAuthFile(baseURL: string): string {
  const { hostname } = new URL(baseURL);
  const instance = hostname.split('.')[0];
  return `test/e2e/.auth/${instance}.json`;
}
