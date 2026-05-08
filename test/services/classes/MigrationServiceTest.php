<?php
/**
 * Tests for Migration_Service.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-migration-service.php';

/**
 * Tests for Migration_Service.
 */
final class MigrationServiceTest extends Mocked_Service_Test_Case {

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
     * The wpdb stub instance.
     *
     * @var \wpdb
     */
    private static \wpdb $wpdb;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option    = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_update_option = new Mocks\Mock_Update_Option( __NAMESPACE__ );

        global $wpdb;
        self::$wpdb = new \wpdb();
        $wpdb       = self::$wpdb;
    }

    /**
     * Reset mocks before each test.
     *
     * @return void
     */
    public function setUp(): void {
        self::$mock_get_option->set_return_value( array() );
        self::$mock_get_option->clear_option_map();
        self::$wpdb->set_next_results( array() );
        self::$wpdb->last_delete_args = null;
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

    // -------------------------------------------------------------------------
    // run_pending
    // -------------------------------------------------------------------------

    /**
     * Runs the migration when it has not yet been applied.
     */
    public function testRunPendingRunsMigrationWhenNotApplied(): void {
        self::$mock_get_option->set_return_value( array() );

        Migration_Service::run_pending();

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( Migration_Service::OPTION_MIGRATIONS_RAN, $args[0] );
        $this->assertContains( 'consolidate_page_versions_to_option', $args[1] );
    }

    /**
     * Skips the migration when it has already been applied.
     */
    public function testRunPendingSkipsMigrationWhenAlreadyApplied(): void {
        self::$mock_get_option->set_return_value( array( 'consolidate_page_versions_to_option' ) );
        self::$mock_update_option->resetInvocationIndex();

        Migration_Service::run_pending();

        $args = self::$mock_update_option->get_last_invocation_arguments();
        $this->assertSame( Migration_Service::OPTION_MIGRATIONS_RAN, $args[0] );
        $this->assertCount( 1, $args[1] );
    }

    // -------------------------------------------------------------------------
    // migrate_page_versions_to_option
    // -------------------------------------------------------------------------

    /**
     * Writes consolidated page versions to the new option when legacy rows exist.
     */
    public function testMigrationWritesPageVersionsToOption(): void {
        self::$mock_get_option->set_return_value( array() );

        $row1           = new \stdClass();
        $row1->post_id  = '10';
        $row1->meta_value = 'v1';

        $row2           = new \stdClass();
        $row2->post_id  = '20';
        $row2->meta_value = 'v2';

        self::$wpdb->set_next_results( array( $row1, $row2 ) );
        self::$mock_update_option->resetInvocationIndex();

        Migration_Service::run_pending();

        // run_pending calls update_option(OPTION_PAGE_VERSIONS, ...) first, then update_option(OPTION_MIGRATIONS_RAN, ...).
        $args = self::$mock_update_option->get_invocation_arguments( 0 );
        $this->assertSame( Versions_Storage_Service::OPTION_PAGE_VERSIONS, $args[0] );
        $this->assertSame( 'v1', $args[1]['10'] );
        $this->assertSame( 'v2', $args[1]['20'] );
    }

    /**
     * Deletes the legacy post meta rows after migrating.
     */
    public function testMigrationDeletesLegacyPostMeta(): void {
        self::$mock_get_option->set_return_value( array() );

        $row            = new \stdClass();
        $row->post_id   = '5';
        $row->meta_value = 'ver';

        self::$wpdb->set_next_results( array( $row ) );

        Migration_Service::run_pending();

        $this->assertNotNull( self::$wpdb->last_delete_args );
        $this->assertSame( 'wp_postmeta', self::$wpdb->last_delete_args[0] );
        $this->assertSame( Versions_Storage_Service::OPTION_PAGE_VERSION_LEGACY, self::$wpdb->last_delete_args[1]['meta_key'] );
    }

    /**
     * Does not write or delete anything when no legacy rows exist.
     */
    public function testMigrationDoesNothingWhenNoLegacyRowsExist(): void {
        self::$mock_get_option->set_return_value( array() );
        self::$wpdb->set_next_results( array() );

        Migration_Service::run_pending();

        $this->assertNull( self::$wpdb->last_delete_args );
    }
}
