<?php
/**
 * Tests for Whats_New_Service.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-versions-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-migration-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-whats-new-service.php';

/**
 * Tests for Whats_New_Service.
 */
final class WhatsNewServiceTest extends Mocked_Service_Test_Case {

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
     * Mock for `get_user_meta`.
     *
     * @var Mocks\Mock_Get_User_Meta
     */
    private static $mock_get_user_meta;

    /**
     * Mock for `update_user_meta`.
     *
     * @var Mocks\Mock_Update_User_Meta
     */
    private static $mock_update_user_meta;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option       = new Mocks\Mock_Get_Option( __NAMESPACE__ );
        self::$mock_update_option    = new Mocks\Mock_Update_Option( __NAMESPACE__ );
        self::$mock_get_user_meta    = new Mocks\Mock_Get_User_Meta( __NAMESPACE__ );
        self::$mock_update_user_meta = new Mocks\Mock_Update_User_Meta( __NAMESPACE__ );
    }

    /**
     * Reset mocks before each test.
     *
     * @return void
     */
    public function setUp(): void {
        self::$mock_get_option->set_return_value( false );
        self::$mock_get_option->clear_option_map();
        self::$mock_get_user_meta->set_return_value( '' );
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
                self::$mock_get_user_meta,
                self::$mock_update_user_meta,
            )
        );
    }

    /**
     * A fresh install records its version so What's New stays quiet until the next update.
     */
    public function testRecordFirstInstalledVersionStoresVersionOnFreshInstall(): void {
        Whats_New_Service::record_first_installed_version( '3.3.0' );

        $this->assert_last_mock_call_equals(
            self::$mock_update_option,
            array( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '3.3.0' )
        );
    }

    /**
     * A site that already ran Force Refresh is an upgrade, so it stores an empty version.
     */
    public function testRecordFirstInstalledVersionStoresEmptyVersionOnExistingInstall(): void {
        self::$mock_get_option->set_option_value( Migration_Service::OPTION_MIGRATIONS_RAN, array( 'consolidate_page_versions_to_option' ) );

        Whats_New_Service::record_first_installed_version( '3.3.0' );

        $this->assert_last_mock_call_equals(
            self::$mock_update_option,
            array( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '' )
        );
    }

    /**
     * The first-installed version is only recorded once.
     */
    public function testRecordFirstInstalledVersionDoesNothingWhenAlreadyRecorded(): void {
        self::$mock_get_option->set_option_value( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '3.3.0' );
        $calls_before = self::$mock_update_option->get_invocation_count();

        Whats_New_Service::record_first_installed_version( '3.4.0' );

        $this->assertSame( $calls_before, self::$mock_update_option->get_invocation_count() );
    }

    /**
     * A user's own last-seen version takes precedence.
     */
    public function testGetLastSeenVersionPrefersUserMeta(): void {
        self::$mock_get_user_meta->set_return_value( '3.2.1' );
        self::$mock_get_option->set_option_value( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '3.0.0' );

        $this->assertSame( '3.2.1', Whats_New_Service::get_last_seen_version( 1 ) );
    }

    /**
     * Users on a fresh install fall back to the version it was installed at.
     */
    public function testGetLastSeenVersionFallsBackToFirstInstalledVersion(): void {
        self::$mock_get_option->set_option_value( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '3.3.0' );

        $this->assertSame( '3.3.0', Whats_New_Service::get_last_seen_version( 1 ) );
    }

    /**
     * Users upgrading from before tracking existed have no last-seen version.
     */
    public function testGetLastSeenVersionIsNullForUpgradedSites(): void {
        self::$mock_get_option->set_option_value( Whats_New_Service::OPTION_FIRST_INSTALLED_VERSION, '' );

        $this->assertNull( Whats_New_Service::get_last_seen_version( 1 ) );
    }

    /**
     * Marking What's New as seen stores the version on the user.
     */
    public function testMarkSeenStoresVersionInUserMeta(): void {
        Whats_New_Service::mark_seen( 7, '3.3.0' );

        $this->assert_last_mock_call_equals(
            self::$mock_update_user_meta,
            array( 7, Whats_New_Service::USER_META_LAST_SEEN_VERSION, '3.3.0' )
        );
    }
}
