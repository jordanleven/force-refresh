<?php
/**
 * Our class responsible for options storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Services\Feature_Flag_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Version_File_Service;

/**
 * Class for options storage services.
 */
class Options_Storage_Service {

    /**
     * The option for how browsers find out about a refresh.
     *
     * @var string
     */
    const OPTION_UPDATE_METHOD = 'force_refresh_update_method';

    /**
     * The legacy option for enabling static file polling.
     *
     * Superseded by OPTION_UPDATE_METHOD, but still written alongside it so that
     * a downgrade to a version that only knows this option keeps behaving.
     *
     * @var string
     */
    const OPTION_STATIC_FILE_POLLING = 'force_refresh_use_static_file_polling';

    /**
     * The update method where browsers poll the WordPress REST API.
     *
     * @var string
     */
    const UPDATE_METHOD_REST = 'rest';

    /**
     * The update method where browsers poll a static version file.
     *
     * @var string
     */
    const UPDATE_METHOD_STATIC_FILE = 'static_file';

    /**
     * The update method where browsers are nudged over a WebSocket relay.
     *
     * @var string
     */
    const UPDATE_METHOD_WEBSOCKETS = 'websockets';

    /**
     * Every update method that can be stored.
     *
     * @var string[]
     */
    const UPDATE_METHODS = array(
        self::UPDATE_METHOD_REST,
        self::UPDATE_METHOD_STATIC_FILE,
        self::UPDATE_METHOD_WEBSOCKETS,
    );

    /**
     * The feature flag that gates the WebSockets update method.
     *
     * @var string
     */
    const FEATURE_FLAG_WEBSOCKETS = 'websockets';

    /**
     * WebSockets is unavailable because its feature flag is off.
     *
     * @var string
     */
    const WEBSOCKETS_UNAVAILABLE_FEATURE_DISABLED = 'feature_disabled';

    /**
     * WebSockets is unavailable because no relay has been configured.
     *
     * @var string
     */
    const WEBSOCKETS_UNAVAILABLE_RELAY_NOT_CONFIGURED = 'relay_not_configured';

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
     * Method for getting the update method the site owner selected.
     *
     * The legacy static file option has the final say on whether static file
     * polling is on. That covers sites that have not been migrated yet, and
     * sites where an older version of the plugin changed the legacy option
     * after a downgrade.
     *
     * @return string One of the UPDATE_METHOD_* values.
     */
    public static function get_update_method(): string {
        $update_method          = get_option( self::OPTION_UPDATE_METHOD, null );
        $is_static_file_polling = (bool) get_option( self::OPTION_STATIC_FILE_POLLING, false );
        $is_known_method        = in_array( $update_method, self::UPDATE_METHODS, true );
        $is_static_file_method  = self::UPDATE_METHOD_STATIC_FILE === $update_method;

        if ( ! $is_known_method || $is_static_file_method !== $is_static_file_polling ) {
            return $is_static_file_polling ? self::UPDATE_METHOD_STATIC_FILE : self::UPDATE_METHOD_REST;
        }

        return $update_method;
    }

    /**
     * Method for setting the update method.
     *
     * The legacy static file option is kept in step, and the version file is
     * deleted when static file polling is not selected so that browsers that
     * are still polling it fall back to REST. Callers are expected to pass a
     * method that has already been validated.
     *
     * @param string $update_method One of the UPDATE_METHOD_* values.
     *
     * @return void
     */
    public static function set_update_method( string $update_method ): void {
        $is_static_file_polling = self::UPDATE_METHOD_STATIC_FILE === $update_method;

        update_option( self::OPTION_UPDATE_METHOD, $update_method );
        update_option( self::OPTION_STATIC_FILE_POLLING, $is_static_file_polling );

        if ( ! $is_static_file_polling ) {
            Version_File_Service::delete();
        }
    }

    /**
     * Method for getting the update method that browsers are actually given.
     *
     * A selected WebSockets method resolves to REST for as long as WebSockets
     * is unavailable, without changing what the site owner selected.
     *
     * @return string One of the UPDATE_METHOD_* values.
     */
    public static function get_effective_update_method(): string {
        $update_method = self::get_update_method();

        if ( self::UPDATE_METHOD_WEBSOCKETS === $update_method && ! self::is_websockets_available() ) {
            return self::UPDATE_METHOD_REST;
        }

        return $update_method;
    }

    /**
     * Method for getting whether static file polling is enabled.
     *
     * @return bool True if static file polling is the selected update method.
     */
    public static function get_use_static_file_polling(): bool {
        return self::UPDATE_METHOD_STATIC_FILE === self::get_update_method();
    }

    /**
     * Method for getting whether a WebSocket relay has been configured.
     *
     * There are no relay settings yet, so this is always false. When they are
     * added, this is the one place that needs to report the real answer.
     *
     * @return bool True if a relay is configured.
     */
    public static function is_relay_configured(): bool {
        return false;
    }

    /**
     * Method for getting why the WebSockets update method cannot be used.
     *
     * @return string|null One of the WEBSOCKETS_UNAVAILABLE_* values, or null when it can be used.
     */
    public static function get_websockets_unavailable_reason(): ?string {
        if ( ! Feature_Flag_Service::is_enabled( self::FEATURE_FLAG_WEBSOCKETS ) ) {
            return self::WEBSOCKETS_UNAVAILABLE_FEATURE_DISABLED;
        }

        if ( ! self::is_relay_configured() ) {
            return self::WEBSOCKETS_UNAVAILABLE_RELAY_NOT_CONFIGURED;
        }

        return null;
    }

    /**
     * Method for getting whether the WebSockets update method can be used.
     *
     * @return bool True if WebSockets can be selected and used.
     */
    public static function is_websockets_available(): bool {
        return null === self::get_websockets_unavailable_reason();
    }
}
