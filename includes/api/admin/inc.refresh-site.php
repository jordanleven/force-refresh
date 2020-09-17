<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Function used by administrators to request a refresh of the site.
 *
 * @return  void
 */
function request_refresh_site() {
    if ( ! is_user_authorized_to_request_refresh() ) {
        return_api_response(
            401,
            MESSAGE_ERROR_UNAUTHORIZED
        );
    } else {
        $site_version = get_new_version();
        // Remove the old option.
        delete_option( 'force_refresh_current_site_version' );
        // Add the new option.
        add_option( 'force_refresh_current_site_version', $site_version );
        return_api_response(
            200,
            MESSAGE_SUCCESS_SITE,
            array(
                'new_site_version' => $site_version,
            )
        );
    }
}

// Register the action used by administrators to refresh the site.
add_action(
    'wp_ajax_force_refresh_update_site_version',
    __NAMESPACE__ . '\\request_refresh_site'
);
