<?php
/**
 * Tests for the Api_Handler_Admin_Options class.
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
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
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
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_update_option       = new Mocks\Mock_Update_Option( 'JordanLeven\\Plugins\\ForceRefresh\\Services' );
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
        self::$mock_update_option->disable();
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
}
