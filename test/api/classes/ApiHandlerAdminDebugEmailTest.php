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
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-schedule-refresh-site.php';
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
     * Mock for `get_force_refresh_datash_plugin_data`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_force_refresh_plugin_data;

    /**
     * Mock for `get_option`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_option;

    /**
     * Mock for `get_option` in the API namespace.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_option_api;

    /**
     * Mock for `esc_url_raw`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_esc_url_raw;

    /**
     * Mock for `__`.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_translate;

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
                    'url'     => 'https://example.com/1984',
                    'name'    => 'Force Refresh Test Site',
                    'version' => '6.9.0',
                );

                return $map[ $key ] ?? null;
            }
        );
        self::$mock_get_force_refresh_plugin_data = new Mocks\Mock_Function( self::PLUGIN_NAMESPACE, 'get_force_refresh_plugin_data' );
        self::$mock_get_option                    = new Mocks\Mock_Function(
            self::SERVICES_NAMESPACE,
            'get_option',
            function ( string $key, $default = null ) {
                $map = array(
                    'force_refresh_current_site_version' => '20070629',
                    'force_refresh_refresh_interval'     => '1984',
                );

                return $map[ $key ] ?? $default;
            }
        );
        self::$mock_get_option_api                = new Mocks\Mock_Function(
            __NAMESPACE__,
            'get_option',
            function ( string $key, $default = null ) {
                $map = array(
                    'force_refresh_last_cron_run' => null,
                    'cron'                        => array(),
                );

                return $map[ $key ] ?? $default;
            }
        );
        self::$mock_translate                    = new Mocks\Mock_Function(
            __NAMESPACE__,
            '__',
            fn ( string $text ) => $text
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
        self::$mock_get_force_refresh_plugin_data->disable();
        self::$mock_get_option->disable();
        self::$mock_get_option_api->disable();
        self::$mock_translate->disable();
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
        self::$mock_get_force_refresh_plugin_data->set_return_value( array( 'Version' => '2.18.0' ) );
        self::$mock_get_main_plugin_file->set_return_value( '/tmp/force-refresh.php' );
        self::$mock_wp_get_current_user->set_return_value(
            (object) array(
                'user_email' => 'johnnyappleseed@wordpress.com',
            )
        );
        self::$mock_wp_remote_get->set_return_value(
            array(
                'body'     => 'Status: not resolved',
                'response' => array(
                    'code' => 200,
                ),
            )
        );
        self::$mock_wp_mail->set_return_value( true );
    }

    /**
     * Get the debug-data response payload.
     *
     * @return array
     */
    private function get_debug_data_payload(): array {
        $response = ( new Api_Handler_Admin_Debug_Email() )->get_debug_email();
        return $response->get_data();
    }

    /**
     * Send a debug email for a support topic and return the response data.
     *
     * @param string $support_topic_url The support topic URL.
     *
     * @return \WP_REST_Response
     */
    private function send_debug_email_for_topic( string $support_topic_url ): \WP_REST_Response {
        $request = new \WP_REST_Request();
        $request->set_param( 'supportTopicUrl', $support_topic_url );

        return ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
    }

    /**
     * Test that register_routes registers the REST endpoints.
     *
     * @return void
     */
    public function testRegisterRoutesRegistersForceRefreshNamespace(): void {
        self::$mock_register_rest_route->resetInvocationIndex();

        ( new Api_Handler_Admin_Debug_Email() )->register_routes();

        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );

        $this->assertEquals( 'force-refresh/v1', $args[0] );
    }

    /**
     * Test that register_routes registers the debug email path.
     *
     * @return void
     */
    public function testRegisterRoutesRegistersDebugEmailPath(): void {
        self::$mock_register_rest_route->resetInvocationIndex();

        ( new Api_Handler_Admin_Debug_Email() )->register_routes();

        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );

        $this->assertEquals( '/debug-email', $args[1] );
    }

    /**
     * Test that get_debug_data returns a 200 response.
     *
     * @return void
     */
    public function testGetDebugDataReturns200Response(): void {
        $response = ( new Api_Handler_Admin_Debug_Email() )->get_debug_email();

        $this->assertEquals( 200, $response->get_status() );
    }

    /**
     * Test that get_debug_data returns the current submitter email.
     *
     * @return void
     */
    public function testGetDebugDataReturnsSubmitterEmail(): void {
        $data = $this->get_debug_data_payload();

        $this->assertEquals( 'johnnyappleseed@wordpress.com', $data['data']['submitterEmail'] );
    }

    /**
     * Test that get_debug_data includes the site name row.
     *
     * @return void
     */
    public function testGetDebugDataIncludesSiteNameRow(): void {
        $rows = $this->get_debug_data_payload()['data']['debugData'];

        $this->assertContains(
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_NAME',
                'value' => 'Force Refresh Test Site',
            ),
            $rows,
        );
    }

    /**
     * Test that get_debug_data includes the refresh interval row.
     *
     * @return void
     */
    public function testGetDebugDataIncludesRefreshIntervalRow(): void {
        $rows = $this->get_debug_data_payload()['data']['debugData'];

        $this->assertContains(
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_REFRESH_INTERVAL',
                'value' => '1984s',
            ),
            $rows,
        );
    }

    /**
     * Test that get_debug_data includes the PHP version row.
     *
     * @return void
     */
    public function testGetDebugDataIncludesPhpVersionRow(): void {
        $rows = $this->get_debug_data_payload()['data']['debugData'];

        $this->assertContains(
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_PHP_VERSION',
                'value' => phpversion(),
            ),
            $rows,
        );
    }

    /**
     * Test that send_debug_email without a support topic returns 400.
     *
     * @return void
     */
    public function testSendDebugEmailWithoutSupportTopicReturns400(): void {
        $request  = new \WP_REST_Request();
        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );

        $this->assertEquals( 400, $response->get_status() );
    }

    /**
     * Test that send_debug_email without a support topic returns the required message key.
     *
     * @return void
     */
    public function testSendDebugEmailWithoutSupportTopicReturnsRequiredMessageKey(): void {
        $request  = new \WP_REST_Request();
        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $data     = $response->get_data();

        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_REQUIRED', $data['message'] );
    }

    /**
     * Test that send_debug_email without a support topic returns the field name.
     *
     * @return void
     */
    public function testSendDebugEmailWithoutSupportTopicReturnsSupportTopicField(): void {
        $request  = new \WP_REST_Request();
        $response = ( new Api_Handler_Admin_Debug_Email() )->send_debug_email( $request );
        $data     = $response->get_data();

        $this->assertEquals( 'supportTopicUrl', $data['data']['field'] );
    }

    /**
     * Test that send_debug_email rejects invalid support topic URLs with a 400.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsInvalidSupportTopicUrlWith400(): void {
        self::$mock_wp_remote_get->resetInvocationIndex();

        $response = $this->send_debug_email_for_topic( 'https://example.com/topic/not-valid/' );

        $this->assertEquals( 400, $response->get_status() );
    }

    /**
     * Test that send_debug_email returns the invalid URL message key.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsInvalidSupportTopicUrlWithMessageKey(): void {
        $response = $this->send_debug_email_for_topic( 'https://example.com/topic/not-valid/' );
        $data     = $response->get_data();

        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_INVALID', $data['message'] );
    }

    /**
     * Test that invalid support topic URLs do not trigger remote validation.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsInvalidSupportTopicUrlBeforeRemoteCall(): void {
        self::$mock_wp_remote_get->resetInvocationIndex();

        $this->send_debug_email_for_topic( 'https://example.com/topic/not-valid/' );

        $this->assertNull( self::$mock_wp_remote_get->get_invocation_arguments( 0 ) );
    }

    /**
     * Test that send_debug_email rejects resolved support topics with a 409.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsResolvedSupportTopicWith409(): void {
        self::$mock_wp_remote_get->set_return_value(
            array(
                              'body'     => 'Status: resolved',
                'response' => array(
                    'code' => 200,
                ),
            )
        );

        $response = $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $this->assertEquals( 409, $response->get_status() );
    }

    /**
     * Test that send_debug_email returns the resolved support topic message key.
     *
     * @return void
     */
    public function testSendDebugEmailRejectsResolvedSupportTopicWithMessageKey(): void {
        self::$mock_wp_remote_get->set_return_value(
            array(
                'response' => array(
                    'code' => 200,
                ),
                'body'     => 'Status: resolved',
            )
        );

        $response = $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );
        $data     = $response->get_data();

        $this->assertEquals( 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_RESOLVED', $data['message'] );
    }

    /**
     * Test that send_debug_email returns 200 when the report is sent.
     *
     * @return void
     */
    public function testSendDebugEmailReturns200WhenReportIsSent(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $response = $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $this->assertEquals( 200, $response->get_status() );
    }

    /**
     * Test that send_debug_email uses the configured recipient address.
     *
     * @return void
     */
    public function testSendDebugEmailUsesConfiguredRecipientAddress(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $mail_args = self::$mock_wp_mail->get_invocation_arguments( 0 );

        $this->assertEquals( 'force-refresh@jordanleven.com', $mail_args[0] );
    }

    /**
     * Test that send_debug_email includes the support topic URL in the email body.
     *
     * @return void
     */
    public function testSendDebugEmailIncludesSupportTopicUrlInEmailBody(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $mail_args = self::$mock_wp_mail->get_invocation_arguments( 0 );

        $this->assertStringContainsString( 'Support Topic URL:      https://wordpress.org/support/topic/test-topic/', $mail_args[2] );
    }

    /**
     * Test that send_debug_email includes the current site version in the email body.
     *
     * @return void
     */
    public function testSendDebugEmailIncludesCurrentSiteVersionInEmailBody(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $mail_args = self::$mock_wp_mail->get_invocation_arguments( 0 );

        $this->assertStringContainsString( 'Current Site Version:   20070629', $mail_args[2] );
    }

    /**
     * Test that send_debug_email CCs the current user.
     *
     * @return void
     */
    public function testSendDebugEmailCcsTheCurrentUser(): void {
        self::$mock_wp_mail->resetInvocationIndex();

        $this->send_debug_email_for_topic( 'https://wordpress.org/support/topic/test-topic/' );

        $mail_args = self::$mock_wp_mail->get_invocation_arguments( 0 );

        $this->assertEquals( array( 'Cc: johnnyappleseed@wordpress.com' ), $mail_args[3] );
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
