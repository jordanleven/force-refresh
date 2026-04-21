<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Debug_Storage_Service;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Debugging extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/debugging';

    /**
     * The version for this endpoint.
     *
     * @var int
     */
    const ENDPOINT_VERSION = 1;

    /**
     * Method for registering the endpoints for this class.
     *
     * @return void
     */
    public function register_routes(): void {
        self::register_rest_endpoint(
            self::ENDPOINT_PATH,
            self::ENDPOINT_VERSION,
            array(
                'methods'             => \WP_REST_Server::EDITABLE,
                'callback'            => array( $this, 'save_options' ),
                'permission_callback' => $this->get_admin_permission_callback(),
            ),
        );
    }

    /**
     * Method for saving options
     *
     * @param \WP_REST_Request $request The WP ReST request.
     *
     * @return \WP_REST_Response
     */
    public function save_options( \WP_REST_Request $request ): \WP_REST_Response {
        $debug_mode = $request->get_param( 'debug' ) === true ?? null;

        Debug_Storage_Service::set_debug_mode( $debug_mode );

        return $this->return_api_response(
            \WP_Http::CREATED,
            'You\'ve successfully updated debug mode.'
        );
    }

    /**
     * Method for getting the endpoint for this service.
     *
     * @return  string  The service endpoint.
     */
    public static function get_rest_endpoint(): string {
        return self::get_formatted_rest_endpoint( self::ENDPOINT_PATH, self::ENDPOINT_VERSION );
    }
}
