<?php
/**
 * Our test for debug storage services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use PHPUnit\Framework\TestCase;
use Mockery;
use phpmock\MockBuilder;
use phpmock\Mock;
use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-options-storage-service.php';

/**
 * Test for Debug Storage Service
 */
final class Options_Storage_Service_Test extends TestCase {

    /**
     * Our store for the mock of `get_option`.
     *
     * @var Mock
     */
    private static $mock_get_option;

    /**
     * Our store for the mock of `update_option`.
     *
     * @var Mock
     */
    private static $mock_update_option;

    /**
     * Initial test setup.
     *
     * @return  void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option    = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_update_option = new Mocks\Mock_Update_Option( __NAMESPACE__ );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_get_option->disable();
        self::$mock_update_option->disable();
    }

    /**
     * Test getting refresh interval from options.
     */
    public function testGetRefreshIntervalCallingOptionWithCorrectParams() {
        self::$mock_get_option->set_return_value( 0 );
        Options_Storage_Service::get_refresh_interval();
        $this->assertEquals( self::$mock_get_option->get_invocation_arguments( 0 )[0], 'force_refresh_refresh_interval' );
        $this->assertEquals( self::$mock_get_option->get_invocation_arguments( 0 )[1], 120 );
    }

    /**
     * Test getting refresh interval.
     */
    public function testGetRefreshInterval() {
        $refresh_interval = 5;
        self::$mock_get_option->set_return_value( $refresh_interval );
        $refresh_interval = Options_Storage_Service::get_refresh_interval();
        $this->assertEquals( $refresh_interval, $refresh_interval );
    }

    /**
     * Test getting show in admin bar from options.
     */
    public function testGetShowInAdminBarCalledWithCorrectParams() {
        self::$mock_get_option->resetInvocationIndex();
        self::$mock_get_option->set_return_value( false );
        Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( self::$mock_get_option->get_invocation_arguments( 0 )[0], 'force_refresh_show_in_wp_admin_bar' );
        $this->assertEquals( self::$mock_get_option->get_invocation_arguments( 0 )[1], 'false' );
    }

    /**
     * Test getting show in admin bar.
     */
    public function testGetShowInAdminBar() {
        $mock_show_in_menu_bar = false;
        self::$mock_get_option->set_return_value( $mock_show_in_menu_bar );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, $mock_show_in_menu_bar );
    }

    /**
     * Test getting show in admin bar from older version of Force Refresh ('true').
     */
    public function testGetShowInAdminBarWhenSetToStringifiedTrue() {
        self::$mock_get_option->set_return_value( 'true' );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, true );
    }

    /**
     * Test getting show in admin bar from older version of Force Refresh ('false').
     */
    public function testGetShowInAdminBarWhenSetToStringifiedFalse() {
        self::$mock_get_option->set_return_value( 'false' );
        $show_in_menu_bar = Options_Storage_Service::get_show_in_admin_bar();
        $this->assertEquals( $show_in_menu_bar, false );
    }

    /**
     * Test setting show in admin bar.
     */
    public function testSetOptionShowInMenuBar() {
        $mock_show_in_menu_bar = 'false';
        self::$mock_update_option->resetInvocationIndex();
        $show_in_menu_bar = Options_Storage_Service::set_option_show_in_admin_bar( $mock_show_in_menu_bar );
        $this->assertEquals( self::$mock_update_option->get_invocation_arguments( 0 )[0], 'force_refresh_show_in_wp_admin_bar' );
        $this->assertEquals( self::$mock_update_option->get_invocation_arguments( 0 )[1], $mock_show_in_menu_bar );
    }

    /**
     * Test setting refresh interval.
     */
    public function testSetOptionRefreshInterval() {
        $mock_refresh_interval = '120';
        self::$mock_update_option->resetInvocationIndex();
        $show_in_menu_bar = Options_Storage_Service::set_option_refresh_interval( $mock_refresh_interval );
        $this->assertEquals( self::$mock_update_option->get_invocation_arguments( 0 )[0], 'force_refresh_refresh_interval' );
        $this->assertEquals( self::$mock_update_option->get_invocation_arguments( 0 )[1], $mock_refresh_interval );
    }
}
