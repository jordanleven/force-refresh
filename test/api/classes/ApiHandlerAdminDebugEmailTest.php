<?php
/**
 * Tests for the Api_Handler_Admin_Debug_Email class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Mocks;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler.php';
require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-debug-email.php';

/**
 * Tests for Api_Handler_Admin_Debug_Email.
 */
final class ApiHandlerAdminDebugEmailTest extends TestCase {

    /**
     * Services namespace constant.
     */
    const SERVICES_NAMESPACE = 'JordanLeven\\Plugins\\ForceRefresh\\Services';

    /**
     * Plugin namespace constant.
     */
    const PLUGIN_NAMESPACE = 'JordanLeven\\Plugins\\ForceRefresh';

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
     * Mock for `wp_get_current_user`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_get_current_user;

    /**
     * Mock for `get_bloginfo`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_bloginfo;

    /**
     * Mock for `get_plugin_data`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_plugin_data;

    /**
     * Mock for `get_option`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_option;

    /**
     * Mock for `esc_url_raw`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_esc_url_raw;

    /**
     * Mock for `wp_parse_url`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_parse_url;

    /**
     * Mock for `wp_remote_get`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_remote_get;

    /**
     * Mock for `wp_remote_retrieve_response_code`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_remote_retrieve_response_code;

    /**
     * Mock for `wp_remote_retrieve_body`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_remote_retrieve_body;

    /**
     * Mock for `is_wp_error`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_is_wp_error;

    /**
     * Mock for `add_action`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_add_action;

    /**
     * Mock for `wp_mail`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_wp_mail;

    /**
     * Mock for `get_main_plugin_file`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_main_plugin_file;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_register_rest_route            = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_get_current_blog_id            = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url                   = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_current_user_can               = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
        self::$mock_wp_get_current_user            = new Mocks\Mock_Function( __NAMESPACE__, 'wp_get_current_user' );
        self::$mock_get_bloginfo                   = new Mocks\Mock_Function(
            __NAMESPACE__,
            'get_bloginfo',
            function ( string $key ) {
                $map = array(
                    'url'     => 'https://example.com',
                    'name'    => 'Test Site',
                    'version' => '6.9.0',
                );

                return $map[ $key ] ?? null;
            }
        );
        self::$mock_get_plugin_data               = new Mocks\Mock_Function( __NAMESPACE__, 'get_plugin_data' );
        self::$mock_get_option                    = new Mocks\Mock_Function(
            self::SERVICES_NAMESPACE,
            'get_option',
            function ( string $key, $default = null ) {
                $map = array(
                    'force_refresh_current_site_version' => 'abc12345',
                    'force_refresh_refresh_interval'     => '120',
                );

                return $map[ $key ] ?? $default;
            }
        );
        self::$mock_esc_url_raw                  = new Mocks\Mock_Function(
            __NAMESPACE__,
            'esc_url_raw',
            fn ( string $url ) => trim( $url )
        );
        self::$mock_wp_parse_url                 = new Mocks\Mock_Function(
            __NAMESPACE__,
            'wp_parse_url',
            fn ( string $url ) => parse_url( $url )
        );
        self::$mock_wp_remote_get               = new Mocks\Mock_Function( __NAMESPACE__, 'wp_remote_get' );
        self::$mock_wp_remote_retrieve_response_code = new Mocks\Mock_Function(
            __NAMESPACE__,
            'wp_remote_retrieve_response_code',
            fn ( array $response ) => $response['response']['code'] ?? null
        );
        self::$mock_wp_remote_retrieve_body = new Mocks\Mock_Function(
            __NAMESPACE__,
            'wp_remote_retrieve_body',
            fn ( array $response ) => $response['body'] ?? ''
        );
        self::$mock_is_wp_error = new Mocks\Mock_Function(
            __NAMESPACE__,
            'is_wp_error',
            fn () => false
        );
        self::$mock_add_action = new Mocks\Mock_Function( __NAMESPACE__, 'add_action' );
        self::$mock_wp_mail = new Mocks\Mock_Function( __NAMESPACE__, 'wp_mail' );
        self::$mock_get_main_plugin_file = new Mocks\Mock_Function( self::PLUGIN_NAMESPACE, 'get_main_plugin_file' );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_register_rest_route->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_current_user_can->disable();
        self::$mock_wp_get_current_user->disable();
        self::$mock_get_bloginfo->disable();
        self::$mock_get_plugin_data->disable();
        self::$mock_get_option->disable();
        self::$mock_esc_url_raw->disable();
        self::$mock_wp_parse_url->disable();
        self::$mock_wp_remote_get->disable();
        self::$mock_wp_remote_retrieve_response_code->disable();
        self::$mock_wp_remote_retrieve_body->disable();
        self::$mock_is_wp_error->disable();
        self::$mock_add_action->disable();
        self::$mock_wp_mail->disable();
        self::$mock_get_main_plugin_file->disable();
    }

    /**
     * Reset per-test mock state.
     *
     * @return void
     */
    protected function setUp(): void {
        self::$mock_get_plugin_data->set_return_value( array( 'Version' => '2.18.0' ) );
        self::$mock_get_main_plugin_file->set_return_value( '/tmp/force-refresh.php' );
        self::$mock_wp_get_current_user->set_return_value(
            (object) array(
                'user_email' => 'noreply@wordpress.com',
            )
        );
        self::$mock_wp_remote_get->set_return_value(
            array(
                'response' => array(
                    'code' => 200,
                ),
                'body'     => 'Status: not resolved',
            )
        );
        self::$mock_wp_mail->set_return_value( true );
    }

    /**
     * Test that register_routes registers the REST endpoints.
     *
     * @return void
     */
    public function testRegisterRoutesRegistersEndpoints(): void {
        self::$mock_register_rest_route->resetInvocationIndex();

        ( new Api_Handler_Admin_Debug_Email() )->register_routes();

        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );

        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/debug-email', $args[1] );
    }

    /**
     * Test that get_debug_data returns submitter email and ordered rows.
     *
     * @return void
     */
    public function testGetDebugDataReturnsSubmitterEmailAndRows(): void {
        $response = ( new Api_Handler_Admin_Debug_Email() )->get_debug_data();
        $data     = $response->get_data();

        $this->assertEquals( 200, $response->get_status() );
        $this->assertEquals( 'noreply@wordpress.com', $data['data']['submitterEmail'] );
        $this->assertCount( 7, $data['data']['rows'] );
        $this->assertEquals(
            'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_NAME',
            $data['data']['rows'][0]['key']
        );
        $this->assertEquals( 'Test Site', $data['data']['rows'][0]['value'] );
        $this->assertEquals( '120s', $data['data']['rows'][4]['value'] );
    }

    /**
     * Test that send_debug_email requires a support topic URL.
     *
     * @return void
     */
    public function testSendDebugEmailRequiresSupportTopicUrl(): void {
        $request  = new \WP_REST_Request();
        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $data     = $response->get_data();

        $this->assertEquals( 400, $response->get_status() );
        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_REQUIRED', $data['message'] );
        $this->assertEquals( 'supportTopicUrl', $data['data']['field'] );
    }

    /**
     * Test that send_debug_email validates the support topic URL host/path.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsInvalidSupportTopicUrl(): void {
        self::$mock_wp_remote_get->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'supportTopicUrl', 'https://example.com/topic/not-valid/' );

        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $data     = $response->get_data();

        $this->assertEquals( 400, $response->get_status() );
        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_INVALID', $data['message'] );
        $this->assertNull( self::$mock_wp_remote_get->get_invocation_arguments( 0 ) );
    }

    /**
     * Test that send_debug_email rejects resolved support topics.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsResolvedSupportTopic(): void {
        self::$mock_wp_remote_get->set_return_value(
            array(
                'response' => array(
                    'code' => 200,
                ),
                'body'     => 'Status: resolved',
            )
        );

        $request = new \WP_REST_Request();
        $request->set_param( 'supportTopicUrl', 'https://wordpress.org/support/topic/test-topic/' );

        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $data     = $response->get_data();

        $this->assertEquals( 409, $response->get_status() );
        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_RESOLVED', $data['message'] );
    }

    /**
     * Test that send_debug_email sends the report and includes the support topic URL.
     *
     * @return void
     */
    public function testSendDebugEmailSendsReportWithSupportTopicUrl(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'supportTopicUrl', 'https://wordpress.org/support/topic/test-topic/' );

        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $mail_args = self::$mock_wp_mail->get_invocation_arguments( 0 );

        $this->assertEquals( 200, $response->get_status() );
        $this->assertEquals( 'force-refresh@jordanleven.com', $mail_args[0] );
        $this->assertStringContainsString( 'Support Topic URL:      https://wordpress.org/support/topic/test-topic/', $mail_args[2] );
        $this->assertStringContainsString( 'Current Site Version:   abc12345', $mail_args[2] );
        $this->assertEquals( array( 'Cc: noreply@wordpress.com' ), $mail_args[3] );
    }

    /**
     * Test that get_rest_endpoint returns the correct URL.
     *
     * @return void
     */
    public function testGetRestEndpointReturnsCorrectUrl(): void {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/debug-email';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Admin_Debug_Email::get_rest_endpoint();

        $this->assertEquals( $expected_url, $result );
    }
}
