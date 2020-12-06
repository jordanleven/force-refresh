<?php
/**
 * Our action that enqueues all required admin scripts.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

// The name of the main admin JS file.
define( 'FILE_NAME_ADMIN_MAIN', 'force-refresh-admin' );

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
 * Function to retrieve the localized data used in the admin script.
 *
 * @return  array   The data to localize to the script
 */
function get_localized_data(): array {
    // Get the current screen.
    $current_screen = get_current_screen();

    return array(
        // Wrap in inner array to preserve primitive types.
        'localData' => array(
            'siteId'                      => get_current_blog_id(),
            // Create a nonce for the user.
            'nonce'                       => wp_create_nonce( WP_FORCE_REFRESH_ACTION ),
            'siteName'                    => get_bloginfo(),
            'targetMain'                  => '#' . HTML_ID_MAIN,
            'targetAdminBar'              => '#' . HTML_ID_REFRESH_FROM_MENUBAR,
            'targetAdminMetaBox'          => '#' . HTML_ID_META_BOX,
            'targetNotificationContainer' => '#' . HTML_ID_REFRESH_NOTIFICATION_CONTAINER,
            'isDebugActive'               => get_option_debug_mode(),
            'refreshOptions'              => array(
                // Add the refresh interval.
                'refreshInterval'      => (int) get_force_refresh_option_refresh_interval(),
                'showRefreshInMenuBar' => get_force_refresh_option_show_in_admin_bar(),
            ),
            'postId'                      => get_the_ID(),
            'postType'                    => $current_screen->post_type,
            'postName'                    => get_the_title(),
            'isMultiSite'                 => (bool) is_multisite(),
            'currentSiteId'               => (int) get_current_blog_id(),
            'versions'                    => get_localized_data_versions(),
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
