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
     * The name of the constant that overrides flags from `wp-config.php`.
     *
     * Its value is an array of flag name to boolean, for example
     * `define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'websockets' => true ) );`.
     *
     * @var string
     */
    const OVERRIDE_CONSTANT = 'FORCE_REFRESH_FEATURE_FLAGS';

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
            $flags       = file_exists( $config_path ) ? require $config_path : array();
            self::$flags = self::apply_overrides( $flags );
        }

        return self::$flags;
    }

    /**
     * Apply the overrides a site owner defined in `wp-config.php`.
     *
     * Only flags that exist in the config file can be overridden, so a typo or
     * a flag from another version never reaches the rest of the plugin.
     *
     * @param array $flags The flags loaded from config.
     *
     * @return array The flags with any overrides applied.
     */
    private static function apply_overrides( array $flags ): array {
        if ( ! defined( self::OVERRIDE_CONSTANT ) ) {
            return $flags;
        }

        $overrides = constant( self::OVERRIDE_CONSTANT );

        if ( ! is_array( $overrides ) ) {
            return $flags;
        }

        foreach ( array_intersect_key( $overrides, $flags ) as $flag => $is_enabled ) {
            $flags[ $flag ] = (bool) $is_enabled;
        }

        return $flags;
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
