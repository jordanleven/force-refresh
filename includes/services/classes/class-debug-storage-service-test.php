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

require_once __DIR__ . '/class-debug-storage-service.php';

/**
 * Test for Debug Storage Service
 */
final class Debug_Storage_Service_Test extends TestCase {

    /**
     * Our store for the mock of `get_option`.
     *
     * @var Mock
     */
    private static $mock_get_option;

    /**
     * Our store for the mock of `current_time`.
     *
     * @var Mock
     */
    private static $mock_current_time;

    /**
     * Our store for the mock of `update_option`.
     *
     * @var Mock
     */
    private static $mock_update_option;

    /**
     * Our store for the mock of `delete_option`.
     *
     * @var Mock
     */
    private static $mock_delete_option;

    /**
     * Initial test setup.
     *
     * @return  void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option    = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_current_time  = new Mocks\Mock_Current_Time( __NAMESPACE__ );
        self::$mock_update_option = new Mocks\Mock_Update_Option( __NAMESPACE__ );
        self::$mock_delete_option = new Mocks\Mock_Delete_Option( __NAMESPACE__ );
    }

    /**
     * When the debug option is not set.
     */
    public function testDebugModeIsOffWhenOptionIsNotSet() {
        self::$mock_get_option->set_return_value( false );
        $is_debug_mode_active = Debug_Storage_Service::debug_mode_is_active();

        $this->assertFalse( $is_debug_mode_active );
    }

    /**
     * When the debug option is set and within the timeframe.
     */
    public function testDebugModeIsOnWhenOptionIsSetAndWithinTimeFrame() {
        $mock_debug_active_date = '06/29/2007 06:00:00 PM';
        $mock_current_date      = '06/29/2007 06:30:00 PM';

        self::$mock_get_option->set_return_value( $mock_debug_active_date );
        self::$mock_current_time->set_return_value( $mock_current_date );
        $is_debug_mode_active = Debug_Storage_Service::debug_mode_is_active();

        $this->assertTrue( $is_debug_mode_active );
    }

    /**
     * When the debug option is set and not within the timeframe.
     */
    public function testDebugModeIsOnWhenOptionIsSetAndNotWithinTimeFrame() {
        $mock_debug_active_date = '06/20/2007 06:00:00 PM';
        $mock_current_date      = '06/29/2007 06:30:00 PM';

        self::$mock_get_option->set_return_value( $mock_debug_active_date );
        self::$mock_current_time->set_return_value( $mock_current_date );
        $is_debug_mode_active = Debug_Storage_Service::debug_mode_is_active();

        $this->assertFalse( $is_debug_mode_active );
    }

    /**
     * When turning debug mode on.
     */
    public function testTurningDebugModeOn() {
        $mock_current_date = '06/29/2007 06:30:00 PM';

        $this->assertEquals( self::$mock_update_option->get_invocation_count(), 0 );

        self::$mock_current_time->set_return_value( $mock_current_date );
        self::$mock_update_option->set_return_value( $mock_current_date );
        Debug_Storage_Service::set_debug_mode( true );

        $this->assertEquals( self::$mock_update_option->get_invocation_arguments( 0 )[1], $mock_current_date );
    }

    /**
     * When turning debug mode off.
     */
    public function testTurningDebugModeOff() {
        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 0 );

        Debug_Storage_Service::set_debug_mode( false );

        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 1 );
    }
}
