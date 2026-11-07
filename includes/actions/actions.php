<?php
/**
 * All of our package actions to register.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Services\Migration_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Whats_New_Service;

/**
 * Record the version Force Refresh was first installed at, before migrations create options
 * that would make a fresh install look like an upgrade.
 *
 * @return void
 */
function record_first_installed_version(): void {
    if ( Whats_New_Service::has_recorded_first_installed_version() ) {
        return;
    }

    Whats_New_Service::record_first_installed_version( (string) get_force_refresh_plugin_data()['Version'] );
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\\record_first_installed_version', 5 );
add_action( 'plugins_loaded', array( Migration_Service::class, 'run_pending' ) );

require_once __DIR__ . '/admin/actions-admin.php';
require_once __DIR__ . '/client/actions-client.php';
