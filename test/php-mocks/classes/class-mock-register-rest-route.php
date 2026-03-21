<?php
/**
 * Our mock for the global `register_rest_route` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `register_rest_route` Mock
 */
final class Mock_Register_Rest_Route extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'register_rest_route';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME );
    }
}
