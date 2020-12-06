<?php
/**
 * Our API calls responsible for handling requests from admins to update the debug mode.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define(
    'MESSAGE_SUCCESS_SAVE_DEBUG',
    "You've successfully updated the debugging mode."
);

/**
 * Function used to save the debug mode.
 *
 * @return void
 */
function save_option_set_debug_mode() {
    // This function returns the post id after the nonce has already been validated.
    // phpcs:disable WordPress.Security.NonceVerification
    $refresh_option_debug_mode = isset( $_REQUEST['debug'] )
    ? sanitize_text_field( wp_unslash( $_REQUEST['debug'] ) )
    : null;
    // phpcs:enable WordPress.Security.NonceVerification

    if ( 'true' === $refresh_option_debug_mode ) {
        $time = current_time( 'mysql' );
        update_option(
            WP_FORCE_REFRESH_OPTION_DEBUG_ACTIVE_DATE,
            $time
        );
    } else {
        delete_option( WP_FORCE_REFRESH_OPTION_DEBUG_ACTIVE_DATE );
    }
};

/**
 * Function used by administrators to update the current debug settings.
 *
 * @return  void
 */
function request_save_debug_settings() {
    if ( ! is_user_authorized_to_request_refresh() ) {
        return_api_response(
            401,
            MESSAGE_ERROR_UNAUTHORIZED
        );
    } else {
        save_option_set_debug_mode();

        return_api_response(
            200,
            MESSAGE_SUCCESS_SAVE_DEBUG
        );
    }
}

// Register the action used by administrators to update the debug settings.
add_action(
    'wp_ajax_force_refresh_update_debug_settings',
    __NAMESPACE__ . '\\request_save_debug_settings'
);
