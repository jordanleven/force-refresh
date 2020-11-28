<?php
/**
 * Action responsible for adding the area to request a refresh of the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

// The ID of the container we'll append our force refresh component to.
define( 'HTML_ID_MAIN', 'force-refresh-main' );
// The name of the main admin JS file.
define( 'FILE_NAME_ADMIN_MAIN', 'force-refresh-main-admin' );

/**
 * Main function to manage settings for Force Refresh.
 *
 * @return void
 */
function manage_force_refresh() {
    // See what the existing settings are for showing Force Refresh in the WordPress Admin bar.
    $show_force_refresh_in_menu_bar = (string) get_option(
        WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR,
        'false'
    );

    // See what the existing settings are for the refresh interval.
    $refresh_interval = (string) get_option(
        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
    );
    // Include the admin JS.
    add_script( FILE_NAME_ADMIN_MAIN, '/dist/js/force-refresh-main.js', true );

    $localized_data = array(
        // Wrap in inner array to preserve primitive types.
        'localData' => array(
            'siteId'         => get_current_blog_id(),
            // Create a nonce for the user.
            'nonce'          => wp_create_nonce( WP_FORCE_REFRESH_ACTION ),
            'siteName'       => get_bloginfo(),
            'target'         => '#' . HTML_ID_MAIN,
            'refreshOptions' => array(
                // Add the refresh interval.
                'refreshInterval'      => (int) $refresh_interval,
                'showRefreshInMenuBar' => 'true' === $show_force_refresh_in_menu_bar,
            ),
        ),
    );

    // Localize the data.
    wp_localize_script( FILE_NAME_ADMIN_MAIN, 'forceRefreshMain', $localized_data );
    // Now that it's registered, enqueue the script.
    wp_enqueue_script( FILE_NAME_ADMIN_MAIN );

    echo '<div id="' . esc_html( HTML_ID_MAIN ) . '"></div>';
}

// Add the menu where we'll configure the settings.
add_action(
    'admin_menu',
    function() {
        add_submenu_page(
            'tools.php',
            'Force Refresh',
            'Force Refresh',
            WP_FORCE_REFRESH_CAPABILITY,
            'force_refresh',
            __NAMESPACE__ . '\\manage_force_refresh'
        );
    }
);
