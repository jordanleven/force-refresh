<?php
/**
 * Our action that enables refreshing the site from the admin bar.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

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

    // Add the item to show up in the WP Admin Bar.
    $args = array(
        'id'    => 'force-refresh',
        'title' =>
          '<i class="fa fa-refresh" aria-hidden="true"></i> <span>Force Refresh Site</span>',
        'href'  => null,
    );
    // Add the menu.
    $wp_admin_bar->add_menu( $args );
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
        }
        // Since a Force Refresh can take place from any page, we also need to add the Handlebars
        // template for a notice.
        add_handlebars(
            WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID,
            'force-refresh-main-admin-notice.handlebars'
        );
    }
);
