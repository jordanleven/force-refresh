<?php
/**
 * Our API handler interface.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api\Interfaces;

interface Api_Handler_Interface {

    /**
     * Method for
     *
     * @param string $route    The endpoint route.
     * @param int    $version  The endpoint version.
     *
     * @return string The formatted ReST endpoint.
     */
    public static function get_formatted_rest_endpoint( string $route, int $version ): string;
}
