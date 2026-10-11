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
use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

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
        $show_refresh_in_admin_bar = $request->get_param( 'show_refresh_in_admin_bar' ) ?? null;
        $refresh_interval          = $request->get_param( 'refresh_interval' ) ?? null;
        $update_method             = $this->get_requested_update_method( $request );

        // Reject the whole request before anything is saved.
        $update_method_error = null === $update_method ? null : $this->get_update_method_error( $update_method );

        if ( null !== $update_method_error ) {
            return $this->return_api_response( \WP_Http::BAD_REQUEST, $update_method_error );
        }

        if ( null !== $show_refresh_in_admin_bar ) {
            Options_Storage_Service::set_option_show_in_admin_bar( $show_refresh_in_admin_bar );
        }

        if ( null !== $refresh_interval ) {
            Options_Storage_Service::set_option_refresh_interval( $refresh_interval );
        }

        if ( null !== $update_method ) {
            Options_Storage_Service::set_update_method( $update_method );

            if ( Options_Storage_Service::UPDATE_METHOD_STATIC_FILE === $update_method ) {
                Versions_Storage_Service::sync_version_file();
            }
        }

        return $this->return_api_response(
            \WP_Http::CREATED,
            'You\'ve successfully updated options.',
        );
    }

    /**
     * Method for getting the update method a request asks for.
     *
     * The `update_method` parameter wins. The `use_static_file_polling`
     * parameter from before there were three methods is still understood.
     *
     * @param \WP_REST_Request $request The WP ReST request.
     *
     * @return mixed The requested update method, or null when the request does not change it.
     */
    private function get_requested_update_method( \WP_REST_Request $request ) {
        $update_method           = $request->get_param( 'update_method' ) ?? null;
        $use_static_file_polling = $request->get_param( 'use_static_file_polling' ) ?? null;

        if ( null !== $update_method || null === $use_static_file_polling ) {
            return $update_method;
        }

        return (bool) $use_static_file_polling
            ? Options_Storage_Service::UPDATE_METHOD_STATIC_FILE
            : Options_Storage_Service::UPDATE_METHOD_REST;
    }

    /**
     * Method for getting why a requested update method cannot be saved.
     *
     * While the WebSockets feature flag is off, WebSockets is reported as an
     * unknown method so the response does not reveal an unreleased feature.
     *
     * @param mixed $update_method The requested update method.
     *
     * @return string|null The error message, or null when the method can be saved.
     */
    private function get_update_method_error( $update_method ): ?string {
        $unknown_method_error = 'The update method is not recognized.';

        if ( ! in_array( $update_method, Options_Storage_Service::UPDATE_METHODS, true ) ) {
            return $unknown_method_error;
        }

        if ( Options_Storage_Service::UPDATE_METHOD_WEBSOCKETS !== $update_method ) {
            return null;
        }

        $unavailable_reason = Options_Storage_Service::get_websockets_unavailable_reason();

        if ( Options_Storage_Service::WEBSOCKETS_UNAVAILABLE_FEATURE_DISABLED === $unavailable_reason ) {
            return $unknown_method_error;
        }

        if ( Options_Storage_Service::WEBSOCKETS_UNAVAILABLE_RELAY_NOT_CONFIGURED === $unavailable_reason ) {
            return 'WebSockets cannot be used until a relay is configured.';
        }

        return null;
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
