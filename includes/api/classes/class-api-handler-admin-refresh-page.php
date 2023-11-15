<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the page.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Refresh_Page extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/page-version';

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
                'callback'            => array( $this, 'refresh_page' ),
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );
    }

    /**
     * Method for refreshing the page version.
     *
     * @param \WP_REST_Request $request The request object.
     *
     * @return void
     */
    public function refresh_page( \WP_REST_Request $request ): void {
        $page_id      = $request->get_param( 'postId' ) ?? null;
        $page_version = Versions_Storage_Service::get_new_version();

        Versions_Storage_Service::set_page_version( $page_id, $page_version );

        $this->return_api_response(
            201,
            'You\'ve successfully requested all browsers to refresh this page.',
            array(
                'new_page_version' => $page_version,
                'page_id'          => $page_id,
                'refresh_interval' => Options_Storage_Service::get_refresh_interval(),
            )
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
