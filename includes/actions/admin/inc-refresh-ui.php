<?php
/**
 * Our action that enqueues all required admin scripts.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin_Debugging;
use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin_Options;
use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin_Refresh_Page;
use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin_Refresh_Site;
use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin_Schedule_Refresh_Site;
use JordanLeven\Plugins\ForceRefresh\Services\Debug_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;

// The name of the main admin JS file.
define( 'FILE_NAME_ADMIN_MAIN', 'force-refresh-admin' );

// Check if WordPress is loaded.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Function to return the localized data used for the troubleshooting page.
 *
 * @return  array   The versions data
 */
function get_localized_data_versions(): array {
    $force_refresh_plugin_data = get_plugin_data( get_main_plugin_file() );

    return array(
        'php'          => array(
            'version'         => (string) phpversion(),
            'versionRequired' => (string) $force_refresh_plugin_data['RequiresPHP'],
        ),
        'wordPress'    => array(
            'version'         => (string) get_bloginfo( 'version' ),
            'versionRequired' => (string) $force_refresh_plugin_data['RequiresWP'],
        ),
        'forceRefresh' => array(
            'version'         => (string) $force_refresh_plugin_data['Version'],
            'versionRequired' => (string) get_latest_plugin_version(),
        ),
    );
}

/**
 * Function to get the refresh options.
 *
 * @return  array  An array of refresh options.
 */
function get_refresh_options(): array {
    $interval_minimum_minutes = REFRESH_INTERVAL_CUSTOM_MINIMUM_IN_SECONDS / 60;
    $interval_maximum_minutes = REFRESH_INTERVAL_CUSTOM_MAXIMUM_IN_SECONDS / 60;

    return array(
        'customRefreshIntervalMaximumInMinutes' => (float) $interval_maximum_minutes,
        'customRefreshIntervalMinimumInMinutes' => (float) $interval_minimum_minutes,
        'refreshInterval'                       => Options_Storage_Service::get_refresh_interval(),
        'showRefreshInMenuBar'                  => Options_Storage_Service::get_show_in_admin_bar(),
    );
}

/**
 * Function to get all of the localized API endpoints.
 *
 * @return array An array of admin endpoints.
 */
function get_admin_api_endpoints(): array {
    return array(
        'refreshSite'         => Api_Handler_Admin_Refresh_Site::get_rest_endpoint(),
        'refreshPage'         => Api_Handler_Admin_Refresh_Page::get_rest_endpoint(),
        'options'             => Api_Handler_Admin_Options::get_rest_endpoint(),
        'debugging'           => Api_Handler_Admin_Debugging::get_rest_endpoint(),
        'scheduleRefreshSite' => Api_Handler_Admin_Schedule_Refresh_Site::get_rest_endpoint(),
    );
}

/**
 * Function to retrieve the localized data used in the admin script.
 *
 * @return  array   The data to localize to the script
 */
function get_localized_data(): array {
    $versions = get_localized_data_versions();
    return array(
        // Wrap in inner array to preserve primitive types.
        'localData' => array(
            'siteId'                      => get_current_blog_id(),
            'scheduledRefreshes'          => Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes(),
            // Create a nonce for the user.
            'nonce'                       => wp_create_nonce( 'wp_rest' ),
            'adminEndpoints'              => get_admin_api_endpoints(),
            'siteName'                    => get_bloginfo(),
            'targetMain'                  => '#' . HTML_ID_MAIN,
            'targetAdminBar'              => '#' . HTML_ID_REFRESH_FROM_MENUBAR,
            'targetAdminMetaBox'          => '#' . HTML_ID_META_BOX,
            'targetNotificationContainer' => '#' . HTML_ID_REFRESH_NOTIFICATION_CONTAINER,
            'isDebugActive'               => Debug_Storage_Service::debug_mode_is_active(),
            'refreshOptions'              => get_refresh_options(),
            'releaseNotes'                => get_release_notes( $versions['forceRefresh']['version'] ),
            'postId'                      => get_the_ID(),
            'postType'                    => get_current_screen()->post_type,
            'postName'                    => get_the_title(),
            'isMultiSite'                 => (bool) is_multisite(),
            'currentSiteId'               => (int) get_current_blog_id(),
            'versions'                    => $versions,
        ),
    );
}
/**
 * Function for enqueueing the admin script.
 *
 * @return  void
 */
function enqueue_force_refresh_scripts(): void {
    add_script( FILE_NAME_ADMIN_MAIN, '/dist/js/force-refresh-admin.js', true );

    $localized_data = get_localized_data();

    // Localize the data.
    wp_localize_script( FILE_NAME_ADMIN_MAIN, 'forceRefreshMain', $localized_data );
    // Now that it's registered, enqueue the script.
    wp_enqueue_script( FILE_NAME_ADMIN_MAIN );
}

// Add the menu where we'll configure the settings.
add_action(
    'admin_enqueue_scripts',
    __NAMESPACE__ . '\\enqueue_force_refresh_scripts'
);
