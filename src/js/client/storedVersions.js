import {
  __,
  curry,
  identity,
  ifElse,
  isNil,
  pipe,
  always,
} from 'ramda';

const DATA_ATTRIBUTE_VERSION_SITE = 'force-refresh-version-site';
const DATA_ATTRIBUTE_VERSION_PAGE = 'force-refresh-version-page';

const getHtmlElement = () => document.querySelector('html');
const getDataAttribute = (element, attribute) => element.getAttribute(attribute);
const setDataAttribute = (element, attribute, value) => element.setAttribute(attribute, value);

const getStoredVersion = (attribute) => pipe(
  getHtmlElement,
  curry(
    getDataAttribute,
  )(__, attribute),
  ifElse(
    isNil,
    always(null),
    identity,
  ),
);

const setStoredVersion = (attribute, value) => pipe(
  getHtmlElement,
  curry(
    setDataAttribute,
  )(__, attribute, value),
  ifElse(
    isNil,
    always(null),
    identity,
  ),
)();

export const getStoredVersionSite = getStoredVersion(DATA_ATTRIBUTE_VERSION_SITE);
export const getStoredVersionPage = getStoredVersion(DATA_ATTRIBUTE_VERSION_PAGE);

export const setStoredVersionSite = (version) => setStoredVersion(
  DATA_ATTRIBUTE_VERSION_SITE,
  version,
);

export const setStoredVersionPage = (version) => setStoredVersion(
  DATA_ATTRIBUTE_VERSION_PAGE,
  version,
);
