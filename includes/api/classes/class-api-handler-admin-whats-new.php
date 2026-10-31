<?php
/**
 * Our API calls responsible for recording that an admin has seen What's New.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Whats_New_Service;

use function JordanLeven\Plugins\ForceRefresh\get_force_refresh_plugin_data;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Whats_New extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/whats-new';

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
                'callback'            => array( $this, 'mark_seen' ),
                'permission_callback' => $this->get_admin_permission_callback(),
            ),
        );
    }

    /**
     * Method for recording that the current user has seen What's New for the installed version.
     *
     * The version comes from the server rather than the request so a client can't skip ahead.
     *
     * @return \WP_REST_Response
     */
    public function mark_seen(): \WP_REST_Response {
        $version = (string) get_force_refresh_plugin_data()['Version'];

        Whats_New_Service::mark_seen( get_current_user_id(), $version );

        return $this->return_api_response(
            \WP_Http::CREATED,
            'What\'s New has been marked as seen.',
            array( 'version' => $version )
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
