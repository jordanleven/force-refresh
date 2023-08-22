<?php
/**
 * Our API handler interface for admin calls.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api\Interfaces;

interface Api_Handler_Admin_Interface {

    /**
     * Function for getting the endpoint for our endpoints.
     *
     * @return  string  The namespace
     */
    public static function get_rest_endpoint(): string;
}
