<?php
/**
 * Tests for Migration_Service.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;
use PHPUnit\Framework\Attributes\TestWith;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
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
     * Every migration ID, in the order they run.
     *
     * @var string[]
     */
    const ALL_MIGRATIONS = array(
        'consolidate_page_versions_to_option',
        'update_method_from_static_file_polling',
    );

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
        self::$mock_update_option->resetInvocationIndex();
    }

    /**
     * Collect the options written since the test started.
     *
     * @return array<string, mixed> The written values keyed by option name.
     */
    private function get_written_options(): array {
        $written = array();
        $offset  = 0;

        while ( true ) {
            $arguments = self::$mock_update_option->get_invocation_arguments( $offset );

            if ( null === $arguments ) {
                return $written;
            }

            $written[ $arguments[0] ] = $arguments[1];
            --$offset;
        }
    }

    /**
     * Set what is stored for the update method and the legacy static file option.
     *
     * @param mixed $update_method          The stored update method.
     * @param mixed $is_static_file_polling The stored legacy option.
     *
     * @return void
     */
    private function set_stored_update_method( $update_method, $is_static_file_polling ): void {
        self::$mock_get_option->set_option_value( Options_Storage_Service::OPTION_UPDATE_METHOD, $update_method );
        self::$mock_get_option->set_option_value( Options_Storage_Service::OPTION_STATIC_FILE_POLLING, $is_static_file_polling );
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
     * Writes nothing when every migration has already been applied.
     */
    public function testRunPendingSkipsMigrationsWhenAlreadyApplied(): void {
        self::$mock_get_option->set_option_value( Migration_Service::OPTION_MIGRATIONS_RAN, self::ALL_MIGRATIONS );
        $invocation_count_before = self::$mock_update_option->get_invocation_count();

        Migration_Service::run_pending();

        $this->assertSame( $invocation_count_before, self::$mock_update_option->get_invocation_count() );
    }

    /**
     * Records every migration once they have all run.
     */
    public function testRunPendingRecordsEveryMigration(): void {
        Migration_Service::run_pending();

        $this->assertSame( self::ALL_MIGRATIONS, $this->get_written_options()[ Migration_Service::OPTION_MIGRATIONS_RAN ] );
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

    // -------------------------------------------------------------------------
    // migrate_static_file_polling_to_update_method
    // -------------------------------------------------------------------------

    /**
     * A site that used static file polling keeps it.
     */
    public function testMigrationStoresStaticFileForSitesUsingStaticFilePolling(): void {
        $this->set_stored_update_method( false, '1' );

        Migration_Service::run_pending();

        $this->assertSame( 'static_file', $this->get_written_options()[ Options_Storage_Service::OPTION_UPDATE_METHOD ] );
    }

    /**
     * A site that did not use static file polling gets REST.
     *
     * @param mixed $is_static_file_polling The stored legacy option.
     */
    #[TestWith( array( false ) )]
    #[TestWith( array( '' ) )]
    public function testMigrationStoresRestForEveryOtherSite( $is_static_file_polling ): void {
        $this->set_stored_update_method( false, $is_static_file_polling );

        Migration_Service::run_pending();

        $this->assertSame( 'rest', $this->get_written_options()[ Options_Storage_Service::OPTION_UPDATE_METHOD ] );
    }

    /**
     * The migration leaves the legacy option for older versions to keep reading.
     */
    public function testMigrationDoesNotWriteTheLegacyOption(): void {
        $this->set_stored_update_method( false, '1' );

        Migration_Service::run_pending();

        $this->assertArrayNotHasKey( Options_Storage_Service::OPTION_STATIC_FILE_POLLING, $this->get_written_options() );
    }

    /**
     * Running the migration again keeps a method that was already stored.
     *
     * @param string $update_method          The stored update method.
     * @param mixed  $is_static_file_polling The stored legacy option.
     */
    #[TestWith( array( 'rest', '' ) )]
    #[TestWith( array( 'static_file', '1' ) )]
    #[TestWith( array( 'websockets', '' ) )]
    public function testMigrationIsIdempotent( string $update_method, $is_static_file_polling ): void {
        $this->set_stored_update_method( $update_method, $is_static_file_polling );

        Migration_Service::run_pending();

        $this->assertSame( $update_method, $this->get_written_options()[ Options_Storage_Service::OPTION_UPDATE_METHOD ] );
    }

    /**
     * The migration is not run again once it has been recorded.
     */
    public function testMigrationDoesNotRunOnceRecorded(): void {
        self::$mock_get_option->set_option_value( Migration_Service::OPTION_MIGRATIONS_RAN, self::ALL_MIGRATIONS );
        $this->set_stored_update_method( false, '1' );

        Migration_Service::run_pending();

        $this->assertArrayNotHasKey( Options_Storage_Service::OPTION_UPDATE_METHOD, $this->get_written_options() );
    }
}
