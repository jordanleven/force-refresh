<?php
/**
 * Tests for the Api_Handler_Admin_Refresh_Page class.
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
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-refresh-counter-service.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-refresh-page.php';

/**
 * Tests for Api_Handler_Admin_Refresh_Page.
 */
final class ApiHandlerAdminRefreshPageTest extends TestCase {

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
     * Mock for `wp_hash` in the services namespace.
     *
     * @var Mocks\Mock_WP_Hash
     */
    private static $mock_wp_hash;

    /**
     * Mock for `update_option` in the services namespace.
     *
     * @var Mocks\Mock_Update_Option
     */
    private static $mock_update_option_services;

    /**
     * Mock for `get_option` in the services namespace.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option_services;

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
     * Mock for `wp_upload_dir` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Upload_Dir
     */
    private static $mock_wp_upload_dir_services;

    /**
     * Mock for `wp_mkdir_p` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Mkdir_P
     */
    private static $mock_wp_mkdir_p_services;

    /**
     * Mock for `wp_json_encode` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Json_Encode
     */
    private static $mock_wp_json_encode_services;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_status_header             = new Mocks\Mock_Status_Header( __NAMESPACE__ );
        self::$mock_wp_json_encode            = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );
        self::$mock_current_time              = new Mocks\Mock_Current_Time( self::SERVICES_NAMESPACE );
        self::$mock_wp_hash                   = new Mocks\Mock_WP_Hash( self::SERVICES_NAMESPACE );
        self::$mock_update_option_services    = new Mocks\Mock_Update_Option( self::SERVICES_NAMESPACE );
        self::$mock_get_option_services       = new Mocks\Mock_Get_Option( self::SERVICES_NAMESPACE );
        self::$mock_register_rest_route       = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_get_current_blog_id       = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url              = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_current_user_can          = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
        self::$mock_wp_upload_dir_services    = new Mocks\Mock_Wp_Upload_Dir( self::SERVICES_NAMESPACE );
        self::$mock_wp_mkdir_p_services       = new Mocks\Mock_Wp_Mkdir_P( self::SERVICES_NAMESPACE );
        self::$mock_wp_json_encode_services   = new Mocks\Mock_Wp_Json_Encode( self::SERVICES_NAMESPACE );

        // Static file polling disabled by default so no file I/O occurs in these tests.
        self::$mock_get_option_services->set_return_value( false );
        self::$mock_wp_upload_dir_services->set_return_value(
            array(
                'basedir' => sys_get_temp_dir(),
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
        self::$mock_status_header->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_current_time->disable();
        self::$mock_wp_hash->disable();
        self::$mock_update_option_services->disable();
        self::$mock_get_option_services->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_current_user_can->disable();
        self::$mock_wp_upload_dir_services->disable();
        self::$mock_wp_mkdir_p_services->disable();
        self::$mock_wp_json_encode_services->disable();
    }

    /**
     * Test that register_routes registers the REST endpoint.
     */
    public function testRegisterRoutesRegistersEndpoint() {
        self::$mock_register_rest_route->resetInvocationIndex();
        ( new Api_Handler_Admin_Refresh_Page() )->register_routes();
        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/page-version', $args[1] );
    }

    /**
     * Test that refresh_page saves the page version.
     */
    public function testRefreshPageSavesPageVersion() {
        $post_id = 42;
        self::$mock_current_time->set_return_value( '2007-06-29 18:00:00' );
        self::$mock_update_option_services->resetInvocationIndex();
        self::$mock_get_option_services->set_return_value( 120 );

        $request = new \WP_REST_Request();
        $request->set_param( 'postId', $post_id );

        ob_start();
        ( new Api_Handler_Admin_Refresh_Page() )->refresh_page( $request );
        ob_get_clean();

        $args = self::$mock_update_option_services->get_invocation_arguments( 0 );
        $this->assertSame( 'force_refresh_page_versions', $args[0] );
        $this->assertArrayHasKey( (string) $post_id, $args[1] );
    }

    /**
     * Test that refresh_page returns a 201 response.
     */
    public function testRefreshPageReturns201Response() {
        self::$mock_current_time->set_return_value( '2007-06-29 18:00:00' );
        self::$mock_get_option_services->set_return_value( 120 );

        $request = new \WP_REST_Request();
        $request->set_param( 'postId', 1 );

        $response = ( new Api_Handler_Admin_Refresh_Page() )->refresh_page( $request );

        $this->assertEquals( 201, $response->get_status() );
    }

    /**
     * Test that refresh_page includes the page_id, new_page_version, and refresh_interval in the response.
     */
    public function testRefreshPageIncludesCorrectDataInResponse() {
        $post_id          = 99;
        $refresh_interval = 60;
        self::$mock_current_time->set_return_value( '1984' );
        self::$mock_get_option_services->set_return_value( $refresh_interval );

        $request = new \WP_REST_Request();
        $request->set_param( 'postId', $post_id );

        $response = ( new Api_Handler_Admin_Refresh_Page() )->refresh_page( $request );
        $data     = $response->get_data();

        $this->assertEquals( $post_id, $data['data']['page_id'] );
        $this->assertEquals( 'hash-198', $data['data']['new_page_version'] );
        $this->assertEquals( $refresh_interval, $data['data']['refresh_interval'] );
    }

    /**
     * Test that get_rest_endpoint returns the correct URL.
     */
    public function testGetRestEndpointReturnsCorrectUrl() {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/page-version';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Admin_Refresh_Page::get_rest_endpoint();

        $this->assertEquals( $expected_url, $result );
    }
}
