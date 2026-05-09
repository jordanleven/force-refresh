<?php
/**
 * Our class responsible for running one-time data migrations on plugin update.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for running plugin data migrations.
 */
class Migration_Service {

    const OPTION_MIGRATIONS_RAN = 'force_refresh_migrations_ran';

    /**
     * Run any migrations that have not yet been applied.
     *
     * @return void
     */
    public static function run_pending(): void {
        $ran = get_option( self::OPTION_MIGRATIONS_RAN, array() );

        if ( ! is_array( $ran ) ) {
            $ran = array();
        }

        foreach ( self::get_migrations() as $id => $migration ) {
            if ( ! in_array( $id, $ran, true ) ) {
                $migration();
                $ran[] = $id;
            }
        }

        update_option( self::OPTION_MIGRATIONS_RAN, $ran );
    }

    /**
     * Return the ordered list of migrations keyed by a unique ID.
     *
     * @return array<string, callable>
     */
    private static function get_migrations(): array {
        return array(
            'consolidate_page_versions_to_option' => array( __CLASS__, 'migrate_page_versions_to_option' ),
        );
    }

    /**
     * Migrate per-page versions from individual post meta entries into a single option.
     *
     * Reads all posts carrying the legacy meta key, writes them into
     * OPTION_PAGE_VERSIONS, then removes the individual meta rows.
     *
     * @return void
     */
    private static function migrate_page_versions_to_option(): void {
        global $wpdb;

        $legacy_key = Versions_Storage_Service::OPTION_PAGE_VERSION_LEGACY;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s",
                $legacy_key
            )
        );

        if ( empty( $rows ) ) {
            return;
        }

        $versions = array();
        foreach ( $rows as $row ) {
            $versions[ (string) $row->post_id ] = $row->meta_value;
        }

        update_option( Versions_Storage_Service::OPTION_PAGE_VERSIONS, $versions );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $legacy_key ) );
    }
}
