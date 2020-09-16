<?php
/**
 * Action responsible for adding the area to request a refresh of the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Main function to manage settings for Force Refresh.
 *
 * @return void
 */
function manage_force_refresh() {
    // See what the existing settings are for showing Force Refresh in the WordPress Admin bar.
    $preset_option_show_force_refresh_in_wp_admin_bar = get_option(
        WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR,
        false,
    );
    // See what the existing settings are for the refresh interval.
    $preset_option_refresh_interval = (string) get_option(
        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
        WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
    );
    // Render the HTML.
    render_handlebars(
        'force-refresh-main-admin.handlebars',
        array(
            'site_name' => get_bloginfo(),
            'nonce'     => wp_create_nonce( WP_FORCE_REFRESH_ACTION ),
            'options'   => array(
                // For the Show Force Refresh in Admin Menu option.
                'preset_value_force_refresh_in_admin_bar_show' =>
                  'true' === $preset_option_show_force_refresh_in_wp_admin_bar ? 'selected' : null,
                'preset_value_force_refresh_in_admin_bar_hide' =>
                  'false' === $preset_option_show_force_refresh_in_wp_admin_bar ? 'selected' : null,

                // For the refresh interval option.
                'preset_value_force_refresh_refresh_interval_30' =>
                  '30' === $preset_option_refresh_interval ? 'selected' : null,
                'preset_value_force_refresh_refresh_interval_60' =>
                  '60' === $preset_option_refresh_interval ? 'selected' : null,
                'preset_value_force_refresh_refresh_interval_90' =>
                  '90' === $preset_option_refresh_interval ? 'selected' : null,
                'preset_value_force_refresh_refresh_interval_120' =>
                  '120' === $preset_option_refresh_interval ? 'selected' : null,
            ),
        )
    );
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
