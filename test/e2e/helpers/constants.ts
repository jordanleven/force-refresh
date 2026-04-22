export const WP_INSTANCES = [
  { name: 'WordPress 4', baseURL: 'http://wp4.force-refresh.localhost' },
  { name: 'WordPress 5', baseURL: 'http://wp5.force-refresh.localhost' },
  { name: 'WordPress 6', baseURL: 'http://wp6.force-refresh.localhost' },
  { name: 'WordPress 7', baseURL: 'http://wp7.force-refresh.localhost' },
];

export function getAuthFile(baseURL: string): string {
  const { hostname } = new URL(baseURL);
  const instance = hostname.split('.')[0];
  return `test/e2e/.auth/${instance}.json`;
}
