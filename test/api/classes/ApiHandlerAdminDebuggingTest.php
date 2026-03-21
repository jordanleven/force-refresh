<?php
/**
 * Tests for the Api_Handler_Admin_Debugging class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use PHPUnit\Framework\TestCase;
use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler.php';
require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/services/classes/class-debug-storage-service.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-debugging.php';

/**
 * Tests for Api_Handler_Admin_Debugging.
 */
final class ApiHandlerAdminDebuggingTest extends TestCase {

    /**
     * Services namespace constant.
     */
    const SERVICES_NAMESPACE = 'JordanLeven\\Plugins\\ForceRefresh\\Services';

    /**
     * Mock for `status_header`.
     *
     * @var Mocks\Mock_Status_Header
     */
    private static $mock_status_header;

    /**
     * Mock for `wp_json_encode`.
     *
     * @var Mocks\Mock_Wp_Json_Encode
     */
    private static $mock_wp_json_encode;

    /**
     * Mock for `current_time` in the services namespace.
     *
     * @var Mocks\Mock_Current_Time
     */
    private static $mock_current_time;

    /**
     * Mock for `update_option` in the services namespace.
     *
     * @var Mocks\Mock_Update_Option
     */
    private static $mock_update_option;

    /**
     * Mock for `delete_option` in the services namespace.
     *
     * @var Mocks\Mock_Delete_Option
     */
    private static $mock_delete_option;

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
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_status_header       = new Mocks\Mock_Status_Header( __NAMESPACE__ );
        self::$mock_wp_json_encode      = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );
        self::$mock_current_time        = new Mocks\Mock_Current_Time( self::SERVICES_NAMESPACE );
        self::$mock_update_option       = new Mocks\Mock_Update_Option( self::SERVICES_NAMESPACE );
        self::$mock_delete_option       = new Mocks\Mock_Delete_Option( self::SERVICES_NAMESPACE );
        self::$mock_register_rest_route = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_get_current_blog_id = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url        = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_current_user_can    = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_status_header->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_current_time->disable();
        self::$mock_update_option->disable();
        self::$mock_delete_option->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_current_user_can->disable();
    }

    /**
     * Test that register_routes registers the REST endpoint.
     */
    public function testRegisterRoutesRegistersEndpoint() {
        self::$mock_register_rest_route->resetInvocationIndex();
        ( new Api_Handler_Admin_Debugging() )->register_routes();
        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/debugging', $args[1] );
    }

    /**
     * Test that save_options with debug=true calls update_option.
     */
    public function testSaveOptionsWithDebugTrueCallsUpdateOption() {
        $test_time = '2007-06-29 18:00:00';
        self::$mock_current_time->set_return_value( $test_time );
        self::$mock_update_option->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'debug', true );

        ob_start();
        ( new Api_Handler_Admin_Debugging() )->save_options( $request );
        ob_get_clean();

        $this->assertEquals( 'force_refresh_debug_active_date', self::$mock_update_option->get_invocation_arguments( 0 )[0] );
        $this->assertEquals( $test_time, self::$mock_update_option->get_invocation_arguments( 0 )[1] );
    }

    /**
     * Test that save_options with debug=false calls delete_option.
     */
    public function testSaveOptionsWithDebugFalseCallsDeleteOption() {
        self::$mock_delete_option->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'debug', false );

        ob_start();
        ( new Api_Handler_Admin_Debugging() )->save_options( $request );
        ob_get_clean();

        $this->assertEquals( 'force_refresh_debug_active_date', self::$mock_delete_option->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that save_options returns a 201 response.
     */
    public function testSaveOptionsReturns201Response() {
        self::$mock_status_header->resetInvocationIndex();
        self::$mock_current_time->set_return_value( '2007-06-29 18:00:00' );

        $request = new \WP_REST_Request();
        $request->set_param( 'debug', true );

        ob_start();
        ( new Api_Handler_Admin_Debugging() )->save_options( $request );
        ob_get_clean();

        $this->assertEquals( 201, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that get_rest_endpoint returns the correct URL.
     */
    public function testGetRestEndpointReturnsCorrectUrl() {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/debugging';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Admin_Debugging::get_rest_endpoint();

        $this->assertEquals( $expected_url, $result );
    }
}
