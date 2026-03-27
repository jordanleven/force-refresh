<?php
/**
 * Our class responsible for feature flag services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for feature flag services.
 */
class Feature_Flag_Service {

    /**
     * Cached feature flags loaded from config.
     *
     * @var array|null
     */
    private static $flags = null;

    /**
     * Load and cache the feature flags from config.
     *
     * @return array The feature flags.
     */
    private static function get_flags(): array {
        if ( null === self::$flags ) {
            $config_path = WP_FORCE_REFRESH_PLUGIN_DIR . '/config/feature-flags.php';
            self::$flags = file_exists( $config_path ) ? require $config_path : array();
        }

        return self::$flags;
    }

    /**
     * Check whether a feature flag is enabled.
     *
     * @param string $flag The flag name.
     *
     * @return bool True if the flag is enabled.
     */
    public static function is_enabled( string $flag ): bool {
        $flags = self::get_flags();

        return (bool) ( $flags[ $flag ] ?? false );
    }

    /**
     * Return all feature flags. Used to pass flags to JavaScript.
     *
     * @return array The full flags array.
     */
    public static function get_all(): array {
        return self::get_flags();
    }
}
