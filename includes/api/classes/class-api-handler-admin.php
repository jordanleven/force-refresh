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
abstract class Api_Handler_Admin extends Api_Handler {

    /**
     * Method for checking if a user can make changes to Force Refresh.
     *
     * @return  bool    True if use can modify Force Refresh settings.
     */
    public function user_is_able_to_admin_force_refresh(): bool {
        return current_user_can( WP_FORCE_REFRESH_CAPABILITY );
    }
}
