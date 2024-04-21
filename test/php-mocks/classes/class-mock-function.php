<?php
/**
 * Our mock function superclass.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

use phpmock\MockBuilder;
use phpmock\spy\Spy;

/**
 * Mock function superclass.
 */
class Mock_Function implements Mock_Function_Interface {

    /**
     * The value to return when the mock function is called.
     *
     * @var mixed
     */
    protected $mock_return_value;

    /**
     * The mock instance of the built spy.
     *
     * @var Mock
     */
    protected $mock_instance;

    /**
     * Class constructor.
     *
     * @param string   $mock_namespace The namespace for the mock function.
     * @param string   $mock_function_name The name of the function to mock.
     * @param callable $mock_implementation  The mock implementation.
     */
    public function __construct( string $mock_namespace, string $mock_function_name, callable $mock_implementation = null ) {
        $implementation      = (bool) $mock_implementation ? $mock_implementation : fn () => $this->mock_return_value;
        $spy                 = new Spy( $mock_namespace, $mock_function_name, $implementation );
        $this->mock_instance = $spy;
        $this->mock_instance->enable();
    }

    /**
     * Method for disabling the mock.
     *
     * @return void
     */
    public function disable() {
        $this->mock_instance->disable();
    }

    /**
     * Method to set the return value for the function.
     *
     * @param mixed $return_value The mock return value.
     */
    public function set_return_value( $return_value ) {
        $this->mock_return_value = $return_value;
    }

    /**
     * Method to get the arguments a mock was called with.
     *
     * @param int $invocation_index The index for the invocation to return.
     *
     * @return array An array of arguments.
     */
    public function get_invocation_arguments( int $invocation_index = 0 ) {
        $invocations = $this->mock_instance->getInvocations();

        if ( ! array_key_exists( $invocation_index, $invocations ) ) {
            return null;
        }

        return $invocations[ $invocation_index ]->getArguments();
    }

    /**
     * Method to get the number of times a mock was called.
     *
     * @return  int The number of times the mock was called.
     */
    public function get_invocation_count(): int {
        return count( $this->mock_instance->getInvocations() );
    }
}
