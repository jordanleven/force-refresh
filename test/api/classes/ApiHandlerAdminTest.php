<?php
/**
 * Tests for the Api_Handler_Admin base class.
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
 * Tests for Api_Handler_Admin.
 */
final class ApiHandlerAdminTest extends TestCase {

    /**
     * Mock for `current_user_can`.
     *
     * @var Mocks\Mock_Current_User_Can
     */
    private static $mock_current_user_can;

    /**
     * Mock for `get_current_blog_id` (required for class loading).
     *
     * @var Mocks\Mock_Get_Current_Blog_Id
     */
    private static $mock_get_current_blog_id;

    /**
     * Mock for `get_rest_url` (required for class loading).
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
     * Mock for `register_rest_route`.
     *
     * @var Mocks\Mock_Register_Rest_Route
     */
    private static $mock_register_rest_route;

    /**
     * Mock for `update_option` in services namespace.
     *
     * @var Mocks\Mock_Update_Option
     */
    private static $mock_update_option_services;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_current_user_can       = new Mocks\Mock_Current_User_Can( __NAMESPACE__ );
        self::$mock_get_current_blog_id    = new Mocks\Mock_Get_Current_Blog_Id( __NAMESPACE__ );
        self::$mock_get_rest_url           = new Mocks\Mock_Get_Rest_Url( __NAMESPACE__ );
        self::$mock_status_header          = new Mocks\Mock_Status_Header( __NAMESPACE__ );
        self::$mock_wp_json_encode         = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );
        self::$mock_register_rest_route    = new Mocks\Mock_Register_Rest_Route( __NAMESPACE__ );
        self::$mock_update_option_services = new Mocks\Mock_Update_Option( 'JordanLeven\\Plugins\\ForceRefresh\\Services' );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_current_user_can->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_status_header->disable();
        self::$mock_wp_json_encode->disable();
        self::$mock_register_rest_route->disable();
        self::$mock_update_option_services->disable();
    }

    /**
     * Test that user_is_able_to_admin_force_refresh returns true when user has capability.
     */
    public function testUserIsAbleToAdminForceRefreshReturnsTrueWhenUserHasCapability() {
        self::$mock_current_user_can->set_return_value( true );
        $handler = new Api_Handler_Admin_Options();
        $this->assertTrue( $handler->user_is_able_to_admin_force_refresh() );
    }

    /**
     * Test that user_is_able_to_admin_force_refresh returns false when user lacks capability.
     */
    public function testUserIsAbleToAdminForceRefreshReturnsFalseWhenUserLacksCapability() {
        self::$mock_current_user_can->set_return_value( false );
        $handler = new Api_Handler_Admin_Options();
        $this->assertFalse( $handler->user_is_able_to_admin_force_refresh() );
    }

    /**
     * Test that user_is_able_to_admin_force_refresh checks the correct capability.
     */
    public function testUserIsAbleToAdminForceRefreshChecksCorrectCapability() {
        self::$mock_current_user_can->resetInvocationIndex();
        self::$mock_current_user_can->set_return_value( true );
        $handler = new Api_Handler_Admin_Options();
        $handler->user_is_able_to_admin_force_refresh();
        $this->assertEquals( WP_FORCE_REFRESH_CAPABILITY, self::$mock_current_user_can->get_invocation_arguments( 0 )[0] );
    }
}
