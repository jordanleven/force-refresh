<?php
/**
 * Our test for EOL storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use PHPUnit\Framework\TestCase;
use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/../../../includes/services/classes/class-eol-storage-service.php';

/**
 * Test for EOL Storage Service
 */
final class EolStorageServiceTest extends TestCase {

    /**
     * @var Mocks\Mock_Get_Transient
     */
    private static $mock_get_transient;

    /**
     * @var Mocks\Mock_Set_Transient
     */
    private static $mock_set_transient;

    /**
     * @var Mocks\Mock_Wp_Remote_Get
     */
    private static $mock_wp_remote_get;

    /**
     * @var Mocks\Mock_Is_Wp_Error
     */
    private static $mock_is_wp_error;

    /**
     * @var Mocks\Mock_Wp_Remote_Retrieve_Body
     */
    private static $mock_wp_remote_retrieve_body;

    /**
     * Sample EOL data matching the endoflife.date API shape.
     *
     * @var array
     */
    private static $sample_eol_data = array(
        array( 'cycle' => '7.4', 'eol' => '2022-11-28' ),
        array( 'cycle' => '8.0', 'eol' => '2023-11-26' ),
        array( 'cycle' => '8.1', 'eol' => '2025-12-31' ),
    );

    public static function setUpBeforeClass(): void {
        self::$mock_get_transient           = new Mocks\Mock_Get_Transient( __NAMESPACE__ );
        self::$mock_set_transient           = new Mocks\Mock_Set_Transient( __NAMESPACE__ );
        self::$mock_wp_remote_get           = new Mocks\Mock_Wp_Remote_Get( __NAMESPACE__ );
        self::$mock_is_wp_error             = new Mocks\Mock_Is_Wp_Error( __NAMESPACE__ );
        self::$mock_wp_remote_retrieve_body = new Mocks\Mock_Wp_Remote_Retrieve_Body( __NAMESPACE__ );
    }

    public static function tearDownAfterClass(): void {
        self::$mock_get_transient->disable();
        self::$mock_set_transient->disable();
        self::$mock_wp_remote_get->disable();
        self::$mock_is_wp_error->disable();
        self::$mock_wp_remote_retrieve_body->disable();
    }

    /**
     * Cache hit: get_transient returns data → wp_remote_get is never called.
     */
    public function testCacheHitSkipsRemoteGet() {
        self::$mock_get_transient->set_return_value( self::$sample_eol_data );

        $remote_get_count_before = self::$mock_wp_remote_get->get_invocation_count();
        $result                  = Eol_Storage_Service::get_eol_date( 'php', '7.4.33' );

        $this->assertEquals( $remote_get_count_before, self::$mock_wp_remote_get->get_invocation_count() );
        $this->assertEquals( '2022-11-28', $result );
    }

    /**
     * Cache miss + successful fetch: wp_remote_get is called, set_transient is called.
     */
    public function testCacheMissCallsRemoteGetAndSetsTransient() {
        self::$mock_get_transient->set_return_value( false );
        self::$mock_wp_remote_get->set_return_value( array( 'body' => '[]' ) );
        self::$mock_is_wp_error->set_return_value( false );
        self::$mock_wp_remote_retrieve_body->set_return_value( json_encode( self::$sample_eol_data ) );

        $remote_get_count_before  = self::$mock_wp_remote_get->get_invocation_count();
        $set_transient_count_before = self::$mock_set_transient->get_invocation_count();
        $result                   = Eol_Storage_Service::get_eol_date( 'php', '8.0.1' );

        $this->assertEquals( $remote_get_count_before + 1, self::$mock_wp_remote_get->get_invocation_count() );
        $this->assertEquals( $set_transient_count_before + 1, self::$mock_set_transient->get_invocation_count() );
        $this->assertEquals( '2023-11-26', $result );
    }

    /**
     * Cache miss + API failure: wp_remote_get returns WP_Error → null returned, set_transient not called.
     */
    public function testApiFailureReturnsNullAndSkipsSetTransient() {
        self::$mock_get_transient->set_return_value( false );
        self::$mock_wp_remote_get->set_return_value( new \WP_Error() );
        self::$mock_is_wp_error->set_return_value( true );

        $set_transient_count_before = self::$mock_set_transient->get_invocation_count();
        $result                     = Eol_Storage_Service::get_eol_date( 'php', '7.4.33' );

        $this->assertNull( $result );
        $this->assertEquals( $set_transient_count_before, self::$mock_set_transient->get_invocation_count() );
    }

    /**
     * Version matching: full version "7.4.33" matches cycle "7.4".
     */
    public function testVersionMatchingExtractsMajorMinorCycle() {
        self::$mock_get_transient->set_return_value( self::$sample_eol_data );

        $result = Eol_Storage_Service::get_eol_date( 'php', '7.4.33' );

        $this->assertEquals( '2022-11-28', $result );
    }

    /**
     * Unknown version: version not in API response → null returned.
     */
    public function testUnknownVersionReturnsNull() {
        self::$mock_get_transient->set_return_value( self::$sample_eol_data );

        $result = Eol_Storage_Service::get_eol_date( 'php', '5.6.40' );

        $this->assertNull( $result );
    }
}
