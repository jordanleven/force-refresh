<?php
/**
 * Stub for wp-admin/includes/file.php.
 *
 * @package ForceRefresh
 */

require_once __DIR__ . '/class-wp-filesystem-base.php';
require_once __DIR__ . '/class-wp-filesystem-direct.php';

if ( ! function_exists( 'WP_Filesystem' ) ) {
    /**
     * Initialise the global $wp_filesystem with a WP_Filesystem_Direct instance.
     *
     * @return bool Always true in the test stub.
     */
    function WP_Filesystem(): bool {
        global $wp_filesystem;
        $wp_filesystem = new WP_Filesystem_Direct( null );
        return true;
    }
}
