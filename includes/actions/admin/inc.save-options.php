<?php
/**
 * Our action for saving options from the admin page.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Hook used to save admin actions for Force Refresh.
 */
add_action(
    'admin_init',
    function () {
        // If we are saving data from the Force Refresh options.
        if (
            isset( $_POST['force-refresh-admin-options-save'] ) &&
            'true' === $_POST['force-refresh-admin-options-save']
          ) {
            check_admin_referer( WP_FORCE_REFRESH_ACTION, 'nonce' );
            // Get updated options for viewing the refresh button in the WP Admin bar.
            $show_in_admin_bar = isset( $_POST['show-in-wp-admin-bar'] )
            ? sanitize_text_field(
                wp_unslash( $_POST['show-in-wp-admin-bar'] )
            ) : false;
              // Update the show in Admin Bar option.
              update_option( WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR, $show_in_admin_bar );
              // Get updated options for the refresh interval.
              $refresh_interval = isset( $_POST['refresh-interval'] )
                ? sanitize_text_field( wp_unslash( $_POST['refresh-interval'] ) ) : null;
              // If the new refresh interval option came through all right.
            if ( $refresh_interval ) {
                // Update the refresh interval.
                update_option(
                    WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                    $refresh_interval
                );
            }
        }
    }
);
