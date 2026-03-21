<?php
/**
 * Our mock for the global `wp_json_encode` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `wp_json_encode` Mock
 */
final class Mock_Wp_Json_Encode extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'wp_json_encode';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        $mock_implementation = fn( $data, $flags = 0, $depth = 512 ) => json_encode( $data, $flags, $depth );
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME, $mock_implementation );
    }
}
