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
     * @var string[]
     */
    const OPTIONS_INDICATING_EXISTING_INSTALL = array(
        Migration_Service::OPTION_MIGRATIONS_RAN,
        Versions_Storage_Service::OPTION_SITE_VERSION,
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
     * string, which means they are upgrading and should see What's New.
     *
     * @param string $version The currently installed plugin version.
     *
     * @return void
     */
    public static function record_first_installed_version( string $version ): void {
        if ( self::has_recorded_first_installed_version() ) {
            return;
        }

        $is_existing_install = false;
        foreach ( self::OPTIONS_INDICATING_EXISTING_INSTALL as $option ) {
            if ( false !== get_option( $option ) ) {
                $is_existing_install = true;
                break;
            }
        }

        update_option( self::OPTION_FIRST_INSTALLED_VERSION, $is_existing_install ? '' : $version );
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
