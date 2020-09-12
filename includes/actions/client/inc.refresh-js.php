<?php
/**
 * The actions to register and enqueue all of our client-side JavaScript
 * to request site versions.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

// Add the script for normal front-facing pages (non-admin).
add_action(
    'wp_enqueue_scripts',
    function() {
        // Include the normal JS.
        add_script( 'force-refresh-js', '/dist/js/force-refresh.js', true );
        // Localize the admin ajax URL. This doesn't sound like the best idea but WP is into
        // it (https://codex.wordpress.org/AJAX_in_Plugins).
        wp_localize_script(
            'force-refresh-js',
            'force_refresh_js_object',
            array(
                // Get the ajax URL.
                'ajax_url'         => admin_url( 'admin-ajax.php' ),
                // Get the post ID.
                'post_id'          => get_the_ID(),
                'nonce'            => wp_create_nonce( WP_ACTION_GET_VERSION ),
                // Get the refresh interval.
                'refresh_interval' => get_option(
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT,
                ),
            )
        );
        // Now that it's registered, enqueue the script.
        wp_enqueue_script( 'force-refresh-js' );
    }
);
