<?php
/**
 * API handler for checking WebSocket support on the server.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Health_Websocket extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/websocket/health';

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
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_websocket_health' ),
                'permission_callback' => $this->get_admin_permission_callback(),
            ),
        );
    }

    /**
     * Returns whether the server supports WebSocket connections.
     *
     * @return \WP_REST_Response
     */
    public function get_websocket_health(): \WP_REST_Response {
        return $this->return_api_response(
            \WP_Http::OK,
            'WebSocket health check retrieved.',
            array( 'websocket_supported' => extension_loaded( 'sockets' ) ),
        );
    }

    /**
     * Returns the full REST endpoint URL for this handler.
     *
     * @return string
     */
    public static function get_rest_endpoint(): string {
        return self::get_formatted_rest_endpoint( self::ENDPOINT_PATH, self::ENDPOINT_VERSION );
    }
}
