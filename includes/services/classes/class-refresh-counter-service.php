<?php
/**
 * Our class responsible for tracking admin-initiated refresh counts.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for tracking refresh counts by type.
 */
class Refresh_Counter_Service {

    const OPTION_SITE_REFRESH_COUNT = 'force_refresh_refresh_count_site';

    const OPTION_PAGE_REFRESH_COUNTS = 'force_refresh_refresh_count_page';

    /**
     * Get the total number of site-wide refreshes.
     *
     * @return int
     */
    public static function get_refresh_count_site(): int {
        return (int) get_option( self::OPTION_SITE_REFRESH_COUNT, 0 );
    }

    /**
     * Get the number of refreshes for a specific page.
     *
     * @param int $page_id The post ID to look up.
     *
     * @return int
     */
    public static function get_refresh_count_page( int $page_id ): int {
        $raw    = get_option( self::OPTION_PAGE_REFRESH_COUNTS, array() );
        $counts = is_array( $raw ) ? $raw : array();
        $key    = (string) $page_id;
        $count  = $counts[ $key ] ?? 0;
        return (int) $count;
    }

    /**
     * Increment the site-wide refresh count.
     *
     * @return void
     */
    public static function increment_site_refresh_count(): void {
        update_option( self::OPTION_SITE_REFRESH_COUNT, self::get_refresh_count_site() + 1 );
    }

    /**
     * Increment the refresh count for a specific page.
     *
     * @param int $page_id The post ID to increment.
     *
     * @return void
     */
    public static function increment_page_refresh_count( int $page_id ): void {
        $raw            = get_option( self::OPTION_PAGE_REFRESH_COUNTS, array() );
        $counts         = is_array( $raw ) ? $raw : array();
        $key            = (string) $page_id;
        $current        = self::get_refresh_count_page( $page_id );
        $counts[ $key ] = $current + 1;
        update_option( self::OPTION_PAGE_REFRESH_COUNTS, $counts );
    }
}
