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

    const ENDPOINT_PATH_CRON_STATUS = '/cron-status';

    const OPTION_NAME_LAST_CRON_RUN = 'force_refresh_last_cron_run';

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
                array(
                    'methods'             => \WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_scheduled_refreshes_site' ),
                    'permission_callback' => $this->get_admin_permission_callback(),
                ),
                array(
                    'methods'             => \WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'schedule_refresh_site' ),
                    'permission_callback' => $this->get_admin_permission_callback(),
                ),
            ),
        );

        self::register_rest_endpoint(
            self::ENDPOINT_PATH_CRON_STATUS,
            self::ENDPOINT_VERSION,
            array(
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_cron_status' ),
                'permission_callback' => $this->get_admin_permission_callback(),
            ),
        );

        // Register DELETE endpoint with ID path parameter.
        self::register_rest_endpoint(
            self::ENDPOINT_PATH . '/(?P<id>[a-f0-9\-]+)',
            self::ENDPOINT_VERSION,
            array(
                array(
                    'methods'             => \WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_schedule_refresh_site' ),
                    'permission_callback' => $this->get_admin_permission_callback(),
                    'args'                => array(
                        'id' => array(
                            'description' => 'The unique identifier of the scheduled refresh.',
                            'type'        => 'string',
                            'required'    => true,
                        ),
                    ),
                ),
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
     * @param string $uuid The UUID for the scheduled refresh.
     *
     * @return  void
     */
    public function executeSiteRefresh( string $uuid ): void {
        $site_version = Versions_Storage_Service::get_new_version();
        Versions_Storage_Service::set_site_version( $site_version );
        update_option( self::OPTION_NAME_LAST_CRON_RUN, time() );
    }

    /**
     * Method for getting the timestamp of the last cron execution.
     *
     * @return int|null Unix timestamp of the last run, or null if never run.
     */
    public static function get_last_cron_run(): ?int {
        $value = get_option( self::OPTION_NAME_LAST_CRON_RUN, null );
        return $value !== null ? (int) $value : null;
    }

    /**
     * Method to get all scheduled refreshes from a cron event.
     *
     * @param array $cron_event The cron event.
     * @param int   $timestamp  The Unix timestamp for the event.
     *
     * @return array The scheduled refreshes
     */
    public static function get_scheduled_refreshes_from_cron_event( array $cron_event, int $timestamp ) {
        $scheduled_refreshes = array();
        foreach ( $cron_event as $event_name => $event_data ) {
            if ( self::ACTION_NAME_SCHEDULE_REFRESH_SITE === $event_name ) {
                foreach ( $event_data as $event ) {
                    array_push(
                        $scheduled_refreshes,
                        array(
                            'timestamp' => $timestamp,
                            'id'        => $event['args'][0],
                        )
                    );
                }
            }
        }

        return $scheduled_refreshes;
    }

    /**
     * Method for getting all scheduled refresh.
     *
     * @return mixed The scheduled events.
     */
    public static function get_scheduled_refreshes() {
        $scheduled_refreshes = array();
        $cron                = get_option( 'cron' );

        if ( ! is_array( $cron ) ) {
            return $scheduled_refreshes;
        }

        foreach ( $cron as $timestamp => $cron_event ) {
            if ( ! is_array( $cron_event ) ) {
                continue;
            }

            $scheduled_refreshes = array_merge(
                $scheduled_refreshes,
                self::get_scheduled_refreshes_from_cron_event( $cron_event, (int) $timestamp ),
            );
        }

        return self::sort_scheduled_refreshes_by_timestamp_desc( $scheduled_refreshes );
    }

    /**
     * Sort scheduled refreshes by timestamp in descending order (newest first).
     *
     * @param array $scheduled_refreshes Array of scheduled refresh items.
     *
     * @return array Sorted scheduled refreshes.
     */
    public static function sort_scheduled_refreshes_by_timestamp_desc( array $scheduled_refreshes ): array {
        usort(
            $scheduled_refreshes,
            function ( $a, $b ) {
                return $b['timestamp'] - $a['timestamp'];
            }
        );

        return $scheduled_refreshes;
    }

    /**
     * Method for getting all scheduled refreshes.
     *
     * @return \WP_REST_Response
     */
    public function get_scheduled_refreshes_site(): \WP_REST_Response {
        return $this->return_api_response(
            \WP_Http::OK,
            'Successfully retrieved scheduled refreshes.',
            array(
                'scheduled_refreshes' => self::get_scheduled_refreshes(),
            )
        );
    }

    /**
     * Method for deleting a scheduled refresh.
     *
     * @param \WP_REST_Request $request The request object.
     *
     * @return \WP_REST_Response
     */
    public function delete_schedule_refresh_site( \WP_REST_Request $request ): \WP_REST_Response {
        $id = $request->get_param( 'id' ) ?? null;

        // Validate ID is provided.
        if ( empty( $id ) ) {
            return $this->return_api_response(
                \WP_Http::BAD_REQUEST,
                'Missing schedule ID.',
                array()
            );
        }

        // Check if the scheduled event exists before attempting to delete.
        $cron         = get_option( 'cron' );
        $event_exists = false;

        if ( is_array( $cron ) ) {
            foreach ( $cron as $cron_event ) {
                if ( ! is_array( $cron_event ) ) {
                    continue;
                }

                if ( isset( $cron_event[ self::ACTION_NAME_SCHEDULE_REFRESH_SITE ] ) ) {
                    foreach ( $cron_event[ self::ACTION_NAME_SCHEDULE_REFRESH_SITE ] as $event ) {
                        if ( isset( $event['args'][0] ) && $event['args'][0] === $id ) {
                            $event_exists = true;
                            break 2;
                        }
                    }
                }
            }
        }

        // Return 404 if event doesn't exist.
        if ( ! $event_exists ) {
            return $this->return_api_response(
                \WP_Http::NOT_FOUND,
                'Scheduled refresh not found.',
                array( 'id' => $id )
            );
        }

        // Attempt to delete the scheduled hook.
        $deleted = wp_clear_scheduled_hook( self::ACTION_NAME_SCHEDULE_REFRESH_SITE, array( $id ) );

        // Check if deletion was successful.
        if ( ! $deleted ) {
            return $this->return_api_response(
                \WP_Http::INTERNAL_SERVER_ERROR,
                'Failed to delete scheduled refresh.',
                array( 'id' => $id )
            );
        }

        // Successfully deleted.
        return $this->return_api_response(
            \WP_Http::ACCEPTED,
            'You\'ve successfully deleted a site refresh.',
            array(
                'id' => $id,
            )
        );
    }

    /**
     * Method for scheduling a site refresh.
     *
     * @param \WP_REST_Request $request The request object.
     *
     * @return \WP_REST_Response
     */
    public function schedule_refresh_site( \WP_REST_Request $request ): \WP_REST_Response {
        $scheduled_refresh = $request->get_param( 'schedule_refresh_timestamp' ) ?? null;

        // Validate timestamp is provided.
        if ( empty( $scheduled_refresh ) ) {
            return $this->return_api_response(
                \WP_Http::BAD_REQUEST,
                'Missing required parameter: schedule_refresh_timestamp',
                array()
            );
        }

        // Parse the timestamp.
        $scheduled_refresh_time = strtotime( $scheduled_refresh );

        // Validate timestamp is valid.
        if ( false === $scheduled_refresh_time ) {
            return $this->return_api_response(
                \WP_Http::BAD_REQUEST,
                'Invalid timestamp format.',
                array()
            );
        }

        // Validate timestamp is in the future.
        if ( $scheduled_refresh_time <= time() ) {
            return $this->return_api_response(
                \WP_Http::BAD_REQUEST,
                'Scheduled time must be in the future.',
                array()
            );
        }

        $uuid = wp_generate_uuid4();

        // Attempt to schedule the event.
        $scheduled = wp_schedule_single_event( $scheduled_refresh_time, self::ACTION_NAME_SCHEDULE_REFRESH_SITE, array( $uuid ) );

        // Check if scheduling was successful.
        if ( false === $scheduled ) {
            return $this->return_api_response(
                \WP_Http::INTERNAL_SERVER_ERROR,
                'Failed to schedule refresh.',
                array()
            );
        }

        return $this->return_api_response(
            \WP_Http::CREATED,
            'You\'ve successfully scheduled a site refresh.',
            array(
                'scheduled_refresh_time' => $scheduled_refresh_time,
                'id'                     => $uuid,
            )
        );
    }

    /**
     * Returns the cron status for this site.
     *
     * @return \WP_REST_Response
     */
    public function get_cron_status(): \WP_REST_Response {
        return $this->return_api_response(
            \WP_Http::OK,
            'Successfully retrieved cron status.',
            array(
                'last_cron_run' => self::get_last_cron_run(),
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

    /**
     * Method for getting the cron status endpoint.
     *
     * @return string The cron status endpoint.
     */
    public static function get_rest_endpoint_cron_status(): string {
        return self::get_formatted_rest_endpoint( self::ENDPOINT_PATH_CRON_STATUS, self::ENDPOINT_VERSION );
    }
}
