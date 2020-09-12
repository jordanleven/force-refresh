<?php
/**
 * Action responsible for registering the capability to request refreshes to administrators
 * of the site.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

// Add the action to add the Force Refresh capability to allow developers to customize which users
// and roles can init a Force Refresh.
add_action(
    'admin_init',
    function() {
        $role = get_role( 'administrator' );
        $role->add_cap( WP_FORCE_REFRESH_CAPABILITY );
    }
);
