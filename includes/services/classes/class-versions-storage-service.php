<?php
/**
 * Our class responsible for versions storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for versions storage services.
 */
class Versions_Storage_Service {

    const OPTION_SITE_VERSION = 'force_refresh_current_site_version';

    const OPTION_PAGE_VERSION = 'force_refresh_current_page_version';

    /**
     * Method for setting a site version.
     *
     * @param string $new_version The new site version.
     *
     * @return void
     */
    public static function set_site_version( string $new_version ): void {
        // Remove the old option.
        delete_option( self::OPTION_SITE_VERSION );
        // Add the new option.
        add_option( self::OPTION_SITE_VERSION, $new_version );
    }

    /**
     * Method to get the current version of the site.
     *
     * @return  string The version of the site
     */
    public static function get_site_version(): string {
        $current_site_version = get_option( self::OPTION_SITE_VERSION );
        return (bool) $current_site_version ? $current_site_version : '0';
    }

    /**
     * Method for setting a page version.
     *
     * @param int    $page_id      The post ID to update.
     * @param string $page_version The new page version.
     *
     * @return void
     */
    public static function set_page_version( int $page_id, string $page_version ): void {
        // Remove the old.
        delete_post_meta( $page_id, self::OPTION_PAGE_VERSION );

        // Add the new.
        update_post_meta(
            $page_id,
            self::OPTION_PAGE_VERSION,
            $page_version,
            null,
            'no'
        );
    }

    /**
     * Method to retrieve a hash that can be used as the version. This function will
     * deliver a unique ID that can be used to identify a unique version of a site, page,
     * or post.
     *
     * @return  string  The unique version ID
     */
    public static function get_new_version(): string {
        $time              = current_time( 'mysql' );
        $site_version_hash = wp_hash( $time );
        // Get the first eight characters (the chance of having a duplicate hash from
        // the first 8 characters is low).
        $site_version = substr( $site_version_hash, 0, 8 );
        return $site_version;
    }
}
