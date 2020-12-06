<?php
/**
 * Action responsible for adding the area to request a refresh of the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

require __DIR__ . '/inc.troubleshooting.php';

// The ID of the container we'll append our force refresh component to.
define( 'HTML_ID_MAIN', 'force-refresh-main' );

/**
 * Main function to manage settings for Force Refresh.
 *
 * @return void
 */
function force_refresh_main_settings() {
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
            __NAMESPACE__ . '\\force_refresh_main_settings'
        );
    }
);
