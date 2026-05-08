<?php
/**
 * All of our package actions to register.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Services\Migration_Service;

add_action( 'plugins_loaded', array( Migration_Service::class, 'run_pending' ) );

require_once __DIR__ . '/admin/actions-admin.php';
require_once __DIR__ . '/client/actions-client.php';
