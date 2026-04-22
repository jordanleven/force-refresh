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

if ( ! defined( 'DAY_IN_SECONDS' ) ) {
    define( 'DAY_IN_SECONDS', 86400 );
}

if ( ! class_exists( 'WP_Error' ) ) {
    /**
     * Stub for WP_Error.
     */
    class WP_Error {}
}

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/wp-root/' );
}

if ( ! function_exists( 'wp_strip_all_tags' ) ) {
    /**
     * Stub for wp_strip_all_tags.
     *
     * @param string $text The string to clean.
     *
     * @return string
     */
    function wp_strip_all_tags( string $text ): string {
        return strip_tags( $text );
    }
}
