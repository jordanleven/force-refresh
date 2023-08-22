<?php
/**
 * Our API calls responsible for handling requests from website visitors.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

/**
* Custom intervals must be at least 30 seconds.
*/
define( 'REFRESH_INTERVAL_CUSTOM_MINIMUM_IN_SECONDS', 30 );

/**
* Custom intervals must be, at max, four hours.
*/
define( 'REFRESH_INTERVAL_CUSTOM_MAXIMUM_IN_SECONDS', 4 * 3600 );

// Our admin API handlers.
require_once __DIR__ . '/register-endpoints.php';
