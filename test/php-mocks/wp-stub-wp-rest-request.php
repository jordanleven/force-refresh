<?php
/**
 * Stub for the WordPress WP_REST_Request class.
 *
 * @package ForceRefresh
 */

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
