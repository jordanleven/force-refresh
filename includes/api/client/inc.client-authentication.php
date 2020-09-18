<?php
/**
 * Authentication for client-side calls to the API.
 *
 * @package ForceRefresh
 */

/**
 * Function to check the nonce provided in the call.
 *
 * @return  boolean True if the provided nonce is valid.
 */
function is_client_nonce_valid() {
    $nonce = isset( $_REQUEST['nonce'] )
    ? sanitize_text_field( wp_unslash( $_REQUEST['nonce'] ) )
    : null;
    return wp_verify_nonce( $nonce, WP_ACTION_GET_VERSION );
}
