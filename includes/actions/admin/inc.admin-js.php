<?php
/**
 * Our action to enqueue our Admin JavaScript.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Hook used to enqueue CSS and JS.
 *
 * @return void
 */
add_action(
    'admin_head',
    function () {
        // Include the admin JS.
        add_script( 'force-refresh-main-admin-js', '/dist/js/force-refresh-main-admin.js', true );
        // Create the data we're going to localize to the script.
        $localized_data = array();
        // Add the API URL for the script.
        $localized_data['api_url'] = get_stylesheet_directory_uri();
        // Add the API URL for the script.
        $localized_data['site_id'] = get_current_blog_id();
        // Create a nonce for the user.
        $localized_data['nonce'] = wp_create_nonce( WP_FORCE_REFRESH_ACTION );
        // Add the ID of the handlebars notice.
        $localized_data['handlebars_admin_notice_template_id'] =
        WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID;
        // Add the refresh interval.
        $localized_data['refresh_interval'] = get_option(
            WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
            WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
        );
        // Localize the data.
        wp_localize_script(
            'force-refresh-main-admin-js',
            'force_refresh_local_js',
            $localized_data
        );
        // Now that it's registered, enqueue the script.
        wp_enqueue_script( 'force-refresh-main-admin-js' );
    }
);
