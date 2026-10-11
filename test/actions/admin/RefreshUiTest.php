<?php
/**
 * Tests for inc-refresh-ui.php.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Mocks;
use JordanLeven\Plugins\ForceRefresh\Services\Feature_Flag_Service;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

/**
 * Mock WordPress version for tests in this file.
 *
 * @var string
 */
$mock_wordpress_version = '6.9';

/**
 * Stub add_action during file load.
 *
 * @return void
 */
function add_action() {}

/**
 * Stub add_filter during file load.
 *
 * @return void
 */
function add_filter() {}

/**
 * Stub get_bloginfo for targeted tests.
 *
 * @param string $show Requested info key.
 * @return string
 */
function get_bloginfo( string $show = '' ): string {
    global $mock_wordpress_version;

    if ( 'version' === $show ) {
        return $mock_wordpress_version;
    }

    return '';
}

/**
 * Inline stub for get_wordpress_version so functions.php is not loaded
 * (loading it would define get_force_refresh_plugin_data and break phpmock
 * spies in other test files that run after this one).
 *
 * @return string
 */
function get_wordpress_version(): string {
    return get_bloginfo( 'version' );
}

if ( ! defined( 'REFRESH_INTERVAL_CUSTOM_MINIMUM_IN_SECONDS' ) ) {
    define( 'REFRESH_INTERVAL_CUSTOM_MINIMUM_IN_SECONDS', 30 );
}

if ( ! defined( 'REFRESH_INTERVAL_CUSTOM_MAXIMUM_IN_SECONDS' ) ) {
    define( 'REFRESH_INTERVAL_CUSTOM_MAXIMUM_IN_SECONDS', 4 * 3600 );
}

require_once __DIR__ . '/../../../includes/services/classes/class-feature-flag-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/actions/admin/inc-refresh-ui.php';

/**
 * Tests for admin refresh UI helpers.
 */
final class RefreshUiTest extends TestCase {

    /**
     * Mock for `get_option` in the services namespace.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option = new Mocks\Mock_Get_Option( 'JordanLeven\\Plugins\\ForceRefresh\\Services' );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_get_option->disable();
    }

    /**
     * Reset per-test mock state.
     *
     * @return void
     */
    protected function setUp(): void {
        self::$mock_get_option->clear_option_map();
        self::$mock_get_option->set_return_value( false );
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
     * Get the refresh options for a stored update method and flag state.
     *
     * @param string $update_method         The stored update method.
     * @param bool   $is_websockets_enabled Whether the WebSockets flag is on.
     *
     * @return array
     */
    private function get_refresh_options_for( string $update_method, bool $is_websockets_enabled ): array {
        $this->set_flags( array( 'websockets' => $is_websockets_enabled ) );
        self::$mock_get_option->set_option_value( 'force_refresh_update_method', $update_method );
        self::$mock_get_option->set_option_value( 'force_refresh_use_static_file_polling', 'static_file' === $update_method );

        return get_refresh_options();
    }

    /**
     * The polling methods are localized as stored, with the legacy key kept in step.
     *
     * @param string $update_method           The stored update method.
     * @param bool   $use_static_file_polling The expected legacy value.
     * @param bool   $is_websockets_enabled   Whether the WebSockets flag is on.
     */
    #[TestWith( array( 'rest', false, false ) )]
    #[TestWith( array( 'static_file', true, false ) )]
    #[TestWith( array( 'rest', false, true ) )]
    #[TestWith( array( 'static_file', true, true ) )]
    public function testRefreshOptionsIncludeTheUpdateMethod( string $update_method, bool $use_static_file_polling, bool $is_websockets_enabled ) {
        $refresh_options = $this->get_refresh_options_for( $update_method, $is_websockets_enabled );

        $this->assertSame( $update_method, $refresh_options['updateMethod'] );
        $this->assertSame( $use_static_file_polling, $refresh_options['useStaticFilePolling'] );
    }

    /**
     * Nothing about WebSockets or relays is localized while the flag is off.
     */
    public function testRefreshOptionsRevealNothingAboutWebsocketsWhenFlagIsOff() {
        $refresh_options = $this->get_refresh_options_for( 'websockets', false );

        $this->assertSame( 'rest', $refresh_options['updateMethod'] );
        $this->assertArrayNotHasKey( 'isRelayConfigured', $refresh_options );
        $this->assertStringNotContainsStringIgnoringCase( 'websocket', json_encode( $refresh_options ) );
        $this->assertStringNotContainsStringIgnoringCase( 'relay', json_encode( $refresh_options ) );
    }

    /**
     * A selected WebSockets method and the relay state are localized when the flag is on.
     */
    public function testRefreshOptionsIncludeWebsocketsSelectionWhenFlagIsOn() {
        $refresh_options = $this->get_refresh_options_for( 'websockets', true );

        $this->assertSame( 'websockets', $refresh_options['updateMethod'] );
        $this->assertFalse( $refresh_options['isRelayConfigured'] );
    }

    /**
     * The shared WordPress-version helper returns the current version string.
     */
    public function testGetWordPressVersionReturnsCurrentVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0.1';

        $this->assertSame( '7.0.1', get_wordpress_version() );
    }

    /**
     * Admin body class reflects the major WordPress version.
     */
    public function testAddsAdminBodyClassForMajorVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp7', $result );
    }

    /**
     * Release candidates use the major version number for the admin body class.
     */
    public function testAddsAdminBodyClassForReleaseCandidateUsingMajorVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0-RC2';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp7', $result );
    }

    /**
     * Admin body class reflects the correct major version for non-7 installs.
     */
    public function testAddsCorrectAdminBodyClassForOtherMajorVersions() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '6.9';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp6', $result );
    }
}
