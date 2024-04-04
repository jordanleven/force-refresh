<?php
/**
 * The actions to register and enqueue all of our client-side JavaScript
 * to request site versions.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Client;
use JordanLeven\Plugins\ForceRefresh\Services\Debug_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;

// Add the script for normal front-facing pages (non-admin).
add_action(
    'wp_enqueue_scripts',
    function () {
        // Include the normal JS.
        add_script( 'force-refresh-js', '/dist/js/force-refresh.js', true );
        // Localize the admin ajax URL. This doesn't sound like the best idea but WP is into
        // it (https://codex.wordpress.org/AJAX_in_Plugins).
        wp_localize_script(
            'force-refresh-js',
            'forceRefreshLocalizedData',
            array(
                // Get the ajax URL.
                'apiEndpoint'     => Api_Handler_Client::get_rest_endpoint(),
                // Get the post ID.
                'postId'          => get_the_ID(),
                'isDebugActive'   => Debug_Storage_Service::debug_mode_is_active(),
                // Get the refresh interval.
                'refreshInterval' => Options_Storage_Service::get_refresh_interval(),
            )
        );
        // Now that it's registered, enqueue the script.
        wp_enqueue_script( 'force-refresh-js' );
    }
);
