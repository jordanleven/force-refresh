<?php
/**
 * Stub for WP_Filesystem_Base.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_Filesystem_Base' ) ) {
    /**
     * Stub for WP_Filesystem_Base.
     *
     * Signatures match the real WordPress class so child-class overrides remain
     * compatible with both our stub and the IDE's built-in WP stubs.
     */
    class WP_Filesystem_Base {

        /** @return string|false */
        public function get_contents( $file ) { return false; } // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /** @return bool */
        public function put_contents( $file, $contents, $mode = false ) { return false; } // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /** @return bool */
        public function exists( $path ) { return false; } // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /** @return bool */
        public function is_dir( $path ) { return false; } // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter

        /** @return bool */
        public function delete( $file, $recursive = false, $type = false ) { return false; } // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
    }
}
