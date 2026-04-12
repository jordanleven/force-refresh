# Changelog

All notable changes to this project will be documented in this file.

## 2.17.0 - 2026-04-12
### Feature (minor)
* Release notes are now grouped by minor version for easier browsing. You can also click any release to view the full details on the official GitHub repository.
### Changed (minor)
* Resolves an issue where Force Refresh unnecessarily contained WordPress.org plugin marketing assets.
* Updated plugin status messaging in the admin interface to better highlight available updates, pre-release builds, and debugging mode.
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.16.2 - 2026-04-08
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.16.1 (2026-03-10)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.16.0 (2026-02-24)
### Changed
* Update minimum PHP version to 8.2.
## 2.15.0 (2026-02-24)
### Changed
* Update minimum WordPress version to 6.3.
## 2.14.0 (2025-11-29)
### Features
* Add support for WordPress 6.9.
## 2.13.2 (2025-08-29)
### Bug Fixes
* Resolves an issue where Force Refresh could fail to activate on sites running PHP 8.2.
## 2.13.1 (2025-08-09)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.13.0 (2025-04-21)
### Features
* Add support for WordPress 6.8.
## 2.12.1 (2025-01-12)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.12.0 (2024-10-28)
### Features
* Add support for WordPress 6.7.
## 2.11.1 (2024-09-15)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.11.0 (2024-07-07)
### Features
* Add support for WordPress 6.6.
## 2.10.2 (2024-05-27)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.10.1 (2024-03-24)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.10.0 (2024-03-24)
### Features
* Add support for WordPress 6.5.
### Bug Fixes
* Resolves an issue where missing build files showed an unclear activation error.
## 2.9.4 (2024-02-10)
### Bug Fixes
* Resolves an issue where icons could fail to load in the admin UI.
## 2.9.3 (2023-12-09)
### Bug Fixes
* Resolves an issue where the Release Notes modal did not load correctly.
## 2.9.2 (2023-11-17)
### Bug Fixes
* Resolves an issue where the admin bar confirmation message did not include the selected refresh interval.
* Resolves an issue where the refresh button label in the WordPress admin bar was incorrect.
* Resolves an issue where search results pages could refresh continuously.
* Resolves an issue where refreshing an individual page or post did not save correctly.
* Resolves an issue where Admin Bar refresh settings were not saved correctly in the plugin options.
## 2.9.1 (2023-11-10)
### Bug Fixes
* Resolves an issue where activating Force Refresh could cause a site to crash.
## 2.9.0 (2023-11-10)
### Features
* Add support for WordPress 6.4.
## 2.8.3 (2023-09-09)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.8.2 (2023-08-09)
### Bug Fixes
* Resolves an issue where release notes could display duplicate periods.
* Resolves an issue where release notes could break on sites running PHP 7.4.
## 2.8.1 (2023-08-05)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.8.0 (2023-08-05)
### Features
* Add support for leaving plugin reviews from the admin UI.
* Add support for custom refresh intervals between thirty seconds and four hours.
* Add support for viewing plugin release notes from within the admin UI.
### Bug Fixes
* Resolves an issue where dismissed admin notifications could block interaction with the rest of the admin interface.
* Resolves an issue where logo animations in the admin interface did not run with the intended timing.
## 2.7.0 (2023-07-26)
### Features
* Add support for WordPress 6.3.
## 2.6.1 (2023-03-04)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.6.0 (2022-06-11)
### Features
* Add support for opening the troubleshooting page directly from the main admin screen.
### Bug Fixes
* Resolves an issue where the refresh instructions read awkwardly on sites without a configured site name.
## 2.5.2 (2022-01-23)
### Bug Fixes
* Resolves an issue where the production release workflow shipped the beta JavaScript bundle instead of the production build.
## 2.5.1 (2022-01-23)
### Features
* Add support for troubleshooting version checks that include development version strings.
* Update WordPress version requirements.
## 2.5.0 (2022-01-08)
### Features
* Add support for showing an admin notice when the installed plugin version is out of date.
## 2.4.0 (2021-12-04)
### Features
* Add support for debug logging during the refresh countdown when Debug Mode is enabled.
* Add support for a troubleshooting screen with debug information and a browser-console Debug Mode toggle.
### Bug Fixes
* Resolves an issue where the refresh flow could continue after an unsuccessful refresh request.
* Resolves an issue where refresh checks could fail for site visitors.
## 2.3.0 (2021-03-07)
### Bug Fixes
* Resolves an issue where the admin options UI did not show the default 120-second interval as selected.
* Resolves an issue where the admin bar button label incorrectly said "Force Refresh Sites."
## 2.2.0 (2020-11-29)
### Features
* Add support for WordPress 5.5.3.
* Add support for a Vue-powered admin UI in place of the legacy Handlebars interface.
### Bug Fixes
* Resolves an issue where per-page refresh controls did not work correctly for posts whose slugs contained encoded characters.
## 2.1.6 (2020-09-29)
### Bug Fixes
* Resolves an issue where client refresh checks ignored the configured refresh interval.
## 2.1.5 (2020-09-17)
### Bug Fixes
* Resolves issues running Force Refresh on sites using PHP 7.2.
## 2.1.4 (2020-09-16)
### Bug Fixes
* Resolves an issue where pages without a stored refresh version could enter a refresh loop after activation.
* Resolves an issue where the admin panel did not display the default refresh interval as the selected option.
## 2.1.3 (2020-09-16)
### Bug Fixes
* Resolves an issue where users without the Force Refresh capability could still request refreshes.
## 2.1.2 (2020-09-07)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.1.1 (2020-09-07)
### Dependencies & security
* Performance enhancements and bug fixes.
## 2.1.0
### Features
* Add support for requesting refreshes on custom post types.
## 2.0.0
### Features
* Add support for HTML templating with LightnCandy.
## 1.1.2
### Dependencies & security
* Performance enhancements and bug fixes.
## 1.1.1
### Dependencies & security
* Performance enhancements and bug fixes.
## 1.0.0
### Features
* Initial release.
