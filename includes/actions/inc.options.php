<?php
/**
 * All of our package actions to register.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define( 'DEBUG_MODE_ACTIVE_IN_HOURS', 48 );

/**
 * Function to get whether or not debug mode is currently enabled.
 *
 * @return  bool    True if debug mode is enabled
 */
function get_option_debug_mode(): bool {
    $debug_active_date = (string) get_option(
        WP_FORCE_REFRESH_OPTION_DEBUG_ACTIVE_DATE,
        ''
    );

    if ( ! $debug_active_date ) {
        return false;
    }

    $time_current = strtotime( current_time( 'mysql' ) );
    $time_debug   = strtotime( $debug_active_date );

    $difference_in_hours = abs( $time_current - $time_debug ) / 3600;
    return $difference_in_hours < DEBUG_MODE_ACTIVE_IN_HOURS;
}
