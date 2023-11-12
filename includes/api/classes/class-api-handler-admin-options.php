<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Options extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/options';

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
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );
    }

    /**
     * Method for saving options
     *
     * @param \WP_REST_Request $request The WP ReST request.
     *
     * @return void
     */
    public function save_options( \WP_REST_Request $request ): void {
        $show_refresh_in_admin_bar = $request->get_param( 'show_refresh_in_admin_bar' ) ?? null;
        $refresh_interval          = $request->get_param( 'refresh_interval' ) ?? null;

        if ( null !== $show_refresh_in_admin_bar ) {
            Options_Storage_Service::set_option_show_in_admin_bar( $show_refresh_in_admin_bar );
        }

        if ( null !== $refresh_interval ) {
            Options_Storage_Service::set_option_refresh_interval( $refresh_interval );
        }

        $this->return_api_response(
            201,
            'You\'ve successfully updated options.',
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
