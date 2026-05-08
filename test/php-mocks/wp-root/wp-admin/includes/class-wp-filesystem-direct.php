<?php
/**
 * Stub for WP_Filesystem_Direct.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_Filesystem_Direct' ) ) {
    /**
     * Stub for WP_Filesystem_Direct.
     *
     * Parameter signatures intentionally match the real WordPress class (untyped,
     * $mode defaults to false) so this stub remains compatible with both our
     * WP_Filesystem_Base stub and the IDE's built-in WP stubs.
     */
    class WP_Filesystem_Direct extends WP_Filesystem_Base {

        /**
         * Constructor.
         *
         * @param mixed $arg Unused.
         */
        public function __construct( $arg ) {} // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /** @return string|false */
        public function get_contents( $file ) {
            return file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
        }

        /** @return bool */
        public function put_contents( $file, $contents, $mode = false ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
            return (bool) file_put_contents( $file, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions
        }

        /** @return bool */
        public function exists( $path ) {
            return file_exists( $path );
        }

        /** @return bool */
        public function is_dir( $path ) {
            return is_dir( $path );
        }

        /** @return bool */
        public function delete( $file, $recursive = false, $type = false ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
            return unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
        }
    }
}
