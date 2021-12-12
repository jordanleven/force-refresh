import { compare } from 'compare-versions';

export const versionSatisfies = (requiredVersion, installedVersion) => compare(requiredVersion, installedVersion, '<=');
