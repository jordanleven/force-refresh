import { compare } from 'compare-versions';

export const isDevelopmentVersion = (version) => version.includes('-');

export const getSanitizedVersion = (version) => version.split('-')[0];

export const versionSatisfies = (requiredVersion, installedVersion) => compare(requiredVersion, installedVersion, '<=');
