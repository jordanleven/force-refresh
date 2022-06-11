<?php
/**
 * The main init file for the Force Refresh plugin.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

// phpcs:disable Generic.Files.LineLength

/*
Plugin Name: Force Refresh
Plugin URI: https://github.com/jordanleven/force-refresh
Description: Force Refresh is a simple plugin that allows you to force a page refresh for users currently visiting your site.
Version: 2.6.0
Requires at least: 5.2
Requires PHP: 7.4
Author: Jordan Leven
Author URI: https://github.com/jordanleven
Contributors:
*/

// phpcs:enable Generic.Files.LineLength

// Define the name of the action for the refresh. This is used with the nonce to create a unique
// action when admins request a refresh.
define( 'WP_FORCE_REFRESH_ACTION', 'wp_force_refresh' );
// The slug used for Force Refresh on the WordPress.org site.
define( 'WP_FORCE_REFRESH_REPOSITORY_SLUG', 'force-refresh' );
// Define the name of the capability used to invoke a refresh. This is used for developers who want
// to fine-tune control of what types of users and roles can request a refresh.
define( 'WP_FORCE_REFRESH_CAPABILITY', 'invoke_force_refresh' );
// Define the option for showing the Force Refresh button in the WordPress Admin Bar.
define( 'WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR', 'force_refresh_show_in_wp_admin_bar' );
// Define the option for the refresh interval (how often the site should check for a new version).
define( 'WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS', 'force_refresh_refresh_interval' );
// Define the option for whether or not debug mode is active.
define( 'WP_FORCE_REFRESH_OPTION_DEBUG_ACTIVE_DATE', 'force_refresh_debug_active_date' );
// Define the default refresh interval.
define( 'WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT', 120 );
// All the post types to exclude force refreshing from.
define( 'WP_FORCE_REFRESH_EXCLUDE_FROM_POST_TYPES', array( 'attachment' ) );
// The action used by browsers to get the current site and page versions. This is used to generate
// the nonce.
define( 'WP_ACTION_GET_VERSION', 'wp_get_version' );

/**
 * Function used to retrieve the main file used in the plugin. This function is
 * used frequently by functions that require the apex file used in a plugin.
 *
 * @return string The file path for this file
 */
function get_main_plugin_file() {
    return __FILE__;
}

// Make sure we include the composer autoload file.
require_once __DIR__ . '/vendor/autoload.php';
// Include the functions file.
require_once __DIR__ . '/includes/functions.php';
// Register all of our actions.
require_once __DIR__ . '/includes/actions/actions.php';
// Include the API call functions.
require_once __DIR__ . '/includes/api/api.php';
