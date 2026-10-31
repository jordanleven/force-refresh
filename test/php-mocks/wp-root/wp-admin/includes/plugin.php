<?php
/**
 * Stub for wp-admin/includes/plugin.php.
 *
 * @package ForceRefresh
 */

if ( ! function_exists( 'get_plugin_data' ) ) {
    /**
     * Stub for get_plugin_data.
     *
     * @param string $plugin_file Path to the plugin file.
     * @param bool   $markup      Unused in this stub.
     * @param bool   $translate   Unused in this stub.
     * @return array Plugin data array.
     */
    function get_plugin_data( string $plugin_file, bool $markup = true, bool $translate = true ): array { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
        return array(
            'Name'        => 'Force Refresh',
            'Version'     => '0.0.0',
            'RequiresPHP' => '7.4',
            'RequiresWP'  => '5.0',
        );
    }
}
