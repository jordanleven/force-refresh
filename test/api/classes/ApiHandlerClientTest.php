<?php
/**
 * Tests for the Api_Handler_Client class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use PHPUnit\Framework\TestCase;
use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-client.php';

/**
 * Tests for Api_Handler_Client.
 */
final class ApiHandlerClientTest extends TestCase {

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
     * Mock for `get_option`.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Mock for `get_post_meta`.
     *
     * @var Mocks\Mock_Get_Post_Meta
     */
    private static $mock_get_post_meta;

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
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_status_header       = new Mocks\Mock_Status_Header( __NAMESPACE__ );
        self::$mock_wp_json_encode      = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );
        self::$mock_get_option          = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_get_post_meta       = new Mocks\Mock_Get_Post_Meta( __NAMESPACE__ );
        self::$mock_register_rest_route = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_get_current_blog_id = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url        = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_status_header->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_get_option->disable();
        self::$mock_get_post_meta->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
    }

    /**
     * Test that register_routes registers the REST endpoint.
     */
    public function testRegisterRoutesRegistersEndpoint() {
        self::$mock_register_rest_route->resetInvocationIndex();
        ( new Api_Handler_Client() )->register_routes();
        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/current-version', $args[1] );
    }

    /**
     * Test that get_version returns the current site version when no postId is provided.
     */
    public function testGetVersionReturnsSiteVersionWhenNoPostId() {
        $site_version = 'abc123';
        self::$mock_get_option->set_return_value( $site_version );

        $request = new \WP_REST_Request();

        ob_start();
        ( new Api_Handler_Client() )->get_version( $request );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( $site_version, $decoded['data']['currentVersionSite'] );
        $this->assertArrayNotHasKey( 'currentVersionPage', $decoded['data'] );
    }

    /**
     * Test that get_version returns '0' when no site version is set.
     */
    public function testGetVersionReturnsZeroWhenNoSiteVersionSet() {
        self::$mock_get_option->set_return_value( null );

        $request = new \WP_REST_Request();

        ob_start();
        ( new Api_Handler_Client() )->get_version( $request );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( '0', $decoded['data']['currentVersionSite'] );
    }

    /**
     * Test that get_version includes page version when postId is provided.
     */
    public function testGetVersionIncludesPageVersionWhenPostIdProvided() {
        $site_version = 'site-v1';
        $page_version = 'page-v1';
        self::$mock_get_option->set_return_value( $site_version );
        self::$mock_get_post_meta->set_return_value( $page_version );

        $request = new \WP_REST_Request();
        $request->set_param( 'postId', 42 );

        ob_start();
        ( new Api_Handler_Client() )->get_version( $request );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( $site_version, $decoded['data']['currentVersionSite'] );
        $this->assertEquals( $page_version, $decoded['data']['currentVersionPage'] );
    }

    /**
     * Test that get_version returns '0' for the page version when none is set.
     */
    public function testGetVersionReturnsZeroForPageVersionWhenNotSet() {
        self::$mock_get_option->set_return_value( 'site-v1' );
        self::$mock_get_post_meta->set_return_value( null );

        $request = new \WP_REST_Request();
        $request->set_param( 'postId', 99 );

        ob_start();
        ( new Api_Handler_Client() )->get_version( $request );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( '0', $decoded['data']['currentVersionPage'] );
    }

    /**
     * Test that get_version returns a 200 response.
     */
    public function testGetVersionReturns200Response() {
        self::$mock_status_header->resetInvocationIndex();
        self::$mock_get_option->set_return_value( 'v1' );

        $request = new \WP_REST_Request();

        ob_start();
        ( new Api_Handler_Client() )->get_version( $request );
        ob_get_clean();

        $this->assertEquals( 200, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that get_rest_endpoint calls get_rest_url with the correct path.
     */
    public function testGetRestEndpointCallsGetRestUrlWithCorrectPath() {
        self::$mock_get_rest_url->resetInvocationIndex();
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( 'https://example.com/wp-json/force-refresh/v1/current-version' );

        Api_Handler_Client::get_rest_endpoint();

        $args = self::$mock_get_rest_url->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1/current-version', $args[1] );
    }
}
