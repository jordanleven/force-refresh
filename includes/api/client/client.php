<?php
/**
 * Our API calls responsible for handling requests from website visitors.
 *
 * @package ForceRefresh
 */

// Authentication for clients to request the refresh.
require_once __DIR__ . '/inc.client-authentication.php';
// Get the current site and page version.
require_once __DIR__ . '/inc.get-version.php';
