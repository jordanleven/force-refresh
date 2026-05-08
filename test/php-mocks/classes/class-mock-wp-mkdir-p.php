<?php
/**
 * Our mock for the global `wp_mkdir_p` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `wp_mkdir_p` Mock
 */
final class Mock_Wp_Mkdir_P extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'wp_mkdir_p';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        $mock_implementation = fn( string $path ) => mkdir( $path, 0755, true );
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME, $mock_implementation );
    }
}
