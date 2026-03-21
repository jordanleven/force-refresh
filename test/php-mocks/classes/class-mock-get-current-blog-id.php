<?php
/**
 * Our mock for the global `get_current_blog_id` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `get_current_blog_id` Mock
 */
final class Mock_Get_Current_Blog_Id extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'get_current_blog_id';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME );
    }
}
