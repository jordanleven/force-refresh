<?php
/**
 * Tests for Cdn_Detection_Service.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../../includes/services/classes/class-cdn-detection-service.php';

/**
 * Test for Cdn_Detection_Service.
 */
final class CdnDetectionServiceTest extends TestCase {

    /**
     * The $_SERVER keys written by individual tests, reset after each test.
     *
     * @var array
     */
    private array $written_keys = array();

    /**
     * Remove any $_SERVER keys written during a test so each test starts clean.
     *
     * @return void
     */
    public function tearDown(): void {
        foreach ( $this->written_keys as $key ) {
            unset( $_SERVER[ $key ] );
        }

        $this->written_keys = array();
    }

    // -------------------------------------------------------------------------
    // No CDN
    // -------------------------------------------------------------------------

    /**
     * Returns null when no CDN headers are present.
     */
    public function testReturnsNullWhenNoCdnHeadersArePresent(): void {
        $this->assertNull( Cdn_Detection_Service::get_detected_cdn() );
    }

    // -------------------------------------------------------------------------
    // Cloudflare
    // -------------------------------------------------------------------------

    /**
     * Detects Cloudflare from the CF-Ray header.
     */
    public function testDetectsCloudflare(): void {
        $this->set_server_key( 'HTTP_CF_RAY', '7f3d2a1b4e5c6d7e-EWR' );

        $this->assertSame( 'Cloudflare', Cdn_Detection_Service::get_detected_cdn() );
    }

    // -------------------------------------------------------------------------
    // Sucuri
    // -------------------------------------------------------------------------

    /**
     * Detects Sucuri from the X-Sucuri-ID header.
     */
    public function testDetectsSucuri(): void {
        $this->set_server_key( 'HTTP_X_SUCURI_ID', 'abc123' );

        $this->assertSame( 'Sucuri', Cdn_Detection_Service::get_detected_cdn() );
    }

    // -------------------------------------------------------------------------
    // Varnish
    // -------------------------------------------------------------------------

    /**
     * Detects Varnish when the Via header contains "varnish".
     */
    public function testDetectsVarnish(): void {
        $this->set_server_key( 'HTTP_VIA', '1.1 varnish (Varnish/7.0)' );

        $this->assertSame( 'Varnish', Cdn_Detection_Service::get_detected_cdn() );
    }

    /**
     * Does not detect Varnish when the Via header is present but unrelated.
     */
    public function testDoesNotDetectVarnishFromUnrelatedViaHeader(): void {
        $this->set_server_key( 'HTTP_VIA', '1.1 proxy.example.com' );

        $this->assertNull( Cdn_Detection_Service::get_detected_cdn() );
    }

    // -------------------------------------------------------------------------
    // Priority
    // -------------------------------------------------------------------------

    /**
     * Returns Cloudflare first when multiple CDN headers are present.
     */
    public function testReturnsCloudflareFirstWhenMultipleHeadersArePresent(): void {
        $this->set_server_key( 'HTTP_CF_RAY', '7f3d2a1b4e5c6d7e-EWR' );
        $this->set_server_key( 'HTTP_X_SUCURI_ID', 'abc123' );

        $this->assertSame( 'Cloudflare', Cdn_Detection_Service::get_detected_cdn() );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Write a value to $_SERVER and record the key for cleanup in tearDown.
     *
     * @param string $key   The $_SERVER key.
     * @param string $value The value to set.
     *
     * @return void
     */
    private function set_server_key( string $key, string $value ): void {
        $_SERVER[ $key ]      = $value;
        $this->written_keys[] = $key;
    }
}
