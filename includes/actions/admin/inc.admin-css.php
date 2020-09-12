<?php
/**
 * Our action to enqueue our Admin CSS.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Hook used to enqueue CSS and JS.
 *
 * @return void
 */
add_action(
    'admin_head',
    function () {
        // Include the admin CSS.
        add_style( 'force-refresh-admin-css', '/dist/css/force-refresh-admin.css' );
    }
);
