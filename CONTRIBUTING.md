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

**Beta release** (from a feature branch with an open pull request — for testing and previewing release notes):

```sh
npm run release:beta
```

The script checks that your local `HEAD` matches the pull request's head on GitHub, then dispatches the **Release Beta Build** workflow for that pull request and prints the run URL. Maintainers can also run the workflow from the Actions tab and enter the PR number.

The workflow builds the pull request's head commit, runs linting, unit tests and e2e tests, and only then publishes a GitHub prerelease. Nothing is committed to the branch:

- The version is set on the runner as `<next version>-beta.<PR>.<run number>`, for example `3.3.0-beta.412.7`. It sorts below the final `3.3.0` release, so sites running a beta are offered the release when it ships. The next version comes from the unreleased changie fragments, or is the next patch version when the pull request has none, so every pull request can get a beta.
- The prerelease is tagged on the pull request's head commit, and the pull request keeps only its latest beta. Its betas are deleted when it closes.
- The prerelease shows upcoming release notes (from changie fragments, or a note that there are none) alongside the commit log since the last stable release, and a comment on the pull request links to the download.
- The workflow sets a **Beta Release** status on the head commit, which is required to merge into `master`. Pushing a new commit clears it, so release a new beta after every push.

Branches created before this workflow existed need to be rebased onto `master` first, since the workflow runs the beta scripts from the branch.

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
