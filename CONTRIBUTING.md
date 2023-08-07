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
| Homepage  | [localhost:8081](http://localhost:8081)  | [localhost:8080](http://localhost:8080) |
| Admin page  | [localhost:8081/wp-admin](http://localhost:8081/wp-admin)  | [localhost:8080/wp-admin](http://localhost:8080/wp-admin) |


## Admin

To log into the WordPress admin, visit the admin page of the  and log in with the following development credentials:

**Username**: `force-refresh-dev`

**Password**: `dross_dread_motto1polopony9treacle*SERAGLIO.unctuous8sighted`

[Docker]: www.docker.com
