<?php
/**
 * Our API calls responsible for handling requests from admins to save new options.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define(
    'MESSAGE_SUCCESS_SAVE_OPTIONS',
    "You've successfully saved your options"
);

/**
 * Function used to save options for showing the refresh button in the admin bar.
 *
 * @return void
 */
function save_option_show_in_admin_bar() {
    // This function returns the post id after the nonce has already been validated.
    // phpcs:disable WordPress.Security.NonceVerification
    $refresh_option_show_in_admin_bar = isset( $_REQUEST['show_refresh_in_admin_bar'] )
    ? sanitize_text_field( wp_unslash( $_REQUEST['show_refresh_in_admin_bar'] ) )
    : null;
    // phpcs:enable WordPress.Security.NonceVerification
    if ( null !== $refresh_option_show_in_admin_bar ) {
        update_option(
            WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR,
            $refresh_option_show_in_admin_bar
        );
    }
};

/**
 * Function used to save options for the refresh interval.
 *
 * @return void
 */
function save_option_refresh_interval() {
    // This function returns the post id after the nonce has already been validated.
    // phpcs:disable WordPress.Security.NonceVerification
    $refresh_option_refresh_interval = isset( $_REQUEST['refresh_interval'] )
    ? sanitize_text_field( wp_unslash( $_REQUEST['refresh_interval'] ) )
    : null;
    // phpcs:enable WordPress.Security.NonceVerification

    if ( $refresh_option_refresh_interval ) {
        update_option(
            WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
            $refresh_option_refresh_interval
        );
    }
};

/**
 * Function used by administrators to request a refresh of the site.
 *
 * @return  void
 */
function request_save_admin_options() {
    if ( ! is_user_authorized_to_request_refresh() ) {
        return_api_response(
            401,
            MESSAGE_ERROR_UNAUTHORIZED
        );
    } else {
        save_option_show_in_admin_bar();
        save_option_refresh_interval();

        return_api_response(
            200,
            MESSAGE_SUCCESS_SAVE_OPTIONS
        );
    }
}

// Register the action used by administrators to refresh the site.
add_action(
    'wp_ajax_force_refresh_update_site_options',
    __NAMESPACE__ . '\\request_save_admin_options'
);
