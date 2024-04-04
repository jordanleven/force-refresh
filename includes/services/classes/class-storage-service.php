<?php
/**
 * Our superclass responsible for storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Superclass for storage services.
 */
abstract class Storage_Service {

    /**
     * Method for getting an option from the WordPress database.
     *
     * @param string $option_name  The name of the option to get.
     * @param mixed  $default_option_value      The default value to return if the option doesn't exist.
     *
     * @return mixed The saved option
     */
    public static function get_option( string $option_name, $default_option_value = false ) {
        return get_option( $option_name, $default_option_value );
    }
}
