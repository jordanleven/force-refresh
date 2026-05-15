<?php
/**
 * Tests for the Refresh_Counter_Service class.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-refresh-counter-service.php';

/**
 * Tests for Refresh_Counter_Service.
 */
final class RefreshCounterServiceTest extends Mocked_Service_Test_Case {

    /**
     * Mock for `get_option`.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option;

    /**
     * Mock for `update_option`.
     *
     * @var Mocks\Mock_Update_Option
     */
    private static $mock_update_option;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option    = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_update_option = new Mocks\Mock_Update_Option( __NAMESPACE__ );
    }

    /**
     * Reset mocks before each test.
     *
     * @return void
     */
    public function setUp(): void {
        self::$mock_get_option->clear_option_map();
        self::$mock_get_option->set_return_value( 0 );
        self::$mock_update_option->resetInvocationIndex();
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::disable_mocks(
            array(
                self::$mock_get_option,
                self::$mock_update_option,
            )
        );
    }

    /**
     * Returns zero when no site refresh count is stored.
     */
    public function testGetRefreshCountSiteReturnsZeroWhenNotSet(): void {
        self::$mock_get_option->set_return_value( null );

        $this->assertSame( 0, Refresh_Counter_Service::get_refresh_count_site() );
    }

    /**
     * Returns the stored site refresh count.
     */
    public function testGetRefreshCountSiteReturnsStoredCount(): void {
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_site', 5 );

        $this->assertSame( 5, Refresh_Counter_Service::get_refresh_count_site() );
    }

    /**
     * Returns zero for a page with no stored count.
     */
    public function testGetRefreshCountPageReturnsZeroWhenNotSet(): void {
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_page', array() );

        $this->assertSame( 0, Refresh_Counter_Service::get_refresh_count_page( 42 ) );
    }

    /**
     * Returns the stored count for the given page ID.
     */
    public function testGetRefreshCountPageReturnsStoredCountForPage(): void {
        self::$mock_get_option->set_option_value(
            'force_refresh_refresh_count_page',
            array( '42' => 3, '99' => 7 )
        );

        $this->assertSame( 3, Refresh_Counter_Service::get_refresh_count_page( 42 ) );
        $this->assertSame( 7, Refresh_Counter_Service::get_refresh_count_page( 99 ) );
    }

    /**
     * Increment saves the new site count via update_option.
     */
    public function testIncrementSiteRefreshCountSavesIncrementedValue(): void {
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_site', 4 );

        Refresh_Counter_Service::increment_site_refresh_count();

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 'force_refresh_refresh_count_site', $args[0] );
        $this->assertSame( 5, $args[1] );
    }

    /**
     * Increment page count saves the new count for the correct page ID.
     */
    public function testIncrementPageRefreshCountSavesIncrementedValueForPage(): void {
        self::$mock_get_option->set_option_value(
            'force_refresh_refresh_count_page',
            array( '42' => 2 )
        );

        Refresh_Counter_Service::increment_page_refresh_count( 42 );

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 'force_refresh_refresh_count_page', $args[0] );
        $this->assertSame( 3, $args[1]['42'] );
    }

    /**
     * Increment page count does not affect other pages.
     */
    public function testIncrementPageRefreshCountDoesNotAffectOtherPages(): void {
        self::$mock_get_option->set_option_value(
            'force_refresh_refresh_count_page',
            array( '42' => 2, '99' => 10 )
        );

        Refresh_Counter_Service::increment_page_refresh_count( 42 );

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 10, $args[1]['99'] );
    }

    /**
     * Increment page count starts from zero for a new page.
     */
    public function testIncrementPageRefreshCountStartsFromZeroForNewPage(): void {
        self::$mock_get_option->set_option_value( 'force_refresh_refresh_count_page', array() );

        Refresh_Counter_Service::increment_page_refresh_count( 5 );

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( 1, $args[1]['5'] );
    }
}
