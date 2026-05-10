<?php
/**
 * Tests for actions-client.php.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use JordanLeven\Plugins\ForceRefresh\Services\Feature_Flag_Service;
use PHPUnit\Framework\TestCase;
use JordanLeven\Plugins\ForceRefresh\Mocks;

if ( ! defined( 'WP_FORCE_REFRESH_PLUGIN_DIR' ) ) {
    define( 'WP_FORCE_REFRESH_PLUGIN_DIR', __DIR__ . '/../../../' );
}

require_once __DIR__ . '/../../../includes/api/interfaces/interface-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler.php';
require_once __DIR__ . '/../../../includes/api/classes/class-api-handler-client.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-options-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-debug-storage-service.php';
require_once __DIR__ . '/../../../includes/services/classes/class-feature-flag-service.php';
require_once __DIR__ . '/../../../includes/actions/client/actions-client.php';

/**
 * Tests for get_client_localized_data.
 */
final class ActionsClientTest extends TestCase {

    /**
     * Services namespace constant.
     */
    const SERVICES_NAMESPACE = 'JordanLeven\\Plugins\\ForceRefresh\\Services';

    /**
     * API namespace constant.
     */
    const API_NAMESPACE = 'JordanLeven\\Plugins\\ForceRefresh\\Api';

    /**
     * Mock for `get_option` in the services namespace.
     *
     * @var Mocks\Mock_Get_Option
     */
    private static $mock_get_option_services;

    /**
     * Mock for `get_the_ID` in the plugin namespace.
     *
     * @var Mocks\Mock_Function
     */
    private static $mock_get_the_id;

    /**
     * Mock for `get_current_blog_id` in the API namespace.
     *
     * @var Mocks\Mock_Get_Current_Blog_Id
     */
    private static $mock_get_current_blog_id;

    /**
     * Mock for `get_rest_url` in the API namespace.
     *
     * @var Mocks\Mock_Get_Rest_Url
     */
    private static $mock_get_rest_url;

    /**
     * Mock for `wp_upload_dir` in the services namespace.
     *
     * @var Mocks\Mock_Wp_Upload_Dir
     */
    private static $mock_wp_upload_dir;

    /**
     * Mock for `current_time` in the services namespace.
     *
     * @var Mocks\Mock_Current_Time
     */
    private static $mock_current_time;

    /**
     * Initial test setup.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$mock_get_option_services = new Mocks\Mock_Get_Option( self::SERVICES_NAMESPACE );
        self::$mock_get_the_id          = new Mocks\Mock_Function( __NAMESPACE__, 'get_the_ID' );
        self::$mock_get_current_blog_id = new Mocks\Mock_Get_Current_Blog_Id( self::API_NAMESPACE );
        self::$mock_get_rest_url        = new Mocks\Mock_Get_Rest_Url( self::API_NAMESPACE );
        self::$mock_wp_upload_dir       = new Mocks\Mock_Wp_Upload_Dir( self::SERVICES_NAMESPACE );
        self::$mock_current_time        = new Mocks\Mock_Current_Time( self::SERVICES_NAMESPACE );

        self::$mock_get_the_id->set_return_value( 42 );
        self::$mock_get_current_blog_id->set_return_value( 1 );
        self::$mock_get_rest_url->set_return_value( 'http://example.com/wp-json/force-refresh/v1/current-version' );
        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => sys_get_temp_dir(),
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
    }

    /**
     * Test teardown.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::$mock_get_option_services->disable();
        self::$mock_get_the_id->disable();
        self::$mock_get_current_blog_id->disable();
        self::$mock_get_rest_url->disable();
        self::$mock_wp_upload_dir->disable();
        self::$mock_current_time->disable();
    }

    /**
     * Test that versionFileUrl is null when static file polling is disabled.
     */
    public function testVersionFileUrlIsNullWhenOptionIsDisabled(): void {
        self::$mock_get_option_services->set_return_value( false );

        $data = get_client_localized_data();

        $this->assertNull( $data['versionFileUrl'] );
    }

    /**
     * Test that versionFileUrl is present and contains the expected path when static file polling is enabled.
     */
    public function testVersionFileUrlIsNonNullWhenOptionIsEnabled(): void {
        Feature_Flag_Service::set_flags_for_testing( array( 'staticFilePolling' => true ) );
        self::$mock_get_option_services->set_return_value( true );

        $data = get_client_localized_data();

        Feature_Flag_Service::set_flags_for_testing( array() );

        $this->assertNotNull( $data['versionFileUrl'] );
        $this->assertStringContainsString( 'version.json', $data['versionFileUrl'] );
    }
}
