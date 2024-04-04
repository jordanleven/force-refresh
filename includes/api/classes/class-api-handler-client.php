<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler;

/**
 * Main class controller.
 */
class Api_Handler_Client extends Api_Handler {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/current-version';

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
                'callback'            => array( $this, 'get_version' ),
                'permission_callback' => '__return_true',
            ),
        );
    }

    /**
     * Method used by ajax requests to get the current site version.
     *
     * @param \WP_REST_Request $request The ReST Request object.
     *
     * @return void
     */
    public function get_version( \WP_REST_Request $request ): void {
        $post_id = $request->get_param( 'postId' ) ?? null;

        $response = array(
            'currentVersionSite' => $this->get_current_version_site(),
        );

        if ( $post_id ) {
            $response['currentVersionPage'] = $this->get_current_version_post( $post_id );
        }

        $this->return_api_response(
            200,
            'The current site version has been successfully retrieved.',
            $response,
        );
    }

    /**
     * Method to get the current version of the site.
     *
     * @return  string The version of the site
     */
    private function get_current_version_site(): string {
        $current_site_version = get_option( 'force_refresh_current_site_version' );
        return (bool) $current_site_version ? $current_site_version : '0';
    }

    /**
     * Method to get the current version for a specific post.
     *
     * @param int $post_id  The post ID to check.
     *
     * @return  string The version of the provided post
     */
    private static function get_current_version_post( int $post_id ): string {
        $current_page_version = get_post_meta(
            $post_id,
            'force_refresh_current_page_version',
            true
        );
        return (bool) $current_page_version ? $current_page_version : '0';
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
