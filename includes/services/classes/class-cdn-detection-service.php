<?php
/**
 * Our class responsible for detecting CDN proxies from incoming request headers.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for CDN detection services.
 */
class Cdn_Detection_Service {

    /**
     * Return the name of the detected CDN, or null when none is found.
     *
     * Checks known header fingerprints in order of prevalence. Returns the
     * first match so callers get a single, human-readable string.
     *
     * @return string|null The CDN name, or null when undetected.
     */
    public static function get_detected_cdn(): ?string {
        if ( self::is_cloudflare() ) {
            return 'Cloudflare';
        }

        if ( self::is_sucuri() ) {
            return 'Sucuri';
        }

        if ( self::is_varnish() ) {
            return 'Varnish';
        }

        return null;
    }

    /**
     * Detect Cloudflare via the CF-Ray header, which is present on every
     * request Cloudflare proxies to the origin.
     *
     * @return bool
     */
    private static function is_cloudflare(): bool {
        return isset( $_SERVER['HTTP_CF_RAY'] );
    }

    /**
     * Detect Sucuri via the X-Sucuri-ID header, which Sucuri sends on every
     * proxied request to the origin — unlike X-Sucuri-Cache, which is only
     * present on cache hits.
     *
     * @return bool
     */
    private static function is_sucuri(): bool {
        return isset( $_SERVER['HTTP_X_SUCURI_ID'] );
    }

    /**
     * Detect Varnish via the Via header containing the string "varnish".
     *
     * @return bool
     */
    private static function is_varnish(): bool {
        $via = isset( $_SERVER['HTTP_VIA'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_VIA'] ) ) : '';
        return str_contains( $via, 'varnish' );
    }
}
