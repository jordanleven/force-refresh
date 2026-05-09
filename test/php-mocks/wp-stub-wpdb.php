<?php
/**
 * Stub for the global $wpdb object used in unit tests.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'wpdb' ) ) {
    /**
     * Minimal stub for wpdb.
     */
    class wpdb {

        /**
         * The postmeta table name.
         *
         * @var string
         */
        public string $postmeta = 'wp_postmeta';

        /**
         * Constructor — accepts optional credentials so callers match the real wpdb signature.
         *
         * @param string $dbuser     Unused in stub.
         * @param string $dbpassword Unused in stub.
         * @param string $dbname     Unused in stub.
         * @param string $dbhost     Unused in stub.
         */
        public function __construct( // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
            string $dbuser = '',
            string $dbpassword = '',
            string $dbname = '',
            string $dbhost = ''
        ) {}

        /**
         * Rows returned by the next get_results() call.
         *
         * @var array
         */
        private array $next_results = array();

        /**
         * Arguments passed to the last delete() call.
         *
         * @var array|null
         */
        public ?array $last_delete_args = null;

        /**
         * Arguments passed to the last prepare() call.
         *
         * @var array|null
         */
        public ?array $last_prepare_args = null;

        /**
         * Set the rows that get_results() will return on the next call.
         *
         * @param array $rows The rows to return.
         *
         * @return void
         */
        public function set_next_results( array $rows ): void {
            $this->next_results = $rows;
        }

        /**
         * Stub for wpdb::prepare().
         *
         * @param string $query  The query template.
         * @param mixed  ...$args The values to substitute.
         *
         * @return string The query (unmodified in this stub).
         */
        public function prepare( string $query, ...$args ): string {
            $this->last_prepare_args = array_merge( array( $query ), $args );
            return $query;
        }

        /**
         * Stub for wpdb::get_results().
         *
         * @param string $query Unused in this stub.
         *
         * @return array The pre-set rows.
         */
        public function get_results( string $query ): array { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
            return $this->next_results;
        }

        /**
         * Stub for wpdb::delete().
         *
         * @param string $table  The table name.
         * @param array  $where  The WHERE clause conditions.
         *
         * @return void
         */
        public function delete( string $table, array $where ): void {
            $this->last_delete_args = array( $table, $where );
        }
    }
}
