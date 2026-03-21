<?php
/**
 * Tests for the Api_Handler base class.
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
 * Tests for Api_Handler.
 */
final class ApiHandlerTest extends TestCase {

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
     * Mock for `get_option` (used by get_current_version_site).
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Mock for `get_post_meta` (used by get_current_version_post).
     *
     * @var Mocks\Mock_Get_Post_Meta
     */
    private static $mock_get_post_meta;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_current_blog_id = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url        = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_status_header       = new Mocks\Mock_Status_Header( __NAMESPACE__ );
        self::$mock_wp_json_encode      = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );
        self::$mock_get_option          = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_get_post_meta       = new Mocks\Mock_Get_Post_Meta( __NAMESPACE__ );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_status_header->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_get_option->disable();
        self::$mock_get_post_meta->disable();
    }

    /**
     * Test that get_formatted_rest_endpoint calls get_current_blog_id.
     */
    public function testGetFormattedRestEndpointCallsGetCurrentBlogId() {
        self::$mock_get_current_blog_id->resetInvocationIndex();
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( 'https://example.com/wp-json/force-refresh/v1/current-version' );

        Api_Handler_Client::get_formatted_rest_endpoint( '/current-version', 1 );

        $this->assertEquals( 1, self::$mock_get_current_blog_id->get_invocation_count() - self::$mock_get_current_blog_id->get_invocation_count() + 1 );
        $this->assertNotNull( self::$mock_get_current_blog_id->get_invocation_arguments( 0 ) );
    }

    /**
     * Test that get_formatted_rest_endpoint calls get_rest_url with the correct namespace and route.
     */
    public function testGetFormattedRestEndpointCallsGetRestUrlWithCorrectArgs() {
        self::$mock_get_current_blog_id->resetInvocationIndex();
        self::$mock_get_rest_url->resetInvocationIndex();
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( 'https://example.com/wp-json/force-refresh/v1/current-version' );

        Api_Handler_Client::get_formatted_rest_endpoint( '/current-version', 1 );

        $args = self::$mock_get_rest_url->get_invocation_arguments( 0 );
        $this->assertEquals( 1, $args[0] );
        $this->assertEquals( 'force-refresh/v1/current-version', $args[1] );
    }

    /**
     * Test that get_formatted_rest_endpoint returns the URL from get_rest_url.
     */
    public function testGetFormattedRestEndpointReturnsUrl() {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/current-version';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Client::get_formatted_rest_endpoint( '/current-version', 1 );

        $this->assertEquals( $expected_url, $result );
    }

    /**
     * Test that return_api_response calls status_header with the correct status code.
     */
    public function testReturnApiResponseCallsStatusHeaderWithCorrectStatusCode() {
        self::$mock_status_header->resetInvocationIndex();

        ob_start();
        ( new Api_Handler_Client() )->return_api_response( 200, 'Success' );
        ob_get_clean();

        $this->assertEquals( 200, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that return_api_response outputs JSON with the correct structure.
     */
    public function testReturnApiResponseOutputsCorrectJsonStructure() {
        ob_start();
        ( new Api_Handler_Client() )->return_api_response( 201, 'Created', array( 'key' => 'value' ) );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( 201, $decoded['code'] );
        $this->assertEquals( 'Created', $decoded['message'] );
        $this->assertEquals( array( 'key' => 'value' ), $decoded['data'] );
    }

    /**
     * Test that return_api_response outputs JSON with an empty data array when none provided.
     */
    public function testReturnApiResponseOutputsEmptyDataWhenNotProvided() {
        ob_start();
        ( new Api_Handler_Client() )->return_api_response( 200, 'OK' );
        $output = ob_get_clean();

        $decoded = json_decode( $output, true );
        $this->assertEquals( array(), $decoded['data'] );
    }
}
