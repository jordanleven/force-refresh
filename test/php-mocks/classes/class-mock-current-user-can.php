<?php
/**
 * Our mock for the global `current_user_can` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `current_user_can` Mock
 */
final class Mock_Current_User_Can extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'current_user_can';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME );
    }
}
