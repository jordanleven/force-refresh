<?php
/**
 * Our test for options storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;
use PHPUnit\Framework\Attributes\TestWith;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-feature-flag-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';

/**
 * Test for Options Storage Service
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
     * Reset per-test mock state.
     *
     * @return void
     */
    protected function setUp(): void {
        self::$mock_get_option->clear_option_map();
        self::$mock_get_option->set_return_value( false );
        self::$mock_update_option->resetInvocationIndex();
        $this->set_websockets_flag( false );
    }

    /**
     * Leave the feature flag cache empty for other test classes.
     *
     * @return void
     */
    protected function tearDown(): void {
        $this->set_flags( null );
    }

    /**
     * Inject feature flags into the flag service's cache.
     *
     * @param array|null $flags The flags to set, or null to clear the cache.
     *
     * @return void
     */
    private function set_flags( ?array $flags ): void {
        $flags_prop = ( new \ReflectionClass( Feature_Flag_Service::class ) )->getProperty( 'flags' );
        $flags_prop->setAccessible( true );
        $flags_prop->setValue( null, $flags );
    }

    /**
     * Turn the WebSockets feature flag on or off.
     *
     * @param bool $is_enabled Whether the flag is on.
     *
     * @return void
     */
    private function set_websockets_flag( bool $is_enabled ): void {
        $this->set_flags( array( 'websockets' => $is_enabled ) );
    }

    /**
     * Set what is stored for the update method and the legacy static file option.
     *
     * @param mixed $update_method          The stored update method.
     * @param mixed $is_static_file_polling The stored legacy option.
     *
     * @return void
     */
    private function set_stored_update_method( $update_method, $is_static_file_polling ): void {
        self::$mock_get_option->set_option_value( 'force_refresh_update_method', $update_method );
        self::$mock_get_option->set_option_value( 'force_refresh_use_static_file_polling', $is_static_file_polling );
    }

    /**
     * Collect the options written since the last invocation reset.
     *
     * @return array<string, mixed> The written values keyed by option name.
     */
    private function get_written_options(): array {
        $written = array();
        $offset  = 0;

        while ( true ) {
            $arguments = self::$mock_update_option->get_invocation_arguments( $offset );

            if ( null === $arguments ) {
                return $written;
            }

            $written[ $arguments[0] ] = $arguments[1];
            --$offset;
        }
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
     * The update method defaults to REST when nothing is stored.
     */
    public function testGetUpdateMethodDefaultsToRest() {
        $this->set_stored_update_method( null, false );
        $this->assertSame( 'rest', Options_Storage_Service::get_update_method() );
    }

    /**
     * A site that has not been migrated yet gets static file from the legacy option.
     */
    public function testGetUpdateMethodFallsBackToLegacyStaticFileOption() {
        $this->set_stored_update_method( null, true );
        $this->assertSame( 'static_file', Options_Storage_Service::get_update_method() );
    }

    /**
     * Each stored method is returned when the legacy option agrees with it.
     *
     * @param string $update_method          The stored update method.
     * @param bool   $is_static_file_polling The stored legacy option.
     */
    #[TestWith( array( 'rest', false ) )]
    #[TestWith( array( 'static_file', true ) )]
    #[TestWith( array( 'websockets', false ) )]
    public function testGetUpdateMethodReturnsStoredMethod( string $update_method, bool $is_static_file_polling ) {
        $this->set_stored_update_method( $update_method, $is_static_file_polling );
        $this->assertSame( $update_method, Options_Storage_Service::get_update_method() );
    }

    /**
     * The legacy option is read the way WordPress stores booleans.
     */
    public function testGetUpdateMethodAcceptsLegacyOptionAsStoredByWordPress() {
        $this->set_stored_update_method( 'static_file', '1' );
        $this->assertSame( 'static_file', Options_Storage_Service::get_update_method() );

        $this->set_stored_update_method( 'websockets', '' );
        $this->assertSame( 'websockets', Options_Storage_Service::get_update_method() );
    }

    /**
     * An unknown stored value is ignored in favor of the legacy option.
     */
    public function testGetUpdateMethodIgnoresUnknownStoredValue() {
        $this->set_stored_update_method( 'carrier_pigeon', false );
        $this->assertSame( 'rest', Options_Storage_Service::get_update_method() );

        $this->set_stored_update_method( 'carrier_pigeon', true );
        $this->assertSame( 'static_file', Options_Storage_Service::get_update_method() );
    }

    /**
     * Static file polling that an older version turned off after a downgrade stays off.
     */
    public function testGetUpdateMethodFollowsLegacyOptionTurnedOffByOlderVersion() {
        $this->set_stored_update_method( 'static_file', false );
        $this->assertSame( 'rest', Options_Storage_Service::get_update_method() );
    }

    /**
     * Static file polling that an older version turned on after a downgrade stays on.
     *
     * @param string $update_method The stored update method.
     */
    #[TestWith( array( 'rest' ) )]
    #[TestWith( array( 'websockets' ) )]
    public function testGetUpdateMethodFollowsLegacyOptionTurnedOnByOlderVersion( string $update_method ) {
        $this->set_stored_update_method( $update_method, true );
        $this->assertSame( 'static_file', Options_Storage_Service::get_update_method() );
    }

    /**
     * Setting a method stores it and keeps the legacy option in step.
     *
     * @param string $update_method          The update method to set.
     * @param bool   $is_static_file_polling The expected legacy option.
     */
    #[TestWith( array( 'rest', false ) )]
    #[TestWith( array( 'static_file', true ) )]
    #[TestWith( array( 'websockets', false ) )]
    public function testSetUpdateMethodKeepsLegacyOptionInStep( string $update_method, bool $is_static_file_polling ) {
        Options_Storage_Service::set_update_method( $update_method );

        $this->assertSame(
            array(
                'force_refresh_update_method'           => $update_method,
                'force_refresh_use_static_file_polling' => $is_static_file_polling,
            ),
            $this->get_written_options()
        );
    }

    /**
     * Test that selecting static file polling does NOT delete the version file.
     */
    public function testSetUpdateMethodStaticFileDoesNotDeleteVersionFile() {
        $file = $this->write_version_file();

        Options_Storage_Service::set_update_method( 'static_file' );

        $this->assertFileExists( $file );
        unlink( $file );
    }

    /**
     * Test that selecting any other method deletes the version file.
     *
     * @param string $update_method The update method to set.
     */
    #[TestWith( array( 'rest' ) )]
    #[TestWith( array( 'websockets' ) )]
    public function testSetUpdateMethodOtherThanStaticFileDeletesVersionFile( string $update_method ) {
        $file = $this->write_version_file();
        $this->assertFileExists( $file );

        Options_Storage_Service::set_update_method( $update_method );

        $this->assertFileDoesNotExist( $file );
    }

    /**
     * Static file polling is reported only for the static file method.
     *
     * @param string $update_method          The stored update method.
     * @param bool   $is_static_file_polling The stored legacy option and expected result.
     */
    #[TestWith( array( 'rest', false ) )]
    #[TestWith( array( 'static_file', true ) )]
    #[TestWith( array( 'websockets', false ) )]
    public function testGetUseStaticFilePollingIsDerivedFromUpdateMethod( string $update_method, bool $is_static_file_polling ) {
        $this->set_stored_update_method( $update_method, $is_static_file_polling );
        $this->assertSame( $is_static_file_polling, Options_Storage_Service::get_use_static_file_polling() );
    }

    /**
     * Static file polling still works for a site that has not been migrated yet.
     */
    public function testGetUseStaticFilePollingWorksBeforeMigration() {
        $this->set_stored_update_method( null, true );
        $this->assertTrue( Options_Storage_Service::get_use_static_file_polling() );
    }

    /**
     * No relay can be configured yet.
     */
    public function testIsRelayConfiguredIsFalse() {
        $this->assertFalse( Options_Storage_Service::is_relay_configured() );
    }

    /**
     * WebSockets is unavailable because of the feature flag when the flag is off.
     */
    public function testWebsocketsIsUnavailableWhenFlagIsOff() {
        $this->set_websockets_flag( false );

        $this->assertSame( 'feature_disabled', Options_Storage_Service::get_websockets_unavailable_reason() );
        $this->assertFalse( Options_Storage_Service::is_websockets_available() );
    }

    /**
     * WebSockets is unavailable because of the relay when the flag is on.
     */
    public function testWebsocketsIsUnavailableWhenNoRelayIsConfigured() {
        $this->set_websockets_flag( true );

        $this->assertSame( 'relay_not_configured', Options_Storage_Service::get_websockets_unavailable_reason() );
        $this->assertFalse( Options_Storage_Service::is_websockets_available() );
    }

    /**
     * A selected WebSockets method falls back to REST when the flag is off.
     */
    public function testEffectiveUpdateMethodFallsBackToRestWhenFlagIsOff() {
        $this->set_websockets_flag( false );
        $this->set_stored_update_method( 'websockets', false );

        $this->assertSame( 'rest', Options_Storage_Service::get_effective_update_method() );
        $this->assertSame( 'websockets', Options_Storage_Service::get_update_method() );
    }

    /**
     * A selected WebSockets method falls back to REST when no relay is configured.
     */
    public function testEffectiveUpdateMethodFallsBackToRestWhenNoRelayIsConfigured() {
        $this->set_websockets_flag( true );
        $this->set_stored_update_method( 'websockets', false );

        $this->assertSame( 'rest', Options_Storage_Service::get_effective_update_method() );
        $this->assertSame( 'websockets', Options_Storage_Service::get_update_method() );
    }

    /**
     * The polling methods are always effective as selected.
     *
     * @param string $update_method          The stored update method.
     * @param bool   $is_static_file_polling The stored legacy option.
     */
    #[TestWith( array( 'rest', false ) )]
    #[TestWith( array( 'static_file', true ) )]
    public function testEffectiveUpdateMethodMatchesSelectedPollingMethod( string $update_method, bool $is_static_file_polling ) {
        $this->set_stored_update_method( $update_method, $is_static_file_polling );
        $this->assertSame( $update_method, Options_Storage_Service::get_effective_update_method() );
    }
}
