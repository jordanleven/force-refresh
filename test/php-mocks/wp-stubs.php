<?php
/**
 * WordPress class and constant stubs for unit testing.
 *
 * @package ForceRefresh
 */

require_once __DIR__ . '/wp-stub-wp-http.php';
require_once __DIR__ . '/wp-stub-wp-rest-server.php';
require_once __DIR__ . '/wp-stub-wp-rest-request.php';
require_once __DIR__ . '/wp-stub-wp-rest-response.php';

if ( ! defined( 'WP_FORCE_REFRESH_CAPABILITY' ) ) {
    define( 'WP_FORCE_REFRESH_CAPABILITY', 'manage_options' );
}

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/wp-root/' );
}
