<?php
/**
 * Our API calls responsible for handling requests from website visitors.
 *
 * @package ForceRefresh
 */

/**
 * Function to get the current version of the site.
 *
 * @return  string The version of the site
 */
function get_current_version_site() {
    $current_site_version = get_option( 'force_refresh_current_site_version' );
    return $current_site_version ?? '0';
}

/**
 * Function to get the current version for a specific post.
 *
 * @param int $post_id  The post ID to check.
 *
 * @return  string The version of the provided post
 */
function get_current_version_post( int $post_id ) {
    $current_page_version = get_post_meta( $post_id, 'force_refresh_current_page_version', true );
    return $current_page_version ?? '0';
}

/**
 * Function used by ajax requests to get the current site version.
 *
 * @return void
 */
function get_version() {
    if ( ! is_client_nonce_valid() ) {
        return_api_response(
            403,
            'The nonce you provided is invalid.',
        );
    }
    // The nonce is validated as part of `is_client_nonce_valid`.
    // phpcs:disable WordPress.Security.NonceVerification

    // Get the post ID.
    $post_id = isset( $_REQUEST['post_id'] )
        ? sanitize_text_field( wp_unslash( $_REQUEST['post_id'] ) )
        : null;
    return_api_response(
        200,
        'The current site version has been successfully retrieved.',
        array(
            'current_site_version' => get_current_version_site(),
            'current_page_version' => get_current_version_post( $post_id ),
        )
    );

    // phpcs:enable WordPress.Security.NonceVerification
}

// The call used for users requesting the current site version from non-admins.
add_action(
    'wp_ajax_nopriv_force_refresh_get_version',
    __NAMESPACE__ . '\\get_version'
);

// The call used for users requesting the current site version from admins.
add_action(
    'wp_ajax_force_refresh_get_version',
    __NAMESPACE__ . '\\get_version'
);
