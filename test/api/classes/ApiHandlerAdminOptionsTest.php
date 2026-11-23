<?php
/**
 * Tests for the Api_Handler_Admin_Options class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;
use JordanLeven\Plugins\ForceRefresh\Mocks;
use JordanLeven\Plugins\ForceRefresh\Services\Feature_Flag_Service;

require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler.php';
require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/services/classes/class-feature-flag-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-options.php';

/**
 * Tests for Api_Handler_Admin_Options.
 */
final class ApiHandlerAdminOptionsTest extends TestCase {

    /**
     * Mock for `update_option` in the services namespace.
     *
     * @var Mocks\Mock_Update_Option
     */
    private static $mock_update_option;

    /**
     * Mock for `register_rest_route`.
     *
     * @var Mocks\Mock_Register_Rest_Route
     */
    private static $mock_register_rest_route;

    /**
     * Mock for `get_current_blog_id`.
     *
     * @var Mocks\Mock_Get_Current_Blog_Id
     */
    private static $mock_get_current_blog_id;

    /**
     * Mock for `get_rest_url`.
     *
     * @var Mocks\Mock_Get_Rest_Url
     */
    private static $mock_get_rest_url;

    /**
     * Mock for `current_user_can`.
     *
     * @var Mocks\Mock_Current_User_Can
     */
    private static $mock_current_user_can;

    /**
     * Mock for `get_option` in the services namespace.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Mock for `wp_json_encode` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Json_Encode
     */
    private static $mock_wp_json_encode;

    /**
     * Mock for `wp_upload_dir` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Upload_Dir
     */
    private static $mock_wp_upload_dir;

    /**
     * Mock for `wp_mkdir_p` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Mkdir_P
     */
    private static $mock_wp_mkdir_p;

    /**
     * Absolute path to the temporary uploads directory used across all tests.
     *
     * @var string
     */
    private static string $temp_dir;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$temp_dir = sys_get_temp_dir() . '/force-refresh-options-api-test-' . uniqid();
        mkdir( self::$temp_dir, 0755, true );

        $services_ns = 'JordanLeven\\Plugins\\ForceRefresh\\Services';

        self::$mock_update_option       = new Mocks\Mock_Update_Option( $services_ns );
        self::$mock_register_rest_route = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_get_current_blog_id = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url        = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_current_user_can    = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
        self::$mock_get_option     = new Mocks\Mock_Get_Option( $services_ns );
        self::$mock_wp_json_encode = new Mocks\Mock_Wp_Json_Encode( $services_ns );
        self::$mock_wp_upload_dir  = new Mocks\Mock_Wp_Upload_Dir( $services_ns );
        self::$mock_wp_mkdir_p     = new Mocks\Mock_Wp_Mkdir_P( $services_ns );

        self::$mock_get_option->set_return_value( false );
        self::$mock_get_option->set_option_value( 'force_refresh_page_versions', array() );

        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => self::$temp_dir,
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
    }

    /**
     * Reset per-test state.
     *
     * @return void
     */
    protected function setUp(): void {
        self::$mock_update_option->resetInvocationIndex();
        $this->set_websockets_flag( false );
        $this->delete_version_file();
    }

    /**
     * Leave no feature flags or version file behind for other tests.
     *
     * @return void
     */
    protected function tearDown(): void {
        $this->set_flags( null );
        $this->delete_version_file();
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
     * The path of the version file inside the temporary uploads directory.
     *
     * @return string
     */
    private function get_version_file_path(): string {
        return self::$temp_dir . '/force-refresh/version.json';
    }

    /**
     * Write a version file, as if static file polling had been in use.
     *
     * @return void
     */
    private function write_version_file(): void {
        if ( ! is_dir( dirname( $this->get_version_file_path() ) ) ) {
            mkdir( dirname( $this->get_version_file_path() ), 0755, true );
        }

        file_put_contents( $this->get_version_file_path(), '{"site":"abc"}' );
    }

    /**
     * Remove the version file if a test left one behind.
     *
     * @return void
     */
    private function delete_version_file(): void {
        if ( file_exists( $this->get_version_file_path() ) ) {
            unlink( $this->get_version_file_path() );
        }
    }

    /**
     * Collect the options written since the test started.
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
     * Save options with the given request parameters.
     *
     * @param array $params The request parameters.
     *
     * @return \WP_REST_Response
     */
    private function save_options( array $params ): \WP_REST_Response {
        $request = new \WP_REST_Request();

        foreach ( $params as $key => $value ) {
            $request->set_param( $key, $value );
        }

        return ( new Api_Handler_Admin_Options() )->save_options( $request );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_update_option->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_current_user_can->disable();
        self::$mock_get_option->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_wp_upload_dir->disable();
        self::$mock_wp_mkdir_p->disable();

        if ( is_dir( self::$temp_dir . '/force-refresh' ) ) {
            rmdir( self::$temp_dir . '/force-refresh' );
        }

        rmdir( self::$temp_dir );
    }

    /**
     * Test that register_routes registers the REST endpoint.
     */
    public function testRegisterRoutesRegistersEndpoint() {
        self::$mock_register_rest_route->resetInvocationIndex();
        ( new Api_Handler_Admin_Options() )->register_routes();
        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/options', $args[1] );
    }

    /**
     * Test that save_options sets the show_refresh_in_admin_bar option.
     */
    public function testSaveOptionsSetsShowRefreshInAdminBar() {
        self::$mock_update_option->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'show_refresh_in_admin_bar', 'true' );

        ( new Api_Handler_Admin_Options() )->save_options( $request );

        $this->assertEquals( 'force_refresh_show_in_wp_admin_bar', self::$mock_update_option->get_invocation_arguments( 0 )[0] );
        $this->assertEquals( 'true', self::$mock_update_option->get_invocation_arguments( 0 )[1] );
    }

    /**
     * Test that save_options sets the refresh_interval option.
     */
    public function testSaveOptionsSetsRefreshInterval() {
        self::$mock_update_option->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'refresh_interval', '60' );

        ( new Api_Handler_Admin_Options() )->save_options( $request );

        $this->assertEquals( 'force_refresh_refresh_interval', self::$mock_update_option->get_invocation_arguments( 0 )[0] );
        $this->assertEquals( '60', self::$mock_update_option->get_invocation_arguments( 0 )[1] );
    }

    /**
     * Test that save_options sets both options when both params are provided.
     */
    public function testSaveOptionsSetsMultipleOptionsWhenBothParamsProvided() {
        self::$mock_update_option->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'show_refresh_in_admin_bar', 'false' );
        $request->set_param( 'refresh_interval', '120' );

        ( new Api_Handler_Admin_Options() )->save_options( $request );

        $this->assertEquals( 2, self::$mock_update_option->get_invocation_count() - ( self::$mock_update_option->get_invocation_count() - 2 ) );
    }

    /**
     * Test that save_options skips show_refresh_in_admin_bar when not provided.
     */
    public function testSaveOptionsSkipsShowRefreshInAdminBarWhenNotProvided() {
        self::$mock_update_option->resetInvocationIndex();
        $invocation_count_before = self::$mock_update_option->get_invocation_count();

        $request = new \WP_REST_Request();
        $request->set_param( 'refresh_interval', '90' );

        ( new Api_Handler_Admin_Options() )->save_options( $request );

        $invocation_count_after = self::$mock_update_option->get_invocation_count();
        $this->assertEquals( 1, $invocation_count_after - $invocation_count_before );
        $this->assertEquals( 'force_refresh_refresh_interval', self::$mock_update_option->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that save_options returns a 201 response.
     */
    public function testSaveOptionsReturns201Response() {
        $request  = new \WP_REST_Request();
        $response = ( new Api_Handler_Admin_Options() )->save_options( $request );

        $this->assertEquals( 201, $response->get_status() );
    }

    /**
     * Test that get_rest_endpoint returns the correct URL.
     */
    public function testGetRestEndpointReturnsCorrectUrl() {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/options';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Admin_Options::get_rest_endpoint();

        $this->assertEquals( $expected_url, $result );
    }

    /**
     * Test that get_rest_endpoint calls get_rest_url with the correct path.
     */
    public function testGetRestEndpointCallsGetRestUrlWithCorrectPath() {
        self::$mock_get_rest_url->resetInvocationIndex();
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( 'https://example.com/wp-json/force-refresh/v1/options' );

        Api_Handler_Admin_Options::get_rest_endpoint();

        $args = self::$mock_get_rest_url->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1/options', $args[1] );
    }

    /**
     * Each polling method is saved along with the legacy option.
     *
     * @param string $update_method          The requested update method.
     * @param bool   $is_static_file_polling The expected legacy option.
     */
    #[TestWith( array( 'rest', false ) )]
    #[TestWith( array( 'static_file', true ) )]
    public function testSaveOptionsSavesUpdateMethod( string $update_method, bool $is_static_file_polling ) {
        $response = $this->save_options( array( 'update_method' => $update_method ) );

        $this->assertEquals( 201, $response->get_status() );
        $this->assertSame(
            array(
                'force_refresh_update_method'           => $update_method,
                'force_refresh_use_static_file_polling' => $is_static_file_polling,
            ),
            $this->get_written_options()
        );
    }

    /**
     * The legacy parameter is still understood.
     *
     * @param bool   $use_static_file_polling The legacy request parameter.
     * @param string $update_method           The expected update method.
     */
    #[TestWith( array( true, 'static_file' ) )]
    #[TestWith( array( false, 'rest' ) )]
    public function testSaveOptionsAcceptsLegacyStaticFilePollingParam( bool $use_static_file_polling, string $update_method ) {
        $response = $this->save_options( array( 'use_static_file_polling' => $use_static_file_polling ) );

        $this->assertEquals( 201, $response->get_status() );
        $this->assertSame(
            array(
                'force_refresh_update_method'           => $update_method,
                'force_refresh_use_static_file_polling' => $use_static_file_polling,
            ),
            $this->get_written_options()
        );
    }

    /**
     * The new parameter wins when a request carries both.
     */
    public function testSaveOptionsPrefersUpdateMethodOverLegacyParam() {
        $this->save_options(
            array(
                'update_method'           => 'rest',
                'use_static_file_polling' => true,
            )
        );

        $this->assertSame( 'rest', $this->get_written_options()['force_refresh_update_method'] );
    }

    /**
     * Switching to static file writes the version file straight away.
     *
     * @param array $params The request parameters.
     */
    #[TestWith( array( array( 'update_method' => 'static_file' ) ) )]
    #[TestWith( array( array( 'use_static_file_polling' => true ) ) )]
    public function testSaveOptionsSyncsVersionFileWhenSwitchingToStaticFile( array $params ) {
        $this->assertFileDoesNotExist( $this->get_version_file_path() );

        $this->save_options( $params );

        $this->assertFileExists( $this->get_version_file_path() );
        $this->assertArrayHasKey( 'site', json_decode( file_get_contents( $this->get_version_file_path() ), true ) );
    }

    /**
     * Switching away from static file deletes the version file.
     *
     * @param array $params The request parameters.
     */
    #[TestWith( array( array( 'update_method' => 'rest' ) ) )]
    #[TestWith( array( array( 'use_static_file_polling' => false ) ) )]
    public function testSaveOptionsDeletesVersionFileWhenSwitchingAwayFromStaticFile( array $params ) {
        $this->write_version_file();

        $this->save_options( $params );

        $this->assertFileDoesNotExist( $this->get_version_file_path() );
    }

    /**
     * A request that does not mention the update method leaves the version file alone.
     */
    public function testSaveOptionsKeepsVersionFileWhenUpdateMethodIsNotProvided() {
        $this->write_version_file();

        $this->save_options( array( 'refresh_interval' => '60' ) );

        $this->assertFileExists( $this->get_version_file_path() );
    }

    /**
     * Unknown update methods are rejected.
     *
     * @param mixed $update_method The requested update method.
     */
    #[TestWith( array( 'carrier_pigeon' ) )]
    #[TestWith( array( '' ) )]
    #[TestWith( array( 'REST' ) )]
    #[TestWith( array( true ) )]
    #[TestWith( array( array( 'rest' ) ) )]
    public function testSaveOptionsRejectsUnknownUpdateMethod( $update_method ) {
        $response = $this->save_options( array( 'update_method' => $update_method ) );

        $this->assertEquals( 400, $response->get_status() );
        $this->assertSame( 'The update method is not recognized.', $response->get_data()['message'] );
    }

    /**
     * Nothing at all is saved when the update method is rejected.
     */
    public function testSaveOptionsSavesNothingWhenUpdateMethodIsRejected() {
        $this->write_version_file();

        $this->save_options(
            array(
                'update_method'             => 'carrier_pigeon',
                'refresh_interval'          => '60',
                'show_refresh_in_admin_bar' => 'true',
            )
        );

        $this->assertSame( array(), $this->get_written_options() );
        $this->assertFileExists( $this->get_version_file_path() );
    }

    /**
     * WebSockets looks like any other unknown method while its flag is off.
     */
    public function testSaveOptionsRejectsWebsocketsAsUnknownWhenFlagIsOff() {
        $this->set_websockets_flag( false );

        $response = $this->save_options( array( 'update_method' => 'websockets' ) );

        $this->assertEquals( 400, $response->get_status() );
        $this->assertSame( 'The update method is not recognized.', $response->get_data()['message'] );
        $this->assertSame( array(), $this->get_written_options() );
    }

    /**
     * WebSockets is rejected with the reason when no relay is configured.
     */
    public function testSaveOptionsRejectsWebsocketsWhenNoRelayIsConfigured() {
        $this->set_websockets_flag( true );

        $response = $this->save_options( array( 'update_method' => 'websockets' ) );

        $this->assertEquals( 400, $response->get_status() );
        $this->assertSame( 'WebSockets cannot be used until a relay is configured.', $response->get_data()['message'] );
        $this->assertSame( array(), $this->get_written_options() );
    }

    /**
     * Test that save_options skips the update method when not provided.
     */
    public function testSaveOptionsSkipsUpdateMethodWhenNotProvided() {
        self::$mock_update_option->resetInvocationIndex();
        $invocation_count_before = self::$mock_update_option->get_invocation_count();

        $request = new \WP_REST_Request();
        $request->set_param( 'refresh_interval', '60' );

        ( new Api_Handler_Admin_Options() )->save_options( $request );

        $invocation_count_after = self::$mock_update_option->get_invocation_count();
        $this->assertEquals( 1, $invocation_count_after - $invocation_count_before );
        $this->assertEquals( 'force_refresh_refresh_interval', self::$mock_update_option->get_invocation_arguments( 0 )[0] );
    }
}
