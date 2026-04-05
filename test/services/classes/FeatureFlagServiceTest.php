<?php
/**
 * Our test for feature flag services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

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
}
