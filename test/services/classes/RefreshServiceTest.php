<?php
/**
 * Tests for the Refresh_Service class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-refresh-counter-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-refresh-service.php';

/**
 * Tests for Refresh_Service.
 */
final class RefreshServiceTest extends Mocked_Service_Test_Case {

    /** @var Mocks\Mock_Get_Option */
    private static $mock_get_option;

    /** @var Mocks\Mock_Add_Option */
    private static $mock_add_option;

    /** @var Mocks\Mock_Delete_Option */
    private static $mock_delete_option;

    /** @var Mocks\Mock_Update_Option */
    private static $mock_update_option;

    /** @var Mocks\Mock_Current_Time */
    private static $mock_current_time;

    /** @var Mocks\Mock_WP_Hash */
    private static $mock_wp_hash;

    /** @var Mocks\Mock_Wp_Upload_Dir */
    private static $mock_wp_upload_dir;

    /** @var Mocks\Mock_Wp_Mkdir_P */
    private static $mock_wp_mkdir_p;

    /** @var Mocks\Mock_Wp_Json_Encode */
    private static $mock_wp_json_encode;

    /** @var string */
    private static string $temp_dir;

    public static function setUpBeforeClass(): void {
        self::$temp_dir = sys_get_temp_dir() . '/force-refresh-refresh-service-test-' . uniqid();
        mkdir( self::$temp_dir, 0755, true );

        self::$mock_get_option     = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_add_option     = new Mocks\Mock_Add_Option( __NAMESPACE__ );
        self::$mock_delete_option  = new Mocks\Mock_Delete_Option( __NAMESPACE__ );
        self::$mock_update_option  = new Mocks\Mock_Update_Option( __NAMESPACE__ );
        self::$mock_current_time   = new Mocks\Mock_Current_Time( __NAMESPACE__ );
        self::$mock_wp_hash        = new Mocks\Mock_WP_Hash( __NAMESPACE__ );
        self::$mock_wp_upload_dir  = new Mocks\Mock_Wp_Upload_Dir( __NAMESPACE__ );
        self::$mock_wp_mkdir_p     = new Mocks\Mock_Wp_Mkdir_P( __NAMESPACE__ );
        self::$mock_wp_json_encode = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );

        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => self::$temp_dir,
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
    }

    public function setUp(): void {
        self::$mock_get_option->set_return_value( false );
        self::$mock_get_option->clear_option_map();
        self::$mock_update_option->resetInvocationIndex();
    }

    public static function tearDownAfterClass(): void {
        self::disable_mocks(
            array(
                self::$mock_get_option,
                self::$mock_add_option,
                self::$mock_delete_option,
                self::$mock_update_option,
                self::$mock_current_time,
                self::$mock_wp_hash,
                self::$mock_wp_upload_dir,
                self::$mock_wp_mkdir_p,
                self::$mock_wp_json_encode,
            )
        );

        self::remove_temp_dir( self::$temp_dir );
    }

    private static function remove_temp_dir( string $path ): void {
        if ( ! is_dir( $path ) ) {
            return;
        }

        foreach ( array_diff( scandir( $path ), array( '.', '..' ) ) as $entry ) {
            $full = $path . '/' . $entry;
            is_dir( $full ) ? self::remove_temp_dir( $full ) : unlink( $full );
        }

        rmdir( $path );
    }

    /**
     * set_new_site_version returns a non-empty version string.
     */
    public function testSetNewSiteVersionReturnsVersion(): void {
        self::$mock_current_time->set_return_value( '2024-01-01 00:00:00' );
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_site', 0 );

        $version = Refresh_Service::set_new_site_version();

        $this->assertNotEmpty( $version );
    }

    /**
     * set_new_site_version increments the site refresh counter.
     *
     * The counter increment is the last update_option call made by the method.
     */
    public function testSetNewSiteVersionIncrementsCounter(): void {
        self::$mock_current_time->set_return_value( '2024-01-01 00:00:00' );
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_site', 3 );

        Refresh_Service::set_new_site_version();

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 'force_refresh_refresh_count_site', $args[0] );
        $this->assertSame( 4, $args[1] );
    }

    /**
     * set_new_page_version returns a non-empty version string.
     */
    public function testSetNewPageVersionReturnsVersion(): void {
        self::$mock_current_time->set_return_value( '2024-01-01 00:00:00' );
        self::$mock_get_option->set_option_value( 'force_refresh_page_versions', array() );
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_page', array() );

        $version = Refresh_Service::set_new_page_version( 42 );

        $this->assertNotEmpty( $version );
    }

    /**
     * set_new_page_version increments the page refresh counter for the correct page.
     *
     * The counter increment is the last update_option call made by the method.
     */
    public function testSetNewPageVersionIncrementsCounter(): void {
        self::$mock_current_time->set_return_value( '2024-01-01 00:00:00' );
        self::$mock_get_option->set_option_value( 'force_refresh_page_versions', array() );
        self::$mock_get_option->set_option_value(
            'force_refresh_refresh_count_page',
            array( '42' => 5 )
        );

        Refresh_Service::set_new_page_version( 42 );

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 'force_refresh_refresh_count_page', $args[0] );
        $this->assertSame( 6, $args[1]['42'] );
    }
}
