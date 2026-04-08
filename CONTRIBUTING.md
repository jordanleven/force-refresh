# Contributing to Force Refresh

To streamline development, a sandbox WordPress environment is available via Docker. This will map the Force Refresh plugin directory to the plugins directory on the WordPress image and pre-populate the database with sample data.

To get started, follow the steps below:

## Starting the development environment

1. Download Docker for your Mac or PC.
2. Start the environment by running `docker-compose up` in the project directory. This will launch all docker containers.

| WordPress Version  | 5  | 6 |
|---|---|---|
| PHP Version  | 7  | 8 |
| Port  | 8081  | 8080 |
| Homepage  | [wp5.force-refresh.localhost](http://wp5.force-refresh.localhost)  | [wp6.force-refresh.localhost](wp6.force-refresh.localhost) |
| Admin page  | [wp5.force-refresh.localhost/wp-admin](http://wp5.force-refresh.localhost/wp-admin)  | [wp6.force-refresh.localhost/wp-admin](http://wp6.force-refresh.localhost/wp-admin) |

## Admin

To log into the WordPress admin, visit the admin page of the and log in with the following development credentials:

**Username**: `force-refresh-dev`

**Password**: `dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted`

[Docker]: www.docker.com

## Adding Release Notes

This project uses [changie](https://changie.dev/) to manage release notes.

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
