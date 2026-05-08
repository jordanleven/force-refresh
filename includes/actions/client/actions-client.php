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
use JordanLeven\Plugins\ForceRefresh\Services\Feature_Flag_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Version_File_Service;

/**
 * Build the localized data array passed to the client JS.
 *
 * @return array
 */
function get_client_localized_data(): array {
    $use_static_file_polling = Options_Storage_Service::get_use_static_file_polling();

    return array(
        'apiEndpoint'     => Api_Handler_Client::get_rest_endpoint(),
        'postId'          => get_the_ID(),
        'isDebugActive'   => Debug_Storage_Service::debug_mode_is_active(),
        'refreshInterval' => Options_Storage_Service::get_refresh_interval(),
        'featureFlags'    => Feature_Flag_Service::get_all(),
        'versionFileUrl'  => $use_static_file_polling ? Version_File_Service::get_public_url() : null,
    );
}

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
            get_client_localized_data()
        );
        // Now that it's registered, enqueue the script.
        wp_enqueue_script( 'force-refresh-js' );
    }
);
