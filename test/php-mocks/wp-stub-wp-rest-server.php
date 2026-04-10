<?php
/**
 * Stub for the WordPress WP_REST_Server class.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_REST_Server' ) ) {
    /**
     * Stub for WP_REST_Server.
     */
    class WP_REST_Server {
        const CREATABLE = 'POST';
        const READABLE  = 'GET';
        const EDITABLE  = 'POST, PUT, PATCH';
        const DELETABLE = 'DELETE';
    }
}
