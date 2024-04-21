<?php
/**
 * Our mock for the global `wp_hash` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `wp_hash` Mock
 */
final class Mock_WP_Hash extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'wp_hash';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        $mock_implementation = fn( $a ) => sprintf( 'hash-%s', $a );
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME, $mock_implementation );
    }
}
