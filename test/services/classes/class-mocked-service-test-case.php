<?php
/**
 * Shared helpers for service tests that rely on function mocks.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use PHPUnit\Framework\TestCase;

/**
 * Base test case for mocked service tests.
 */
abstract class Mocked_Service_Test_Case extends TestCase {

    /**
     * Disable a list of mock instances.
     *
     * @param array $mocks The mocks to disable.
     *
     * @return void
     */
    protected static function disable_mocks( array $mocks ): void {
        foreach ( $mocks as $mock ) {
            $mock->disable();
        }
    }

    /**
     * Assert the last mock invocation matches the expected argument list.
     *
     * @param object $mock     The mock instance.
     * @param array  $expected The expected argument list.
     *
     * @return void
     */
    protected function assert_last_mock_call_equals( $mock, array $expected ): void {
        $this->assertEquals( $expected, $mock->get_last_invocation_arguments() );
    }

    /**
     * Assert a single argument from the last mock invocation.
     *
     * @param object $mock     The mock instance.
     * @param int    $position The zero-based argument index.
     * @param mixed  $expected The expected argument value.
     *
     * @return void
     */
    protected function assert_last_mock_argument_equals( $mock, int $position, $expected ): void {
        $arguments = $mock->get_last_invocation_arguments();

        $this->assertNotNull( $arguments );
        $this->assertArrayHasKey( $position, $arguments );
        $this->assertEquals( $expected, $arguments[ $position ] );
    }
}
