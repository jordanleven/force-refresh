<?php
/**
 * Our mock for the global `wp_schedule_single_event` function.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Class for the `wp_schedule_single_event` Mock
 */
final class Mock_Wp_Schedule_Single_Event extends Mock_Function implements Mock_Function_Interface {

    /**
     * The name of the function to mock.
     *
     * @var string
     */
    const MOCK_FUNCTION_NAME = 'wp_schedule_single_event';

    /**
     * Class constructor.
     *
     * @param string $mock_namespace The namespace for the function to be mocked.
     */
    public function __construct( string $mock_namespace ) {
        parent::__construct( $mock_namespace, self::MOCK_FUNCTION_NAME );
    }
}
