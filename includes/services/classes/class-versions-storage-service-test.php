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

require_once __DIR__ . '/class-versions-storage-service.php';

/**
 * Test for Debug Storage Service
 */
final class Versions_Storage_Service_Test extends TestCase {

    /**
     * Our store for the mock of `get_option`.
     *
     * @var Mock
     */
    private static $mock_get_option;

    /**
     * Our store for the mock of `add_option`.
     *
     * @var Mock
     */
    private static $mock_add_option;

    /**
     * Our store for the mock of `delete_option`.
     *
     * @var Mock
     */
    private static $mock_delete_option;

    /**
     * Our store for the mock of `update_post_meta`.
     *
     * @var Mock
     */
    private static $mock_update_post_meta;

    /**
     * Our store for the mock of `delete_post_meta`.
     *
     * @var Mock
     */
    private static $mock_delete_post_meta;

    /**
     * Our store for the mock of `current_time`.
     *
     * @var Mock
     */
    private static $mock_current_time;

    /**
     * Our store for the mock of `wp_hash`.
     *
     * @var Mock
     */
    private static $mock_wp_hash;

    /**
     * Initial test setup.
     *
     * @return  void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option       = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_add_option       = new Mocks\Mock_Add_Option( __NAMESPACE__ );
        self::$mock_delete_option    = new Mocks\Mock_Delete_Option( __NAMESPACE__ );
        self::$mock_update_post_meta = new Mocks\Mock_Update_Post_Meta( __NAMESPACE__ );
        self::$mock_delete_post_meta = new Mocks\Mock_Delete_Post_Meta( __NAMESPACE__ );
        self::$mock_current_time     = new Mocks\Mock_Current_Time( __NAMESPACE__ );
        self::$mock_wp_hash          = new Mocks\Mock_WP_Hash( __NAMESPACE__ );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_get_option->disable();
        self::$mock_add_option->disable();
        self::$mock_delete_option->disable();
        self::$mock_update_post_meta->disable();
        self::$mock_delete_post_meta->disable();
        self::$mock_current_time->disable();
        self::$mock_wp_hash->disable();
    }

    /**
     * When the site version isn't set.
     */
    public function testReturnsZeroIfSiteVersionIsNotSet() {
        self::$mock_get_option->set_return_value( null );
        $site_version = Versions_Storage_Service::get_site_version();
        $this->assertEquals( $site_version, '0' );
    }

    /**
     * When the site version is set.
     */
    public function testReturnsZeroIfSiteVersionIsSet() {
        $site_version = '1984';
        self::$mock_get_option->set_return_value( $site_version );
        $site_version = Versions_Storage_Service::get_site_version();
        $this->assertEquals( $site_version, $site_version );
    }

    /**
     * Updating the site version.
     */
    public function testSetSiteVersion() {
        $site_version_new = '1984';

        $this->assertEquals( self::$mock_add_option->get_invocation_count(), 0 );
        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 0 );

        Versions_Storage_Service::set_site_version( $site_version_new );

        $this->assertEquals( self::$mock_add_option->get_invocation_count(), 1 );
        $this->assertEquals( self::$mock_delete_option->get_invocation_count(), 1 );

        $this->assertEquals( self::$mock_delete_option->get_invocation_arguments( 0 )[0], 'force_refresh_current_site_version' );
        $this->assertEquals( self::$mock_add_option->get_invocation_arguments( 0 ), array( 'force_refresh_current_site_version', $site_version_new ) );
    }

    /**
     * Updating the page version.
     */
    public function testSetPageVersion() {
        $page_id          = 2007;
        $page_version_new = '1984';

        $this->assertEquals( self::$mock_update_post_meta->get_invocation_count(), 0 );
        $this->assertEquals( self::$mock_delete_post_meta->get_invocation_count(), 0 );

        Versions_Storage_Service::set_page_version( $page_id, $page_version_new );

        $this->assertEquals( self::$mock_delete_post_meta->get_invocation_arguments( 0 ), array( $page_id, 'force_refresh_current_page_version' ) );
        $invocation_arguments = self::$mock_update_post_meta->get_invocation_arguments( 0 );

        $this->assertEquals(
            array_slice( $invocation_arguments, 0, 3 ),
            array(
                $page_id,
                'force_refresh_current_page_version',
                $page_version_new,
            )
        );
    }

    /**
     * Returns a truncated and hashed version of the time.
     */
    public function testGetNewVersion() {
        self::$mock_current_time->set_return_value( '1984' );

        $new_version = Versions_Storage_Service::get_new_version();

        $this->assertEquals( 'hash-198', $new_version );
    }
}
