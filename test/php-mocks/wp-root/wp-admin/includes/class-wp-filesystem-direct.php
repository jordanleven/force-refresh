<?php
/**
 * Stub for WP_Filesystem_Direct.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_Filesystem_Direct' ) ) {
    /**
     * Stub for WP_Filesystem_Direct.
     */
    class WP_Filesystem_Direct extends WP_Filesystem_Base {

        /**
         * Constructor.
         *
         * @param mixed $arg Unused.
         */
        public function __construct( $arg ) {} // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /**
         * Get file contents.
         *
         * @param string $file The file path.
         * @return string
         */
        public function get_contents( string $file ): string {
            return file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
        }
    }
}
