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
| Homepage  | [wp5.force-refresh.localhost](http://wp5.force-refresh.localhost)  | (wp6.force-refresh.localhost) |
| Admin page  | [wp5.force-refresh.localhost/wp-admin](http://wp5.force-refresh.localhost/wp-admin)  | [wp6.force-refresh.localhost/wp-admin](http://wp6.force-refresh.localhost/wp-admin) |


## Admin

To log into the WordPress admin, visit the admin page of the  and log in with the following development credentials:

**Username**: `force-refresh-dev`

**Password**: `dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted`

[Docker]: www.docker.com
