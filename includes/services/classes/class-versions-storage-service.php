<?php
/**
 * Our class responsible for versions storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Refresh_Counter_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Version_File_Service;

/**
 * Class for versions storage services.
 */
class Versions_Storage_Service {

    const OPTION_SITE_VERSION = 'force_refresh_current_site_version';

    const OPTION_PAGE_VERSIONS = 'force_refresh_page_versions';

    /**
     * The legacy post meta key used before page versions were stored as a single option.
     * Retained for use in the migration.
     */
    const OPTION_PAGE_VERSION_LEGACY = 'force_refresh_current_page_version';

    /**
     * Generate a new version, persist it as the site version, and return it.
     *
     * @return string The new site version.
     */
    public static function set_new_site_version(): string {
        $version = self::get_new_version();
        self::set_site_version( $version );
        Refresh_Counter_Service::increment_site_refresh_count();
        return $version;
    }

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
        self::maybe_sync_version_file( array( 'site' => $new_version ) );
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
        $versions                      = self::get_all_page_versions();
        $versions[ (string) $page_id ] = $page_version;
        update_option( self::OPTION_PAGE_VERSIONS, $versions );

        self::maybe_sync_version_file( array( 'pages' => array( (string) $page_id => $page_version ) ) );
    }

    /**
     * Return the version for a specific page.
     *
     * @param int $page_id The post ID to look up.
     *
     * @return string The page version, or '0' when not set.
     */
    public static function get_page_version( int $page_id ): string {
        $versions = self::get_all_page_versions();
        $version  = $versions[ (string) $page_id ] ?? null;
        return $version ? $version : '0';
    }

    /**
     * Write a fresh snapshot of all current versions to the version file.
     *
     * Called when static file polling is first enabled so the file exists
     * immediately without waiting for the next refresh.
     *
     * @return void
     */
    public static function sync_version_file(): void {
        $data = array( 'site' => self::get_site_version() );

        $page_versions = self::get_all_page_versions();
        if ( ! empty( $page_versions ) ) {
            $data['pages'] = $page_versions;
        }

        Version_File_Service::write( $data );
    }

    /**
     * Return all per-page versions keyed by post ID string.
     *
     * @return array<string, string>
     */
    private static function get_all_page_versions(): array {
        $versions = get_option( self::OPTION_PAGE_VERSIONS, array() );
        return is_array( $versions ) ? $versions : array();
    }

    /**
     * Merge updates into the version file when static file polling is enabled.
     *
     * Merges page entries at the top level so existing page versions are preserved.
     *
     * @param array $updates The fields to merge into the version file.
     *
     * @return void
     */
    private static function maybe_sync_version_file( array $updates ): void {
        if ( ! Options_Storage_Service::get_use_static_file_polling() ) {
            return;
        }

        $current = Version_File_Service::read();
        $merged  = array_merge( $current, $updates );

        // array_replace preserves integer keys (post IDs) unlike array_merge.
        $merged_pages = array_replace( $current['pages'] ?? array(), $updates['pages'] ?? array() );

        if ( ! empty( $merged_pages ) ) {
            $merged['pages'] = $merged_pages;
        }

        Version_File_Service::write( $merged );
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
