<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define(
    'MESSAGE_SUCCESS_SITE',
    'You\'ve successfully requested all browsers to refresh.'
);

define(
    'MESSAGE_SUCCESS_PAGE',
    'You\'ve successfully requested all browsers to refresh this page.'
);

define(
    'MESSAGE_ERROR_UNAUTHORIZED',
    'I\'m sorry, but you are not authorized to request refreshes.'
);

/**
 * Function to check the nonce provided in the call.
 *
 * @return  boolean True if the provided nonce is valid.
 */
function is_admin_nonce_valid() {
    return check_admin_referer( WP_FORCE_REFRESH_ACTION, 'nonce' );
}

/**
 * Function to retrieve a hash that can be used as the version. This function will
 * deliver a unique ID that can be used to identify a unique version of a site, page,
 * or post.
 *
 * @return  string  The unique version ID
 */
function get_new_version() {
    $time              = current_time( 'mysql' );
    $site_version_hash = wp_hash( $time );
    // Get the first eight characters (the chance of having a duplicate hash from
    // the first 8 characters is low).
    $site_version = substr( $site_version_hash, 0, 8 );
    return $site_version;
}

/**
 * Function to check whether or not a WordPress user is authorized to request a
 * refresh. This function will check both if a user's nonce is valid and whether
 * the user role has the proper permissions.
 *
 * @return  boolean True if the user is authorized to request a refresh
 */
function is_user_authorized_to_request_refresh() {
    return is_admin_nonce_valid() && user_can_request_force_refresh();
}

require_once __DIR__ . '/inc.refresh-page.php';
require_once __DIR__ . '/inc.refresh-site.php';
require_once __DIR__ . '/inc.save-debug.php';
require_once __DIR__ . '/inc.save-options.php';
