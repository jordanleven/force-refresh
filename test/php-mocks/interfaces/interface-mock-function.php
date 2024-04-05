<?php
/**
 * Our mock function interface.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

interface Mock_Function_Interface {
    /**
     * Method to set the mocked function's return value.
     *
     * @param mixed $mock_value The mock value to return.
     */
    public function set_return_value( $mock_value );

    /**
     * Method to get the arguments a mock was called with.
     *
     * @param int $invocation_index The index for the invocation to return.
     *
     * @return array An array of arguments.
     */
    public function get_invocation_arguments( int $invocation_index = 0 );

    /**
     * Method to get number of times a mock has been called.
     *
     * @return int The number of times a method was called.
     */
    public function get_invocation_count(): int;
}
