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
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME );
    }
}
