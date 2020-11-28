<?php
/**
 * Our action that enables refreshing the site from the admin bar.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define( 'FILE_NAME_ADMIN_BAR', 'force-refresh-menu-bar' );
define( 'HTML_ID_REFRESH_FROM_MENUBAR', 'force-refresh__menu-bar' );
define( 'HTML_ID_REFRESH_NOTIFICATION_CONTAINER', 'force-refresh-notification-container' );

/**
 * Function to show the Force Refresh option in the WP Admin bar.
 *
 * @return void
 */
function show_force_refresh_in_wp_admin_bar() {
    // Globalize the WP Admin Bar object.
    global $wp_admin_bar;

    // If the user isn't able to request a refresh, then stop eval.
    if ( ! user_can_request_force_refresh() ) {
        return;
    }

    // Add the menu.
    $wp_admin_bar->add_menu(
        array(
            'id'    => 'force-refresh',
            'title' => '<div id="' . HTML_ID_REFRESH_FROM_MENUBAR . '"></div>',
            'href'  => null,
        )
    );
}

/**
 * Hook used to enqueue CSS and JS, as well as add the optional Force Refresh button to the
 * WordPress Admin Bar.
 *
 * @return void
 */
add_action(
    'admin_head',
    function () {
        // Get this option from the database. Default value is null/false.
        $show_force_refresh_in_wp_admin_bar = get_option(
            WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR
        ) === 'true';
        // If the option to show Force Refresh in the admin bar is enabled, then we need to show the
        // item in the WordPress Admin Bar.
        if ( $show_force_refresh_in_wp_admin_bar ) {
            // Show the Force Refresh option in the WordPress Admin Bar.
            add_action(
                'wp_before_admin_bar_render',
                __NAMESPACE__ . '\\show_force_refresh_in_wp_admin_bar',
                999
            );

            // Include the admin JS.
            add_script( FILE_NAME_ADMIN_BAR, '/dist/js/force-refresh-admin-bar.js', true );
            // Create the data we're going to localize to the script.
            $localized_data = array(
                // Wrap in inner array to preserve primitive types.
                'localData' => array(
                    // Add the API URL for the script.
                    'apiUrl'                      => get_stylesheet_directory_uri(),
                    // Create a nonce for the user.
                    'nonce'                       => wp_create_nonce( WP_FORCE_REFRESH_ACTION ),
                    'target'                      => '#' . HTML_ID_REFRESH_FROM_MENUBAR,
                    'targetNotificationContainer' => '#' . HTML_ID_REFRESH_NOTIFICATION_CONTAINER,
                    // Add the refresh interval.
                    'refreshInterval'             => (int) get_option(
                        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
                    ),
                ),
            );
            // Localize the data.
            wp_localize_script( FILE_NAME_ADMIN_BAR, 'forceRefreshAdminLocalJs', $localized_data );
            // Now that it's registered, enqueue the script.
            wp_enqueue_script( FILE_NAME_ADMIN_BAR );
        }
    }
);

add_action(
    'in_admin_header',
    function () {
        echo '<div id="' . esc_html( HTML_ID_REFRESH_NOTIFICATION_CONTAINER ) . '"></div>';
    }
);
