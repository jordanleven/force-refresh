<?php
/**
 * Our class responsible for coordinating site and page refreshes.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Services\Refresh_Counter_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

/**
 * Class for refresh operations.
 */
class Refresh_Service {

    /**
     * Generate a new version, persist it as the site version, increment the
     * site refresh counter, and return the new version.
     *
     * @return string The new site version.
     */
    public static function set_new_site_version(): string {
        $version = Versions_Storage_Service::set_new_site_version();
        Refresh_Counter_Service::increment_site_refresh_count();
        return $version;
    }

    /**
     * Generate a new version, persist it as the page version, increment the
     * page refresh counter, and return the new version.
     *
     * @param int $page_id The post ID to refresh.
     *
     * @return string The new page version.
     */
    public static function set_new_page_version( int $page_id ): string {
        $version = Versions_Storage_Service::get_new_version();
        Versions_Storage_Service::set_page_version( $page_id, $version );
        Refresh_Counter_Service::increment_page_refresh_count( $page_id );
        return $version;
    }
}
