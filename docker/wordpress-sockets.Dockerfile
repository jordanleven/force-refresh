ARG WORDPRESS_BASE_IMAGE
FROM ${WORDPRESS_BASE_IMAGE}

# The WebSocket health check needs the PHP sockets extension, which the
# Docker Official WordPress images don't enable.
RUN docker-php-ext-install sockets
