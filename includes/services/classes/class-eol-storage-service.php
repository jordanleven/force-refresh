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

    /**
     * Returns the EOL date string for the current PHP version.
     *
     * @param string $version The full version string (e.g. '7.4.33').
     *
     * @return string|null The EOL date (e.g. '2022-11-28'), or null if not found.
     */
    public static function get_eol_date_php( string $version ): ?string {
        return self::get_eol_date( 'php', $version );
    }

    /**
     * Returns the EOL date string for the current WordPress version.
     *
     * @param string $version The full version string (e.g. '6.8.1').
     *
     * @return string|null The EOL date (e.g. '2022-11-28'), or null if not found.
     */
    public static function get_eol_date_wordpress( string $version ): ?string {
        // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- endoflife.date expects the lowercase product slug.
        return self::get_eol_date( 'wordpress', $version );
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
        if ( ! preg_match( '/^(\d+\.\d+)/', $version, $matches ) ) {
            return null;
        }

        $cycle         = $matches[1];
        $transient_key = 'force_refresh_eol_' . $product;
        $data          = get_transient( $transient_key );

        if ( false === $data ) {
            $response = wp_remote_get( self::API_BASE . '/' . $product . '.json' );

            if ( is_wp_error( $response ) ) {
                return null;
            }

            $body = wp_remote_retrieve_body( $response );
            $data = json_decode( $body, true );

            set_transient( $transient_key, $data, self::TRANSIENT_TTL );
        }

        if ( ! is_array( $data ) ) {
            return null;
        }

        foreach ( $data as $entry ) {
            if ( isset( $entry['cycle'] ) && $entry['cycle'] === $cycle ) {
                return $entry['eol'] ?? null;
            }
        }

        return null;
    }
}
