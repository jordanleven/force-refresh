<?php
/**
 * Stub for the WordPress WP_REST_Response class.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_REST_Response' ) ) {
    /**
     * Stub for WP_REST_Response.
     */
    class WP_REST_Response {

        /**
         * The response data.
         *
         * @var mixed
         */
        private $data;

        /**
         * The HTTP status code.
         *
         * @var int
         */
        private int $status;

        /**
         * Constructor.
         *
         * @param mixed $data   The response data.
         * @param int   $status The HTTP status code.
         */
        public function __construct( $data = null, int $status = 200 ) {
            $this->data   = $data;
            $this->status = $status;
        }

        /**
         * Get the response data.
         *
         * @return mixed
         */
        public function get_data() {
            return $this->data;
        }

        /**
         * Get the HTTP status code.
         *
         * @return int
         */
        public function get_status(): int {
            return $this->status;
        }
    }
}
