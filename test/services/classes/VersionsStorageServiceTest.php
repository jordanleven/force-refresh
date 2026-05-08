<?php
/**
 * Our test for debug storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';

/**
 * Test for Debug Storage Service
 */
final class VersionsStorageServiceTest extends Mocked_Service_Test_Case {

    /**
     * Our store for the mock of `get_option`.
     *
     * @var Mock
     */
    private static $mock_get_option;

    /**
     * Our store for the mock of `add_option`.
     *
     * @var Mock
     */
    private static $mock_add_option;

    /**
     * Our store for the mock of `delete_option`.
     *
     * @var Mock
     */
    private static $mock_delete_option;

    /**
     * Our store for the mock of `update_post_meta`.
     *
     * @var Mock
     */
    private static $mock_update_post_meta;

    /**
     * Our store for the mock of `delete_post_meta`.
     *
     * @var Mock
     */
    private static $mock_delete_post_meta;

    /**
     * Our store for the mock of `current_time`.
     *
     * @var Mock
     */
    private static $mock_current_time;

    /**
     * Our store for the mock of `wp_hash`.
     *
     * @var Mock
     */
    private static $mock_wp_hash;

    /**
     * Mock for `wp_upload_dir`.
     *
     * @var Mocks\Mock_Wp_Upload_Dir
     */
    private static $mock_wp_upload_dir;

    /**
     * Mock for `wp_mkdir_p`.
     *
     * @var Mocks\Mock_Wp_Mkdir_P
     */
    private static $mock_wp_mkdir_p;

    /**
     * Mock for `wp_json_encode`.
     *
     * @var Mocks\Mock_Wp_Json_Encode
     */
    private static $mock_wp_json_encode;

    /**
     * Absolute path to the temporary uploads directory.
     *
     * @var string
     */
    private static string $temp_dir;

    /**
     * Initial test setup.
     *
     * @return  void
     */
    public static function setUpBeforeClass(): void {
        self::$temp_dir = sys_get_temp_dir() . '/force-refresh-versions-test-' . uniqid();
        mkdir( self::$temp_dir, 0755, true );

        self::$mock_get_option       = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_add_option       = new Mocks\Mock_Add_Option( __NAMESPACE__ );
        self::$mock_delete_option    = new Mocks\Mock_Delete_Option( __NAMESPACE__ );
        self::$mock_update_post_meta = new Mocks\Mock_Update_Post_Meta( __NAMESPACE__ );
        self::$mock_delete_post_meta = new Mocks\Mock_Delete_Post_Meta( __NAMESPACE__ );
        self::$mock_current_time     = new Mocks\Mock_Current_Time( __NAMESPACE__ );
        self::$mock_wp_hash          = new Mocks\Mock_WP_Hash( __NAMESPACE__ );
        self::$mock_wp_upload_dir    = new Mocks\Mock_Wp_Upload_Dir( __NAMESPACE__ );
        self::$mock_wp_mkdir_p       = new Mocks\Mock_Wp_Mkdir_P( __NAMESPACE__ );
        self::$mock_wp_json_encode   = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );

        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => self::$temp_dir,
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
    }

    /**
     * Reset the get_option mock and clean the version file before each test.
     *
     * @return void
     */
    public function setUp(): void {
        // Default to static file polling disabled so existing tests are unaffected.
        self::$mock_get_option->set_return_value( false );

        $file = self::$temp_dir . '/force-refresh/version.json';

        if ( file_exists( $file ) ) {
            unlink( $file );
        }
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::disable_mocks(
            array(
                self::$mock_get_option,
                self::$mock_add_option,
                self::$mock_delete_option,
                self::$mock_update_post_meta,
                self::$mock_delete_post_meta,
                self::$mock_current_time,
                self::$mock_wp_hash,
                self::$mock_wp_upload_dir,
                self::$mock_wp_mkdir_p,
                self::$mock_wp_json_encode,
            )
        );

        self::remove_temp_dir( self::$temp_dir );
    }

    /**
     * Recursively remove a directory and all its contents.
     *
     * @param string $path The directory to remove.
     *
     * @return void
     */
    private static function remove_temp_dir( string $path ): void {
        if ( ! is_dir( $path ) ) {
            return;
        }

        $entries = array_diff( scandir( $path ), array( '.', '..' ) );

        foreach ( $entries as $entry ) {
            $full_path = $path . '/' . $entry;
            is_dir( $full_path ) ? self::remove_temp_dir( $full_path ) : unlink( $full_path );
        }

        rmdir( $path );
    }

    /**
     * Return the path to the expected version file in the temp dir.
     *
     * @return string
     */
    private function get_version_file_path(): string {
        return self::$temp_dir . '/force-refresh/version.json';
    }

    /**
     * When the site version isn't set.
     */
    public function testReturnsZeroIfSiteVersionIsNotSet() {
        self::$mock_get_option->set_return_value( null );
        $site_version = Versions_Storage_Service::get_site_version();
        $this->assertEquals( '0', $site_version );
    }

    /**
     * When the site version is set.
     */
    public function testReturnsSiteVersionIfSiteVersionIsSet() {
        $site_version = '1984';
        self::$mock_get_option->set_return_value( $site_version );
        $result = Versions_Storage_Service::get_site_version();
        $this->assertEquals( $site_version, $result );
    }

    /**
     * Updating the site version.
     */
    public function testSetSiteVersion() {
        $site_version_new = '1984';

        $this->assertEquals( self::$mock_add_option->get_invocation_count(), 0 );
        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 0 );

        Versions_Storage_Service::set_site_version( $site_version_new );

        $this->assertEquals( self::$mock_add_option->get_invocation_count(), 1 );
        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 1 );

        $this->assert_last_mock_argument_equals( self::$mock_delete_option, 0, 'force_refresh_current_site_version' );
        $this->assert_last_mock_call_equals( self::$mock_add_option, array( 'force_refresh_current_site_version', $site_version_new ) );
    }

    /**
     * Updating the page version.
     */
    public function testSetPageVersion() {
        $page_id          = 2007;
        $page_version_new = '1984';

        $this->assertEquals( self::$mock_update_post_meta->get_invocation_count(), 0 );
        $this->assertEquals( self::$mock_delete_post_meta->get_invocation_count(), 0 );

        Versions_Storage_Service::set_page_version( $page_id, $page_version_new );

        $this->assert_last_mock_call_equals( self::$mock_delete_post_meta, array( $page_id, 'force_refresh_current_page_version' ) );
        $invocation_arguments = self::$mock_update_post_meta->get_last_invocation_arguments();

        $this->assertEquals(
            array_slice( $invocation_arguments, 0, 3 ),
            array(
                $page_id,
                'force_refresh_current_page_version',
                $page_version_new,
            )
        );
    }

    /**
     * Returns a truncated and hashed version of the time.
     */
    public function testGetNewVersion() {
        self::$mock_current_time->set_return_value( '1984' );

        $new_version = Versions_Storage_Service::get_new_version();

        $this->assertEquals( 'hash-198', $new_version );
    }

    // -------------------------------------------------------------------------
    // Static file sync
    // -------------------------------------------------------------------------

    /**
     * Version file is NOT written when static file polling is disabled.
     */
    public function testSetSiteVersionDoesNotWriteFileWhenOptionIsOff(): void {
        self::$mock_get_option->set_return_value( false );

        Versions_Storage_Service::set_site_version( 'abc12345' );

        $this->assertFileDoesNotExist( $this->get_version_file_path() );
    }

    /**
     * Version file is written when static file polling is enabled.
     */
    public function testSetSiteVersionWritesFileWhenOptionIsOn(): void {
        self::$mock_get_option->set_return_value( true );

        Versions_Storage_Service::set_site_version( 'abc12345' );

        $this->assertFileExists( $this->get_version_file_path() );
        $content = json_decode( file_get_contents( $this->get_version_file_path() ), true );
        $this->assertSame( 'abc12345', $content['site'] );
    }

    /**
     * Existing page entries are preserved when the site version is updated.
     */
    public function testSetSiteVersionPreservesExistingPageEntries(): void {
        self::$mock_get_option->set_return_value( true );

        $dir = self::$temp_dir . '/force-refresh';

        if ( ! is_dir( $dir ) ) {
            mkdir( $dir, 0755, true );
        }

        file_put_contents(
            $this->get_version_file_path(),
            json_encode( array( 'site' => 'old', 'pages' => array( '42' => 'xyz' ) ) )
        );

        Versions_Storage_Service::set_site_version( 'newversion' );

        $content = json_decode( file_get_contents( $this->get_version_file_path() ), true );
        $this->assertSame( 'newversion', $content['site'] );
        $this->assertSame( 'xyz', $content['pages']['42'] );
    }

    /**
     * Page-specific refresh updates the pages key in the version file.
     */
    public function testSetPageVersionWritesPageEntryWhenOptionIsOn(): void {
        self::$mock_get_option->set_return_value( true );

        Versions_Storage_Service::set_page_version( 42, 'pageversion' );

        $this->assertFileExists( $this->get_version_file_path() );
        $content = json_decode( file_get_contents( $this->get_version_file_path() ), true );
        $this->assertSame( 'pageversion', $content['pages']['42'] );
    }

    /**
     * Page-specific refresh does NOT write a file when the option is off.
     */
    public function testSetPageVersionDoesNotWriteFileWhenOptionIsOff(): void {
        self::$mock_get_option->set_return_value( false );

        Versions_Storage_Service::set_page_version( 42, 'pageversion' );

        $this->assertFileDoesNotExist( $this->get_version_file_path() );
    }
}
