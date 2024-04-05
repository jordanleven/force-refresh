<?php
/**
 * Our API calls responsible for handling requests from admins requesting a refresh for the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

/**
 * Function for instantiating the client API
 * handler and registering endpoints.
 *
 * @return  void
 */
function register_admin_endpoints(): void {
    $controller = new Api_Handler_Admin_Refresh_Site();
    $controller->register_routes();

    $controller = new Api_Handler_Admin_Refresh_Page();
    $controller->register_routes();

    $controller = new Api_Handler_Admin_Options();
    $controller->register_routes();

    $controller = new Api_Handler_Admin_Debugging();
    $controller->register_routes();

    $controller = new Api_Handler_Client();
    $controller->register_routes();

    $controller = new Api_Handler_Admin_Schedule_Refresh_Site();
    $controller->register_routes();
}

add_action( 'rest_api_init', __NAMESPACE__ . '\\register_admin_endpoints' );
