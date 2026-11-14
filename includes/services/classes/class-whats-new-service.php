<?php
/**
 * Our service responsible for tracking which release each admin last saw in What's New.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for tracking What's New visibility per user.
 */
class Whats_New_Service {

    const OPTION_FIRST_INSTALLED_VERSION = 'force_refresh_first_installed_version';

    const USER_META_LAST_SEEN_VERSION = 'force_refresh_whats_new_last_seen_version';

    /**
     * Options that only exist once Force Refresh has run on a site before.
     *
     * Every site that ran 3.1 or later has the migrations option. Older sites only have whatever
     * they happened to use: a site-wide refresh, saved settings or debug mode.
     *
     * @var string[]
     */
    const OPTIONS_INDICATING_EXISTING_INSTALL = array(
        Migration_Service::OPTION_MIGRATIONS_RAN,
        Versions_Storage_Service::OPTION_SITE_VERSION,
        Options_Storage_Service::OPTION_REFRESH_INTERVAL_IN_SECONDS,
        Options_Storage_Service::OPTION_SHOW_IN_WP_ADMIN_BAR,
        Debug_Storage_Service::OPTION_DEBUG_ACTIVE_DATE,
    );

    /**
     * Whether the first-installed version has already been recorded.
     *
     * @return bool
     */
    public static function has_recorded_first_installed_version(): bool {
        return false !== get_option( self::OPTION_FIRST_INSTALLED_VERSION );
    }

    /**
     * Record the version Force Refresh was first installed at.
     *
     * Fresh installs store their version so What's New stays quiet until the next major or
     * minor update. Sites that ran Force Refresh before this option existed store an empty
     * string, which means they are upgrading and should see What's New. Prereleases are stored
     * as-is; What's New treats a prerelease of a new minor as not having seen that minor yet.
     *
     * @param string $version The currently installed plugin version.
     *
     * @return void
     */
    public static function record_first_installed_version( string $version ): void {
        if ( self::has_recorded_first_installed_version() ) {
            return;
        }

        update_option( self::OPTION_FIRST_INSTALLED_VERSION, self::is_existing_install() ? '' : $version );
    }

    /**
     * Whether Force Refresh has run on this site before.
     *
     * @return bool
     */
    private static function is_existing_install(): bool {
        foreach ( self::OPTIONS_INDICATING_EXISTING_INSTALL as $option ) {
            if ( false !== get_option( $option ) ) {
                return true;
            }
        }

        return self::has_legacy_page_versions();
    }

    /**
     * Whether any page versions remain in post meta from before 3.1.
     *
     * Sites that only ever refreshed single pages have no other trace. This runs before the
     * migration that moves them into an option, and only once per site.
     *
     * @return bool
     */
    private static function has_legacy_page_versions(): bool {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $found = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT 1 FROM {$wpdb->postmeta} WHERE meta_key = %s LIMIT 1",
                Versions_Storage_Service::OPTION_PAGE_VERSION_LEGACY
            )
        );

        return null !== $found;
    }

    /**
     * Get the last version a user saw in What's New.
     *
     * Users who have never seen it fall back to the site's first-installed version, so admins on
     * a fresh install aren't shown features that shipped before they started using the plugin.
     *
     * @param int $user_id The user ID.
     *
     * @return string|null The version, or null when everything in the current major is new.
     */
    public static function get_last_seen_version( int $user_id ): ?string {
        $last_seen = get_user_meta( $user_id, self::USER_META_LAST_SEEN_VERSION, true );
        if ( is_string( $last_seen ) && '' !== $last_seen ) {
            return $last_seen;
        }

        $first_installed = get_option( self::OPTION_FIRST_INSTALLED_VERSION, '' );
        return is_string( $first_installed ) && '' !== $first_installed ? $first_installed : null;
    }

    /**
     * Record that a user has seen What's New for a version.
     *
     * @param int    $user_id The user ID.
     * @param string $version The version they saw.
     *
     * @return void
     */
    public static function mark_seen( int $user_id, string $version ): void {
        update_user_meta( $user_id, self::USER_META_LAST_SEEN_VERSION, $version );
    }
}
