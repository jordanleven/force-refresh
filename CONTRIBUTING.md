# Contributing to Force Refresh

To streamline development, a sandbox WordPress environment is available via [Docker]. This will map the Force Refresh plugin directory to the plugins directory on the WordPress image and pre-populate the database with sample data.

To get started, follow the steps below:

## Starting the development environment

1. Download Docker for your Mac or PC.
2. Start the environment by running `docker compose up -d --build` in the project directory. This will build the legacy WordPress images and launch all docker containers. See [docker/README.md](docker/README.md) for version details and for updating an existing installation.

| WordPress Version | QA (7.1.3) | 7.1.3 | 6.9.10 | 5.9.19 |
| --- | --- | --- | --- | --- |
| PHP Version | 8.3 | 8.3 | 8.3 | 7.4 |
| Port | 8086 | 8085 | 8084 | 8083 |
| Homepage | [qa.force-refresh.localhost][wpqa] | [wp7.force-refresh.localhost][wp7] | [wp6.force-refresh.localhost][wp6] | [wp5.force-refresh.localhost][wp5] |
| Admin page | [qa.force-refresh.localhost/wp-admin][wpqa-admin] | [wp7.force-refresh.localhost/wp-admin][wp7-admin] | [wp6.force-refresh.localhost/wp-admin][wp6-admin] | [wp5.force-refresh.localhost/wp-admin][wp5-admin] |

## Admin

To log into the WordPress admin, visit the admin page of the and log in with the following development credentials:

**Username**: `force-refresh-dev`

**Password**: `dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted`

## Previewing What's New

Run `npm run dev` (watch mode) or `npm run build:dev`, then open the Force Refresh admin page and append `&force-refresh-whats-new=1` to its URL. Reload to reopen the dialog after dismissing it.

The preview includes all feature highlights for the installed major version up to the installed minor version, even on prerelease builds and when you've already seen them. It leaves your saved last-seen version untouched. Remove the parameter or set it to `0` to return to normal behavior. The toggle only works in development builds; `npm run build` ignores it. Open the main Force Refresh page rather than the Troubleshooting view to see the dialog.

## Adding Release Notes

This project uses [changie] to manage release notes.

**When you finish a meaningful change** (feature, fix, dependency update, etc.), create a release note fragment before or alongside your commit:

```sh
npm run changelog:note
```

changie will prompt for a kind and a human-readable description. Commit the resulting `.changes/unreleased/*.yaml` file with your code.

| Kind | Semver impact |
| --- | --- |
| Added, Changed, Deprecated | minor bump |
| Fixed, Security | patch bump |
| Removed | major bump |

To preview what the release notes and WordPress.org readme will look like before cutting a release, run:

```sh
npm run changelog:preview
```

This generates `README.txt` locally without committing anything. Inspect it, then discard with `git restore README.txt`.

## Cutting a Release

**Beta release** (from a feature branch — for testing and previewing release notes):

```sh
npm run release:beta
```

The beta GitHub Release will show upcoming release notes (from changie fragments) alongside the raw commit log since the last beta.

**Production release** (from `master` only):

```sh
npm run release              # version auto-detected from fragment kinds
npm run release -- --minor   # or override the bump level explicitly
```

The script will block if no unreleased fragments exist, show the computed next version, and ask for confirmation before committing, tagging, and pushing. CI handles the rest.

[Docker]: https://www.docker.com
[changie]: https://changie.dev/
[wp5]: http://wp5.force-refresh.localhost
[wp5-admin]: http://wp5.force-refresh.localhost/wp-admin
[wp6]: http://wp6.force-refresh.localhost
[wp6-admin]: http://wp6.force-refresh.localhost/wp-admin
[wpqa]: http://qa.force-refresh.localhost
[wpqa-admin]: http://qa.force-refresh.localhost/wp-admin
[wp7]: http://wp7.force-refresh.localhost
[wp7-admin]: http://wp7.force-refresh.localhost/wp-admin
