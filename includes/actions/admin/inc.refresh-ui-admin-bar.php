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
 * Function to determine whether or not to include admin bar HTML.
 *
 * @return  bool    True if the admin bar HTML should be rendered.
 */
function render_admin_bar_html(): bool {
    return user_can_request_force_refresh() && get_force_refresh_option_show_in_admin_bar();
}

/**
 * Function to show the Force Refresh option in the WP Admin bar.
 *
 * @return void
 */
function show_force_refresh_in_wp_admin_bar() {
    // Globalize the WP Admin Bar object.
    global $wp_admin_bar;

    // If the user isn't able to request a refresh, then stop eval.
    if ( ! render_admin_bar_html() || ! is_admin() ) {
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

add_action(
    'wp_before_admin_bar_render',
    __NAMESPACE__ . '\\show_force_refresh_in_wp_admin_bar',
    999
);

add_action(
    'in_admin_header',
    function () {
        // If the user isn't able to request a refresh, then stop eval.
        if ( ! render_admin_bar_html() ) {
            return;
        }

        echo '<div id="' . esc_html( HTML_ID_REFRESH_NOTIFICATION_CONTAINER ) . '"></div>';
    }
);
