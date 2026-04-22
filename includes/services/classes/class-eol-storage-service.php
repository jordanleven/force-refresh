<?php
/**
 * Service for retrieving end-of-life dates from the endoflife.date API.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for EOL storage services.
 */
class Eol_Storage_Service {

    const TRANSIENT_TTL = DAY_IN_SECONDS;
    const API_BASE      = 'https://endoflife.date/api';
    const PRODUCT_PHP   = 'php';
    // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- endoflife.date expects the lowercase product slug.
    const PRODUCT_WORDPRESS = 'wordpress';

    /**
     * Returns the EOL date string for the current PHP version.
     *
     * @param string $version The full version string (e.g. '7.4.33').
     *
     * @return string|null The EOL date (e.g. '2022-11-28'), or null if not found.
     */
    public static function get_eol_date_php( string $version ): ?string {
        return self::get_eol_date( self::PRODUCT_PHP, $version );
    }

    /**
     * Returns the EOL date string for the current WordPress version.
     *
     * @param string $version The full version string (e.g. '6.8.1').
     *
     * @return string|null The EOL date (e.g. '2022-11-28'), or null if not found.
     */
    public static function get_eol_date_wordpress( string $version ): ?string {
        return self::get_eol_date( self::PRODUCT_WORDPRESS, $version );
    }

    /**
     * Returns the EOL date string for a given product and version, or null if not found.
     *
     * Matches the major.minor cycle from the full version string against the
     * endoflife.date API response. Results are cached via WordPress transients
     * for 24 hours.
     *
     * @param string $product The product slug (e.g. 'php').
     * @param string $version The full version string (e.g. '7.4.33').
     *
     * @return string|null The EOL date (e.g. '2022-11-28'), or null if not found.
     */
    private static function get_eol_date( string $product, string $version ): ?string {
        $cycle = self::get_cycle_from_version( $version );

        if ( null === $cycle ) {
            return null;
        }

        return self::find_eol_date_for_cycle( self::get_product_data( $product ), $cycle );
    }

    /**
     * Extract the major.minor cycle from a version string.
     *
     * @param string $version The full version string.
     *
     * @return string|null The extracted cycle, or null if the version is invalid.
     */
    private static function get_cycle_from_version( string $version ): ?string {
        if ( ! preg_match( '/^(\d+\.\d+)/', $version, $matches ) ) {
            return null;
        }

        return $matches[1];
    }

    /**
     * Get cached product data or fetch and cache it when missing.
     *
     * @param string $product The product slug.
     *
     * @return array The normalized product data.
     */
    private static function get_product_data( string $product ): array {
        $transient_key = self::get_transient_key( $product );
        $data          = get_transient( $transient_key );

        if ( false !== $data ) {
            return self::normalize_product_data( $data );
        }

        $data = self::fetch_product_data( $product );
        set_transient( $transient_key, $data, self::TRANSIENT_TTL );

        return $data;
    }

    /**
     * Fetch product data from the remote EOL API.
     *
     * @param string $product The product slug.
     *
     * @return array The normalized product data.
     */
    private static function fetch_product_data( string $product ): array {
        $response = wp_remote_get( self::API_BASE . '/' . $product . '.json' );

        if ( is_wp_error( $response ) ) {
            return array();
        }

        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        return self::normalize_product_data( $data );
    }

    /**
     * Normalize product data into a consistent array shape.
     *
     * @param mixed $data The raw product data.
     *
     * @return array The normalized product data.
     */
    private static function normalize_product_data( $data ): array {
        return is_array( $data ) ? $data : array();
    }

    /**
     * Find the EOL date for a given major.minor cycle.
     *
     * @param array  $data  The product lifecycle data.
     * @param string $cycle The major.minor cycle to match.
     *
     * @return string|null The EOL date, or null if not found.
     */
    private static function find_eol_date_for_cycle( array $data, string $cycle ): ?string {
        foreach ( $data as $entry ) {
            if ( isset( $entry['cycle'] ) && $entry['cycle'] === $cycle ) {
                return $entry['eol'] ?? null;
            }
        }

        return null;
    }

    /**
     * Build the transient key used for a product.
     *
     * @param string $product The product slug.
     *
     * @return string The transient key.
     */
    private static function get_transient_key( string $product ): string {
        return 'force_refresh_eol_' . $product;
    }
}
