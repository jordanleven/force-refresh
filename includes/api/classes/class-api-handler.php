<?php
/**
 * Our API handler used for smaller services.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Interface;

/**
 * Abstract class used for API handlers.
 */
abstract class Api_Handler implements Api_Handler_Interface {

    /**
     * The route namespace for our plugin.
     *
     * @var string
     */
    const NAMESPACE = 'force-refresh';

    /**
     * Method for getting the namespace for our API endpoints.
     *
     * @param int $version The endpoint version.
     *
     * @return string The namespace
     */
    private static function get_namespace_endpoint( int $version ): string {
        return sprintf( '%s/v%d', self::NAMESPACE, $version );
    }

    /**
     * Method for
     *
     * @param string $route    The endpoint route.
     * @param int    $version  The endpoint version.
     *
     * @return string The formatted ReST endpoint.
     */
    public static function get_formatted_rest_endpoint( string $route, int $version ): string {
        $current_blog_id = get_current_blog_id();
        $namespace       = self::get_namespace_endpoint( $version );
        return get_rest_url( $current_blog_id, $namespace . $route );
    }

    /**
     * Method for registering a ReST endpoint in WordPress.
     *
     * @param string  $route    The endpoint to register.
     * @param int     $version  The route version number.
     * @param array   $args     The arguments.
     * @param boolean $override True to override existing endpoints.
     *
     * @return void
     */
    public function register_rest_endpoint( string $route, int $version, $args = array(), $override = false ): void {
        $namespace = self::get_namespace_endpoint( $version );
        register_rest_route(
            $namespace,
            $route,
            $args,
            $override
        );
    }

    /**
     * Method to reply to the client with a response.
     *
     * @param   int    $status_code  The standardized HTTP status code.
     * @param   string $message      The plaintext message displayed to the user
     *                               that explains the status.
     * @param   array  $data         An array of data to sent as the response.
     *
     * @return  void
     */
    public function return_api_response( int $status_code, string $message, $data = array() ): void {
        status_header( $status_code );
        print wp_json_encode(
            array(
                'code'    => $status_code,
                'message' => $message,
                'data'    => $data,
            )
        );
    }
}
