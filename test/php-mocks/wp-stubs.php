<?php
/**
 * WordPress class and constant stubs for unit testing.
 *
 * @package ForceRefresh
 */

require_once __DIR__ . '/wp-stub-wp-http.php';
require_once __DIR__ . '/wp-stub-wpdb.php';
require_once __DIR__ . '/wp-stub-wp-rest-server.php';
require_once __DIR__ . '/wp-stub-wp-rest-request.php';
require_once __DIR__ . '/wp-stub-wp-rest-response.php';

if ( ! defined( 'WP_FORCE_REFRESH_CAPABILITY' ) ) {
    define( 'WP_FORCE_REFRESH_CAPABILITY', 'manage_options' );
}

if ( ! defined( 'DAY_IN_SECONDS' ) ) {
    define( 'DAY_IN_SECONDS', 86400 );
}

if ( ! defined( 'FS_CHMOD_FILE' ) ) {
    define( 'FS_CHMOD_FILE', 0644 );
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

if ( ! function_exists( 'add_action' ) ) {
    function add_action( $hook, $callback, $priority = 10, $accepted_args = 1 ): bool {
        return true;
    }
}

if ( ! function_exists( 'wp_unslash' ) ) {
    function wp_unslash( string $value ): string {
        return stripslashes( $value );
    }
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
    function sanitize_text_field( string $str ): string {
        return trim( strip_tags( $str ) );
    }
}

if ( ! function_exists( 'wp_delete_file' ) ) {
    function wp_delete_file( string $file ): void {
        if ( file_exists( $file ) ) {
            unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
        }
    }
}
