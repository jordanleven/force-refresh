<?php
/**
 * Tests for the Api_Handler_Admin_Schedule_Refresh_Site class.
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
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-admin-schedule-refresh-site.php';

/**
 * Tests for Api_Handler_Admin_Schedule_Refresh_Site.
 */
final class ApiHandlerAdminScheduleRefreshSiteTest extends TestCase {

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
     * Mock for `delete_option` in the services namespace.
     *
     * @var Mocks\Mock_Delete_Option
     */
    private static $mock_delete_option;

    /**
     * Mock for `add_option` in the services namespace.
     *
     * @var Mocks\Mock_Add_Option
     */
    private static $mock_add_option;

    /**
     * Mock for `get_option` in the API namespace.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Mock for `wp_schedule_single_event`.
     *
     * @var Mocks\Mock_Wp_Schedule_Single_Event
     */
    private static $mock_wp_schedule_single_event;

    /**
     * Mock for `wp_clear_scheduled_hook`.
     *
     * @var Mocks\Mock_Wp_Clear_Scheduled_Hook
     */
    private static $mock_wp_clear_scheduled_hook;

    /**
     * Mock for `register_rest_route`.
     *
     * @var Mocks\Mock_Register_Rest_Route
     */
    private static $mock_register_rest_route;

    /**
     * Mock for `add_action`.
     *
     * @var Mocks\Mock_Add_Action
     */
    private static $mock_add_action;

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
     * Mock for `wp_generate_uuid4`.
     *
     * @var Mocks\Mock_Wp_Generate_Uuid4
     */
    private static $mock_wp_generate_uuid4;

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
        self::$mock_delete_option             = new Mocks\Mock_Delete_Option( self::SERVICES_NAMESPACE );
        self::$mock_add_option                = new Mocks\Mock_Add_Option( self::SERVICES_NAMESPACE );
        self::$mock_get_option                = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_wp_schedule_single_event  = new Mocks\Mock_Wp_Schedule_Single_Event( __NAMESPACE__ );
        self::$mock_wp_clear_scheduled_hook   = new Mocks\Mock_Wp_Clear_Scheduled_Hook( __NAMESPACE__ );
        self::$mock_register_rest_route       = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_add_action                = new Mocks\Mock_Add_Action( __NAMESPACE__ );
        self::$mock_get_current_blog_id       = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url              = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_current_user_can          = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
        self::$mock_wp_generate_uuid4         = new Mocks\Mock_Wp_Generate_Uuid4( __NAMESPACE__ );
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
        self::$mock_delete_option->disable();
        self::$mock_add_option->disable();
        self::$mock_get_option->disable();
        self::$mock_wp_schedule_single_event->disable();
        self::$mock_wp_clear_scheduled_hook->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_add_action->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_current_user_can->disable();
        self::$mock_wp_generate_uuid4->disable();
    }

    /**
     * Test that register_routes registers the REST endpoints.
     */
    public function testRegisterRoutesRegistersEndpoints() {
        self::$mock_register_rest_route->resetInvocationIndex();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->register_routes();
        $args = self::$mock_register_rest_route->get_invocation_arguments( 0 );
        $this->assertEquals( 'force-refresh/v1', $args[0] );
        $this->assertEquals( '/schedule-site-version', $args[1] );
    }

    /**
     * Test that register_actions registers the action hook.
     */
    public function testRegisterActionsRegistersHook() {
        self::$mock_add_action->resetInvocationIndex();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->register_actions();
        $args = self::$mock_add_action->get_invocation_arguments( 0 );
        $this->assertEquals( 'force_refresh_scheduled_site_refresh', $args[0] );
    }

    /**
     * Test that executeSiteRefresh saves a new site version.
     */
    public function testExecuteSiteRefreshSavesNewSiteVersion() {
        self::$mock_current_time->set_return_value( '2007-06-29 18:00:00' );
        self::$mock_delete_option->resetInvocationIndex();
        self::$mock_add_option->resetInvocationIndex();

        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->executeSiteRefresh( time() );

        $this->assertEquals( 'force_refresh_current_site_version', self::$mock_delete_option->get_invocation_arguments( 0 )[0] );
        $this->assertEquals( 'force_refresh_current_site_version', self::$mock_add_option->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that get_scheduled_refreshes returns an empty array when cron option is not an array.
     */
    public function testGetScheduledRefreshesReturnsEmptyArrayWhenCronIsNotArray() {
        self::$mock_get_option->set_return_value( false );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertEquals( array(), $result );
    }

    /**
     * Test that get_scheduled_refreshes returns an empty array when cron has no matching events.
     */
    public function testGetScheduledRefreshesReturnsEmptyArrayWhenNoMatchingEvents() {
        self::$mock_get_option->set_return_value(
            array(
                1234567890 => array(
                    'some_other_action' => array( 'args' => array() ),
                ),
            )
        );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertEquals( array(), $result );
    }

    /**
     * Test that get_scheduled_refreshes returns matching events.
     */
    public function testGetScheduledRefreshesReturnsMatchingEvents() {
        self::$mock_get_option->set_return_value(
            array(
                1234567890 => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( 'test-uuid' ) ),
                    ),
                ),
            )
        );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertCount( 1, $result );
    }

    /**
     * Test that get_scheduled_refreshes includes the timestamp in each returned event.
     */
    public function testGetScheduledRefreshesIncludesTimestamp() {
        $timestamp = 1234567890;
        self::$mock_get_option->set_return_value(
            array(
                $timestamp => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( 'test-uuid' ) ),
                    ),
                ),
            )
        );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertEquals( $timestamp, $result[0]['timestamp'] );
    }

    /**
     * Test that get_scheduled_refreshes returns events sorted by latest first.
     */
    public function testGetScheduledRefreshesReturnsSortedBySoonestFirst() {
        self::$mock_get_option->set_return_value(
            array(
                9999999999 => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( 'uuid-far' ) ),
                    ),
                ),
                1000000000 => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'def' => array( 'schedule' => false, 'args' => array( 'uuid-soon' ) ),
                    ),
                ),
            )
        );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertEquals( 9999999999, $result[0]['timestamp'] );
        $this->assertEquals( 1000000000, $result[1]['timestamp'] );
    }

    /**
     * Test that get_scheduled_refreshes skips non-array cron entries.
     */
    public function testGetScheduledRefreshesSkipsNonArrayCronEntries() {
        self::$mock_get_option->set_return_value(
            array(
                'version'  => 2,
                123456789  => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( 'test-uuid' ) ),
                    ),
                ),
            )
        );
        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_scheduled_refreshes();
        $this->assertCount( 1, $result );
    }

    /**
     * Test that get_scheduled_refreshes_site returns a 200 response with scheduled refreshes.
     */
    public function testGetScheduledRefreshSiteReturns200Response() {
        self::$mock_status_header->resetInvocationIndex();
        $timestamp = 1234567890;
        self::$mock_get_option->set_return_value(
            array(
                $timestamp => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( 'test-uuid' ) ),
                    ),
                ),
            )
        );

        ob_start();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->get_scheduled_refreshes_site();
        ob_get_clean();

        $this->assertEquals( 200, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that schedule_refresh_site schedules a WordPress cron event.
     */
    public function testScheduleRefreshSiteSchedulesEvent() {
        self::$mock_wp_schedule_single_event->resetInvocationIndex();
        self::$mock_wp_generate_uuid4->set_return_value( 'test-uuid-5678' );

        $timestamp          = '2026-12-31 12:00:00';
        $expected_unix_time = strtotime( $timestamp );

        $request = new \WP_REST_Request();
        $request->set_param( 'schedule_refresh_timestamp', $timestamp );

        ob_start();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->schedule_refresh_site( $request );
        ob_get_clean();

        $args = self::$mock_wp_schedule_single_event->get_invocation_arguments( 0 );
        $this->assertEquals( $expected_unix_time, $args[0] );
        $this->assertEquals( 'force_refresh_scheduled_site_refresh', $args[1] );
        $this->assertEquals( array( 'test-uuid-5678' ), $args[2] );
    }

    /**
     * Test that schedule_refresh_site returns a 201 response.
     */
    public function testScheduleRefreshSiteReturns201Response() {
        self::$mock_status_header->resetInvocationIndex();

        $request = new \WP_REST_Request();
        $request->set_param( 'schedule_refresh_timestamp', '2026-12-31 12:00:00' );

        ob_start();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->schedule_refresh_site( $request );
        ob_get_clean();

        $this->assertEquals( 201, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that delete_schedule_refresh_site clears the scheduled hook.
     */
    public function testDeleteScheduleRefreshSiteClearsScheduledHook() {
        self::$mock_wp_clear_scheduled_hook->resetInvocationIndex();

        $uuid = 'test-uuid-1234';
        self::$mock_get_option->set_return_value(
            array(
                9999999999 => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( $uuid ) ),
                    ),
                ),
            )
        );
        self::$mock_wp_clear_scheduled_hook->set_return_value( 1 );

        $request = new \WP_REST_Request();
        $request->set_param( 'id', $uuid );

        ob_start();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->delete_schedule_refresh_site( $request );
        ob_get_clean();

        $args = self::$mock_wp_clear_scheduled_hook->get_invocation_arguments( 0 );
        $this->assertEquals( 'force_refresh_scheduled_site_refresh', $args[0] );
        $this->assertEquals( array( $uuid ), $args[1] );
    }

    /**
     * Test that delete_schedule_refresh_site returns a 202 response.
     */
    public function testDeleteScheduleRefreshSiteReturns202Response() {
        self::$mock_status_header->resetInvocationIndex();

        $uuid = 'test-uuid-1234';
        self::$mock_get_option->set_return_value(
            array(
                9999999999 => array(
                    'force_refresh_scheduled_site_refresh' => array(
                        'abc' => array( 'schedule' => false, 'args' => array( $uuid ) ),
                    ),
                ),
            )
        );
        self::$mock_wp_clear_scheduled_hook->set_return_value( 1 );

        $request = new \WP_REST_Request();
        $request->set_param( 'id', $uuid );

        ob_start();
        ( new Api_Handler_Admin_Schedule_Refresh_Site() )->delete_schedule_refresh_site( $request );
        ob_get_clean();

        $this->assertEquals( 202, self::$mock_status_header->get_invocation_arguments( 0 )[0] );
    }

    /**
     * Test that get_rest_endpoint returns the correct URL.
     */
    public function testGetRestEndpointReturnsCorrectUrl() {
        $expected_url = 'https://example.com/wp-json/force-refresh/v1/schedule-site-version';
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( $expected_url );

        $result = Api_Handler_Admin_Schedule_Refresh_Site::get_rest_endpoint();

        $this->assertEquals( $expected_url, $result );
    }
}
