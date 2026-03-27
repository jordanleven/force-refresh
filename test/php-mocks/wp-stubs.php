<?php
/**
 * WordPress class and constant stubs for unit testing.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_REST_Server' ) ) {
    /**
     * Stub for WP_REST_Server.
     */
    class WP_REST_Server {
        const CREATABLE  = 'POST';
        const EDITABLE   = 'POST, PUT, PATCH';
        const READABLE   = 'GET';
        const DELETABLE  = 'DELETE';
        const ALLMETHODS = 'GET, POST, PUT, PATCH, DELETE';
    }
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
    /**
     * Stub for WP_REST_Request.
     */
    class WP_REST_Request {

        /**
         * The request params.
         *
         * @var array
         */
        private array $params = array();

        /**
         * Set a request parameter.
         *
         * @param string $key   The parameter key.
         * @param mixed  $value The parameter value.
         *
         * @return void
         */
        public function set_param( string $key, $value ): void {
            $this->params[ $key ] = $value;
        }

        /**
         * Get a request parameter.
         *
         * @param string $key The parameter key.
         *
         * @return mixed
         */
        public function get_param( string $key ) {
            return $this->params[ $key ] ?? null;
        }
    }
}

if ( ! defined( 'WP_FORCE_REFRESH_CAPABILITY' ) ) {
    define( 'WP_FORCE_REFRESH_CAPABILITY', 'manage_options' );
}
