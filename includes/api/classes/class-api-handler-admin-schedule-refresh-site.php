<?php
/**
 * Our API calls responsible for handling requests from admins requesting a scheduled refresh.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Schedule_Refresh_Site extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/schedule-site-version';

    /**
     * The version for this endpoint.
     *
     * @var int
     */
    const ENDPOINT_VERSION = 1;

    const ACTION_NAME_SCHEDULE_REFRESH_SITE = 'force_refresh_scheduled_site_refresh';

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
                'callback'            => array( $this, 'schedule_refresh_site' ),
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );

        self::register_rest_endpoint(
            self::ENDPOINT_PATH,
            self::ENDPOINT_VERSION,
            array(
                'methods'             => \WP_REST_Server::DELETABLE,
                'callback'            => array( $this, 'delete_schedule_refresh_site' ),
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );
    }

    /**
     * Method for registering all of our actions.
     *
     * @return  void
     */
    public function register_actions(): void {
        add_action( self::ACTION_NAME_SCHEDULE_REFRESH_SITE, array( $this, 'executeSiteRefresh' ) );
    }

    /**
     * Method for executing a scheduled site refresh.
     *
     * @return  void
     */
    public function executeSiteRefresh(): void {
        $site_version = Versions_Storage_Service::get_new_version();
        Versions_Storage_Service::set_site_version( $site_version );
    }

    /**
     * Method for getting all scheduled refresh.
     *
     * @return mixed The scheduled events.
     */
    public static function get_scheduled_refreshes() {
        return wp_get_scheduled_event( self::ACTION_NAME_SCHEDULE_REFRESH_SITE );
    }

    /**
     * Method for deleting a scheduled refresh.
     *
     * @param \WP_REST_Request $request The request object.
     *
     * @return void
     */
    public function delete_schedule_refresh_site( \WP_REST_Request $request ): void {
        $scheduled_refresh      = $request->get_param( 'schedule_refresh_timestamp' ) ?? null;
        $scheduled_refresh_time = strtotime( $scheduled_refresh );

        wp_clear_scheduled_hook( self::ACTION_NAME_SCHEDULE_REFRESH_SITE, array( 'time' => $scheduled_refresh_time ) );

        $this->return_api_response(
            202,
            'You\'ve successfully deleted a site refresh.',
            array(
                'scheduled_refresh_time' => $scheduled_refresh_time,
            )
        );
    }

    /**
     * Method for refreshing the site version.
     *
     * @param \WP_REST_Request $request The request object.
     *
     * @return void
     */
    public function schedule_refresh_site( \WP_REST_Request $request ): void {
        $scheduled_refresh      = $request->get_param( 'schedule_refresh_timestamp' ) ?? null;
        $scheduled_refresh_time = strtotime( $scheduled_refresh );

        wp_schedule_single_event( $scheduled_refresh_time, self::ACTION_NAME_SCHEDULE_REFRESH_SITE, array( 'time' => $scheduled_refresh_time ) );

        $this->return_api_response(
            201,
            'You\'ve successfully scheduled a site refresh.',
            array(
                'scheduled_refresh_time' => $scheduled_refresh_time,
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
