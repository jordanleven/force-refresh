<?php
/**
 * Our mock for the global `get_option` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `get_option` Mock
 */
final class Mock_Get_Option extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'get_option';

    /**
     * Per-key return value overrides.
     *
     * @var array<string, mixed>
     */
    private array $option_map = array();

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        $implementation = function ( string $option, $default = false ) {
            if ( array_key_exists( $option, $this->option_map ) ) {
                return $this->option_map[ $option ];
            }
            return $this->mock_return_value;
        };

        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME, $implementation );
    }

    /**
     * Set the return value for a specific option key.
     *
     * Takes precedence over the value set via set_return_value().
     *
     * @param string $key   The option name.
     * @param mixed  $value The value to return for that key.
     *
     * @return void
     */
    public function set_option_value( string $key, $value ): void {
        $this->option_map[ $key ] = $value;
    }

    /**
     * Remove all per-key overrides set via set_option_value().
     *
     * @return void
     */
    public function clear_option_map(): void {
        $this->option_map = array();
    }
}
