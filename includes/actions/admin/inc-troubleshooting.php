<?php
/**
 * Functions to help troubleshoot installations of Force Refresh.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

if ( ! function_exists( 'plugins_api' ) ) {
    require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
}

/**
 * Function to get the latest version of Force Refresh from the WordPress repository.
 *
 * @return  mixed Either null (if unable to get the version) or a string.
 */
function get_latest_plugin_version() {
    $args = array(
        'slug'   => WP_FORCE_REFRESH_REPOSITORY_SLUG,
        'fields' => array( 'version' => true ),
    );

    $call_api = plugins_api( 'plugin_information', $args );

    if ( ! is_wp_error( $call_api ) && ! empty( $call_api->version ) ) {
        return $call_api->version;
    }

    return null;
}
