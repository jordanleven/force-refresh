<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Function used to get the post ID of the post that is requesting a refresh.
 *
 * @return  mixed The post ID of the requested post or null
 */
function get_refresh_request_post_id() {
    // This function returns the post id after the nonce has already been validated.
    // phpcs:disable WordPress.Security.NonceVerification
    $post_id = isset( $_REQUEST['post_id'] )
    ? sanitize_text_field( wp_unslash( $_REQUEST['post_id'] ) )
    : null;
    // phpcs:enable WordPress.Security.NonceVerification
    return $post_id;
};

/**
 * Function used by administrators to request a refresh of a specific page.
 *
 * @return  void
 */
function request_refresh_page() {
    if ( ! is_user_authorized_to_request_refresh() ) {
        return_api_response(
            401,
            MESSAGE_ERROR_UNAUTHORIZED
        );
    } else {
        $page_version = get_new_version();
        // Get the page id.
        $page_id = get_refresh_request_post_id();
        // Remove the old.
        delete_post_meta( $page_id, 'force_refresh_current_page_version' );
        // Add the new.
        update_post_meta(
            $page_id,
            'force_refresh_current_page_version',
            $page_version,
            null,
            'no'
        );
        return_api_response(
            200,
            MESSAGE_SUCCESS_PAGE,
            array(
                'new_page_version' => $page_version,
                'refresh_interval' => (int) get_option(
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
                ),
            )
        );
    }//end if
}

// Register the action used by administrators to refresh a specific page.
add_action(
    'wp_ajax_force_refresh_update_page_version',
    __NAMESPACE__ . '\\request_refresh_page'
);
