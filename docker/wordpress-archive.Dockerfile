ARG WORDPRESS_BASE_IMAGE
FROM ${WORDPRESS_BASE_IMAGE}

# Docker Official Images no longer publish new patches for these older branches.
# Keep the official image's PHP/Apache setup and entrypoint, but replace its
# WordPress source with the checksum-verified release archive.
ARG WORDPRESS_VERSION
ARG WORDPRESS_SHA1
RUN set -eux; \
    curl -fsSL "https://wordpress.org/wordpress-${WORDPRESS_VERSION}.tar.gz" -o /tmp/wordpress.tar.gz; \
    echo "${WORDPRESS_SHA1}  /tmp/wordpress.tar.gz" | sha1sum -c -; \
    cp /usr/src/wordpress/wp-config-docker.php /tmp/wp-config-docker.php; \
    rm -rf /usr/src/wordpress; \
    mkdir -p /usr/src/wordpress; \
    tar -xzf /tmp/wordpress.tar.gz -C /usr/src/wordpress --strip-components=1; \
    mv /tmp/wp-config-docker.php /usr/src/wordpress/wp-config-docker.php; \
    rm /tmp/wordpress.tar.gz; \
    chown -R www-data:www-data /usr/src/wordpress
