<?php
/**
 * Stub for the WordPress WP_Http class.
 *
 * @package ForceRefresh
 */

if ( ! class_exists( 'WP_Http' ) ) {
    /**
     * Stub for WP_Http.
     */
    class WP_Http {
        const OK                    = 200;
        const CREATED               = 201;
        const ACCEPTED              = 202;
        const BAD_REQUEST           = 400;
        const UNAUTHORIZED          = 401;
        const FORBIDDEN             = 403;
        const NOT_FOUND             = 404;
        const INTERNAL_SERVER_ERROR = 500;
    }
}
