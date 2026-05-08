<?php
/**
 * Our class responsible for options storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Services\Version_File_Service;

/**
 * Class for debug storage services.
 */
class Options_Storage_Service {

    /**
     * The option for enabling static file polling.
     *
     * @var string
     */
    const OPTION_STATIC_FILE_POLLING = 'force_refresh_use_static_file_polling';

    /**
     * The option for showing the Force Refresh button in the WordPress Admin Bar.
     *
     * @var string
     */
    const OPTION_SHOW_IN_WP_ADMIN_BAR = 'force_refresh_show_in_wp_admin_bar';

    /**
     * The option for the refresh interval (how often the site should check for a new version).
     *
     * @var string
     */
    const OPTION_REFRESH_INTERVAL_IN_SECONDS = 'force_refresh_refresh_interval';

    /**
     * Th=ge default refresh interval.
     *
     * @var int
     */
    const OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT = 120;

    /**
     * Method for getting the current refresh interval.
     *
     * @return int The refresh interval in seconds.
     */
    public static function get_refresh_interval(): int {
        return (int) get_option(
            self::OPTION_REFRESH_INTERVAL_IN_SECONDS,
            self::OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
        );
    }

    /**
     * Method for getting the current set option for showing Force Refresh in admin bar.
     *
     * @return bool True if the option is active.
     */
    public static function get_show_in_admin_bar(): bool {
        $show_in_admin_bar = get_option(
            self::OPTION_SHOW_IN_WP_ADMIN_BAR,
            'false'
        );

        // For previous versions of Force Refresh where options were stored as strings.
        if ( in_array( $show_in_admin_bar, array( 'true', 'false' ), true ) ) {
            return 'true' === $show_in_admin_bar;
        }

        return $show_in_admin_bar;
    }

    /**
     * Function used to save options for showing the refresh button in the admin bar.
     *
     * @param string $show_refresh_in_admin_bar True if we should show refresh in admin bar.
     *
     * @return void
     */
    public static function set_option_show_in_admin_bar( string $show_refresh_in_admin_bar ): void {
        update_option(
            self::OPTION_SHOW_IN_WP_ADMIN_BAR,
            $show_refresh_in_admin_bar
        );
    }

    /**
     * Function used to save options for the refresh interval.
     *
     * @param string $refresh_interval_in_seconds The updated refresh interval in seconds.
     *
     * @return void
     */
    public static function set_option_refresh_interval( string $refresh_interval_in_seconds ): void {
        update_option(
            self::OPTION_REFRESH_INTERVAL_IN_SECONDS,
            $refresh_interval_in_seconds
        );
    }

    /**
     * Method for getting whether static file polling is enabled.
     *
     * @return bool True if the option is active.
     */
    public static function get_use_static_file_polling(): bool {
        return (bool) get_option( self::OPTION_STATIC_FILE_POLLING, false );
    }

    /**
     * Method for setting whether static file polling is enabled.
     *
     * When disabling the option, the version file is deleted so that clients fall back to REST.
     *
     * @param bool $enabled Whether static file polling should be enabled.
     *
     * @return void
     */
    public static function set_use_static_file_polling( bool $enabled ): void {
        update_option( self::OPTION_STATIC_FILE_POLLING, $enabled );

        if ( ! $enabled ) {
            Version_File_Service::delete();
        }
    }
}
