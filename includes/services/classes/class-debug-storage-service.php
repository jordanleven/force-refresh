<?php
/**
 * Our class responsible for debug storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for debug storage services.
 */
class Debug_Storage_Service {

    const OPTION_DEBUG_ACTIVE_DATE = 'force_refresh_debug_active_date';

    const DEBUG_MODE_ACTIVE_IN_HOURS = 48;

    /**
     * Method for getting the current debug mode.
     *
     * @return  bool    True if debug is active.
     */
    public static function debug_mode_is_active(): bool {
        $debug_active_date = (string) get_option( self::OPTION_DEBUG_ACTIVE_DATE, '' );

        if ( ! $debug_active_date ) {
            return false;
        }

        $time_current = strtotime( current_time( 'mysql' ) );
        $time_debug   = strtotime( $debug_active_date );

        $difference_in_hours = abs( $time_current - $time_debug ) / 3600;
        return $difference_in_hours < self::DEBUG_MODE_ACTIVE_IN_HOURS;
    }

    /**
     * Method for saving the debug mode.
     *
     * @param bool $debug_mode True if debug mode should be turned on.
     *
     * @return void
     */
    public static function set_debug_mode( bool $debug_mode ): void {
        if ( $debug_mode ) {
            $time = current_time( 'mysql' );
            update_option(
                self::OPTION_DEBUG_ACTIVE_DATE,
                $time
            );
        } else {
            delete_option( self::OPTION_DEBUG_ACTIVE_DATE );
        }
    }
}
