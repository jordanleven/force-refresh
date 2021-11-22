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
            'forceRefreshLocalizedData',
            array(
                // Get the ajax URL.
                'apiUrl'          => admin_url( 'admin-ajax.php' ),
                // Get the post ID.
                'postId'          => get_the_ID(),
                'isDebugActive'   => get_option_debug_mode(),
                // Get the refresh interval.
                'refreshInterval' => get_option(
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
                ),
            )
        );
        // Now that it's registered, enqueue the script.
        wp_enqueue_script( 'force-refresh-js' );
    }
);
