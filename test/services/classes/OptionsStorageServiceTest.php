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

/**
 * Test for Debug Storage Service
 */
final class OptionsStorageServiceTest extends Mocked_Service_Test_Case {

    /**
     * Absolute path to the temporary uploads directory used across all tests.
     *
     * @var string
     */
    private static string $temp_dir;

    /**
     * Our store for the mock of `get_option`.
     *
     * @var Mock
     */
    private static $mock_get_option;

    /**
     * Our store for the mock of `update_option`.
     *
     * @var Mock
     */
    private static $mock_update_option;

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
     * Initial test setup.
     *
     * @return  void
     */
    public static function setUpBeforeClass(): void {
        self::$temp_dir = sys_get_temp_dir() . '/force-refresh-options-test-' . uniqid();
        mkdir( self::$temp_dir, 0755, true );

        self::$mock_get_option    = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_update_option = new Mocks\Mock_Update_Option( __NAMESPACE__ );
        self::$mock_wp_upload_dir = new Mocks\Mock_Wp_Upload_Dir( __NAMESPACE__ );
        self::$mock_wp_mkdir_p    = new Mocks\Mock_Wp_Mkdir_P( __NAMESPACE__ );

        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => self::$temp_dir,
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
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
                self::$mock_update_option,
                self::$mock_wp_upload_dir,
                self::$mock_wp_mkdir_p,
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
     * Write a version file into the temp uploads dir so delete() has something to remove.
     *
     * @return string The path to the written file.
     */
    private function write_version_file(): string {
        $dir  = self::$temp_dir . '/force-refresh';
        $file = $dir . '/version.json';

        if ( ! is_dir( $dir ) ) {
            mkdir( $dir, 0755, true );
        }

        file_put_contents( $file, '{"site":"abc"}' );

        return $file;
    }

    /**
     * Test getting refresh interval from options.
     */
    public function testGetRefreshIntervalCallingOptionWithCorrectParams() {
        self::$mock_get_option->set_return_value( 0 );
        Options_Storage_Service::get_refresh_interval();
        $this->assert_last_mock_argument_equals( self::$mock_get_option, 0, 'force_refresh_refresh_interval' );
        $this->assert_last_mock_argument_equals( self::$mock_get_option, 1, 120 );
    }

    /**
     * Test getting refresh interval.
     */
    public function testGetRefreshInterval() {
        $refresh_interval = 5;
        self::$mock_get_option->set_return_value( $refresh_interval );
        $result = Options_Storage_Service::get_refresh_interval();
        $this->assertEquals( $refresh_interval, $result );
    }

    /**
     * Test getting show in admin bar from options.
     */
    public function testGetShowInAdminBarCalledWithCorrectParams() {
        self::$mock_get_option->set_return_value( false );
        Options_Storage_Service::get_show_in_admin_bar();
        $this->assert_last_mock_argument_equals( self::$mock_get_option, 0, 'force_refresh_show_in_wp_admin_bar' );
        $this->assert_last_mock_argument_equals( self::$mock_get_option, 1, 'false' );
    }

    /**
     * Test getting show in admin bar.
     */
    public function testGetShowInAdminBar() {
        $mock_show_in_menu_bar = false;
        self::$mock_get_option->set_return_value( $mock_show_in_menu_bar );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, $mock_show_in_menu_bar );
    }

    /**
     * Test getting show in admin bar from older version of Force Refresh ('true').
     */
    public function testGetShowInAdminBarWhenSetToStringifiedTrue() {
        self::$mock_get_option->set_return_value( 'true' );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, true );
    }

    /**
     * Test getting show in admin bar from older version of Force Refresh ('false').
     */
    public function testGetShowInAdminBarWhenSetToStringifiedFalse() {
        self::$mock_get_option->set_return_value( 'false' );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, false );
    }

    /**
     * Test setting show in admin bar.
     */
    public function testSetOptionShowInMenuBar() {
        $mock_show_in_menu_bar = 'false';
        Options_Storage_Service::set_option_show_in_admin_bar( $mock_show_in_menu_bar );
        $this->assert_last_mock_argument_equals( self::$mock_update_option, 0, 'force_refresh_show_in_wp_admin_bar' );
        $this->assert_last_mock_argument_equals( self::$mock_update_option, 1, $mock_show_in_menu_bar );
    }

    /**
     * Test setting refresh interval.
     */
    public function testSetOptionRefreshInterval() {
        $mock_refresh_interval = '120';
        Options_Storage_Service::set_option_refresh_interval( $mock_refresh_interval );
        $this->assert_last_mock_argument_equals( self::$mock_update_option, 0, 'force_refresh_refresh_interval' );
        $this->assert_last_mock_argument_equals( self::$mock_update_option, 1, $mock_refresh_interval );
    }

    /**
     * Test getting static file polling option when disabled by default.
     */
    public function testGetUseStaticFilePollingReturnsFalseByDefault() {
        self::$mock_get_option->set_return_value( false );
        $this->assertFalse( Options_Storage_Service::get_use_static_file_polling() );
    }

    /**
     * Test getting static file polling option when enabled.
     */
    public function testGetUseStaticFilePollingReturnsTrueWhenEnabled() {
        self::$mock_get_option->set_return_value( true );
        $this->assertTrue( Options_Storage_Service::get_use_static_file_polling() );
    }

    /**
     * Test that setting the option calls update_option with the correct key.
     */
    public function testSetUseStaticFilePollingCallsUpdateOptionWithCorrectKey() {
        self::$mock_update_option->resetInvocationIndex();
        Options_Storage_Service::set_use_static_file_polling( true );
        $this->assert_last_mock_argument_equals( self::$mock_update_option, 0, 'force_refresh_use_static_file_polling' );
    }

    /**
     * Test that enabling static file polling does NOT delete the version file.
     */
    public function testSetUseStaticFilePollingTrueDoesNotDeleteVersionFile() {
        $file = $this->write_version_file();

        Options_Storage_Service::set_use_static_file_polling( true );

        $this->assertFileExists( $file );
        unlink( $file );
    }

    /**
     * Test that disabling static file polling deletes the version file.
     */
    public function testSetUseStaticFilePollingFalseDeletesVersionFile() {
        $file = $this->write_version_file();
        $this->assertFileExists( $file );

        Options_Storage_Service::set_use_static_file_polling( false );

        $this->assertFileDoesNotExist( $file );
    }
}
