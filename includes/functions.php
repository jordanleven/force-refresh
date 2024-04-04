<?php
/**
 * All of our utility functions that are used throughout the plugin.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

/**
 * Function to print out an error message to the user
 *
 * @param string $message The message to display.
 *
 * @return  void
 */
function print_error( string $message ): void {
    printf( '<div class="notice notice-error">%s</div>', esc_html( $message ) );
}

/**
 * Function for adding scripts for this plugin.
 *
 * @param string  $handle The script handle.
 *
 * @param string  $path The path to the script (relative to the JS dist directory).
 *
 * @param boolean $register Whether we should simply register the script instead of enqueuing it.
 */
function add_script( $handle, $path, $register = false ) {
    // Get the file path.
    $file_path = get_force_refresh_plugin_directory() . $path;
    // If the file doesn't exist, throw an error.
    if ( ! file_exists( $file_path ) ) {
        print_error( "${path} is missing." );
        return;
    }

    // Get the file version.
    $file_version = filemtime( $file_path );
    // If we want to only register the script.
    if ( $register ) {
        wp_register_script(
            $handle,
            get_force_refresh_plugin_url( $path ),
            array(),
            $file_version,
            true
        );

        return;
    }

    // Enqueue the style.
    wp_enqueue_script(
        $handle,
        get_force_refresh_plugin_url( $path ),
        array(),
        $file_version,
        true
    );
}

/**
 * Function for enqueueing styles for this plugin.
 *
 * @param string $handle The stylesheet handle.
 * @param string $path The path to the stylesheet (relative to the CSS dist directory).
 *
 * @return void
 */
function add_style( $handle, $path ) {
    // Get the file path.
    $file_path = get_force_refresh_plugin_directory() . $path;
    // If the file doesn't exist, throw an error.
    if ( ! file_exists( $file_path ) ) {
        print_error( "${path} is missing." );
        return;
    }

    // Get the file version.
    $file_version = filemtime( $file_path );
    // Enqueue the style.
    wp_enqueue_style( $handle, get_force_refresh_plugin_url( $path ), array(), $file_version );
}

/**
 * Function to determine whether or not the currently logged-in user is able to request a refresh.
 *
 * @return  bool true if the use is able to request a refresh
 */
function user_can_request_force_refresh() {
    return current_user_can( WP_FORCE_REFRESH_CAPABILITY );
}

/**
 * Function for getting the directory for this plugin
 *
 * @return string The full directory this plugin is located in (including the plugin directory)
 */
function get_force_refresh_plugin_directory() {
    // Declare our plugin directory.
    $plugin_directory = plugin_dir_path( get_main_plugin_file() );
    return $plugin_directory;
}

/**
 * Function for getting the URI for this plugin.
 *
 * @param  string $file The optional file path you want to append to the urldecode(str).
 *
 * @return string The full url for the root of this plugin is located in (including the plugin
 *                directory)
 */
function get_force_refresh_plugin_url( $file = null ) {
    // Declare our plugin directory.
    $plugin_url = plugins_url( $file, get_main_plugin_file() );
    return $plugin_url;
}

/**
 * Function to conditionally log data based if WP_DEBUG is set.
 *
 * @param mixed $log The data to log.
 *
 * @return void
 */
function logger( $log ): void {
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG === true ) {
        // phpcs:disable WordPress.PHP.DevelopmentFunctions
        $log_formatted = sprintf( 'Force Refresh - %s', print_r( $log, true ) );
        error_log( $log_formatted );
        // phpcs:enable
    }
}
