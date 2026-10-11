<?php
/**
 * Our test for feature flag services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

require_once __DIR__ . '/../../../includes/services/classes/class-feature-flag-service.php';

/**
 * Test for Feature Flag Service
 */
final class FeatureFlagServiceTest extends TestCase {

    /**
     * Reset static flag cache before each test.
     *
     * @return void
     */
    protected function setUp(): void {
        $reflection = new ReflectionClass( Feature_Flag_Service::class );
        $flags_prop = $reflection->getProperty( 'flags' );
        $flags_prop->setAccessible( true );
        $flags_prop->setValue( null, null );
    }

    /**
     * Directly inject known flags into the static cache.
     *
     * @param array $flags The flags to set.
     *
     * @return void
     */
    private function set_flags( array $flags ): void {
        $reflection = new ReflectionClass( Feature_Flag_Service::class );
        $flags_prop = $reflection->getProperty( 'flags' );
        $flags_prop->setAccessible( true );
        $flags_prop->setValue( null, $flags );
    }

    /**
     * is_enabled returns false when the flag is not present.
     */
    public function testIsEnabledReturnsFalseWhenFlagIsNotPresent() {
        $this->set_flags( array() );
        $this->assertFalse( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * is_enabled returns false when the scheduledRefresh flag is false.
     */
    public function testIsEnabledReturnsFalseWhenScheduledRefreshIsFalse() {
        $this->set_flags( array( 'scheduledRefresh' => false ) );
        $this->assertFalse( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * is_enabled returns true when the scheduledRefresh flag is true.
     */
    public function testIsEnabledReturnsTrueWhenScheduledRefreshIsTrue() {
        $this->set_flags( array( 'scheduledRefresh' => true ) );
        $this->assertTrue( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * get_all returns the full flags array.
     */
    public function testGetAllReturnsAllFlags() {
        $flags = array( 'scheduledRefresh' => false );
        $this->set_flags( $flags );
        $this->assertSame( $flags, Feature_Flag_Service::get_all() );
    }

    /**
     * get_all returns an empty array when no flags are set.
     */
    public function testGetAllReturnsEmptyArrayWhenNoFlagsAreSet() {
        $this->set_flags( array() );
        $this->assertSame( array(), Feature_Flag_Service::get_all() );
    }

    /**
     * Point the service at a throwaway plugin directory holding the given flags.
     *
     * Only usable in a separate process, because it defines the plugin
     * directory constant.
     *
     * @param array $flags The flags the config file should return.
     *
     * @return void
     */
    private function write_config_file( array $flags ): void {
        $plugin_dir = sys_get_temp_dir() . '/force-refresh-flags-test-' . uniqid();
        mkdir( $plugin_dir . '/config', 0755, true );
        file_put_contents(
            $plugin_dir . '/config/feature-flags.php',
            '<?php return ' . var_export( $flags, true ) . ';'
        );

        define( 'WP_FORCE_REFRESH_PLUGIN_DIR', $plugin_dir );

        register_shutdown_function(
            static function () use ( $plugin_dir ) {
                unlink( $plugin_dir . '/config/feature-flags.php' );
                rmdir( $plugin_dir . '/config' );
                rmdir( $plugin_dir );
            }
        );
    }

    /**
     * Flags come from the config file untouched when no override is defined.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testFlagsAreLoadedFromConfigWhenNoOverrideIsDefined() {
        $this->write_config_file(
            array(
                'websockets'       => false,
                'scheduledRefresh' => true,
            )
        );

        $this->assertFalse( Feature_Flag_Service::is_enabled( 'websockets' ) );
        $this->assertTrue( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * The override constant turns on a flag that is off in the config file.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantEnablesAFlag() {
        $this->write_config_file( array( 'websockets' => false ) );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'websockets' => true ) );

        $this->assertTrue( Feature_Flag_Service::is_enabled( 'websockets' ) );
        $this->assertSame( array( 'websockets' => true ), Feature_Flag_Service::get_all() );
    }

    /**
     * The override constant turns off a flag that is on in the config file.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantDisablesAFlag() {
        $this->write_config_file( array( 'scheduledRefresh' => true ) );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'scheduledRefresh' => false ) );

        $this->assertFalse( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * Flags the override does not mention keep their configured value.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantLeavesOtherFlagsAlone() {
        $this->write_config_file(
            array(
                'websockets'       => false,
                'scheduledRefresh' => true,
            )
        );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'websockets' => true ) );

        $this->assertTrue( Feature_Flag_Service::is_enabled( 'scheduledRefresh' ) );
    }

    /**
     * Names that are not in the config file are ignored, so they never reach JavaScript.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantIgnoresUnknownFlags() {
        $this->write_config_file( array( 'websockets' => false ) );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'notARealFlag' => true ) );

        $this->assertSame( array( 'websockets' => false ), Feature_Flag_Service::get_all() );
    }

    /**
     * Override values are cast to booleans.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantValuesAreCastToBooleans() {
        $this->write_config_file( array( 'websockets' => false ) );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'websockets' => 1 ) );

        $this->assertSame( array( 'websockets' => true ), Feature_Flag_Service::get_all() );
    }

    /**
     * An override that is not an array is ignored.
     */
    #[RunInSeparateProcess]
    #[PreserveGlobalState( false )]
    public function testOverrideConstantIsIgnoredWhenNotAnArray() {
        $this->write_config_file( array( 'websockets' => false ) );
        define( 'FORCE_REFRESH_FEATURE_FLAGS', true );

        $this->assertFalse( Feature_Flag_Service::is_enabled( 'websockets' ) );
    }
}
