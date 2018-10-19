<?php

namespace JordanLeven\Plugins\ForceRefresh;

/*
Plugin Name: Force Refresh
Plugin URI: 
Description: Force Refresh is a simple plugin that allows you to force a page refresh for users currently visiting your site.
Version: 2.1
Author: Jordan Leven
Author URI: https://github.com/jordanleven
Contributors: 
*/

// Define the name of the action for the refresh. This is used with the nonce to create a unique action
// when admins request a refresh.
define( 'WP_FORCE_REFRESH_ACTION', 'wp_force_refresh' );
// Define the name of the capability used to invoke a refresh. This is used for developers who want to fine-tune
// control of what types of users and roles can request a refresh.
define( 'WP_FORCE_REFRESH_CAPABILITY', 'invoke_force_refresh' );
// Define the ID for the Handlebars admin notice. This is used to add notifications to the admin screen when a user requests a refresh.
define( 'WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID', 'invoke_force_refresh' );
// Define the option for showing the Force Refresh button in the WordPress Admin Bar
define( 'WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR', 'force_refresh_show_in_wp_admin_bar' );
// Define the option for the refresh interval (how often the site should check for a new version)
define( 'WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS', 'force_refresh_refresh_interval' );
// Define the default refresh interval
define( 'WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT', 120 );
// All the post types to exclude force refreshing from
define( 'WP_FORCE_REFRESH_EXCLUDE_FROM_POST_TYPES', array( 'attachment' ) );

// Make sure we include the composer autoload file
require_once __DIR__ . "/library/vendor/autoload.php";

// Include the functions file
require_once __DIR__ . "/library/custom/functions.php";

/**
 * Function for getting the directory for this plugin
 *
 * @return string The full directory this plugin is located in (including the plugin directory)
 *
 * @version 2.0 Introducted in version 2.0
 */
function get_force_refresh_plugin_directory(){

    // Declare our plugin directory
    $plugin_directory = plugin_dir_path(__FILE__);

    return $plugin_directory;
}

/**
 * Function for getting the uri for this plugin
 *
 * @param  string $file The optional file path you want to append to the urldecode(str)
 * 
 * @return string The full url for the root of this plugin is located in (including the plugin directory)
 *
 * @version 2.0 Introducted in version 2.0
 */
function get_force_refresh_plugin_url($file = null){

    // Declare our plugin directory
    $plugin_url = plugins_url($file, __FILE__);

    return $plugin_url;
}

// Add the menu where we'll configure the settings
add_action( 'admin_menu', function(){

    add_submenu_page(
        'tools.php',
        'Force Refresh',
        'Force Refresh',
        WP_FORCE_REFRESH_CAPABILITY,
        'force_refresh',
        __NAMESPACE__ . '\\manage_force_refresh'
    );

});

// Add the action to add the Force Refresh capability to allow developers to customize which users and roles
// can init a Force Refresh
add_action("admin_init", function(){

  $role = get_role("administrator");

  $role->add_cap(WP_FORCE_REFRESH_CAPABILITY);

});

// Add the script for normal frontfacing pages (non-admin)
add_action("wp_enqueue_scripts", function(){

    // Include the normal JS
    add_script("force-refresh-js", "/library/dist/js/force-refresh.built.min.js", true);

    // Localize the admin ajax URL. This doesn't sound like the best idea but WP is into it (https://codex.wordpress.org/AJAX_in_Plugins)
    wp_localize_script(
        "force-refresh-js",
        "force_refresh_js_object",
        array(
            // Get the ajax URL
            'ajax_url'         => admin_url( 'admin-ajax.php' ),
            // Get the post ID
            'post_id'          => get_the_ID(),
            // Get the refresh interval
            'refresh_interval' => get_option( WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS, WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT )
        )
    );

    // Now that it's registered, enqueue the script
    wp_enqueue_script("force-refresh-js");

});

// Add meta boxes for specific pages that we want to refresh
add_action('add_meta_boxes',  function(){
    // All post types
    $all_post_types = get_post_types();
    // Loop through all the post types
    foreach ($all_post_types as $post_type => $post_key) {
        // Get the post type attributes
        $post_type_attributes = get_post_type_object( $post_type );
        // The post types public attribute
        $post_type_is_public = $post_type_attributes->public;
        // Only add the box if the post type is public and we're not excluding 
        // the post type
        if ( $post_type_is_public && !in_array($post_type, WP_FORCE_REFRESH_EXCLUDE_FROM_POST_TYPES )){
            // Add the box
            add_meta_box(
                'force_refresh_specific_page_refresh',
                'Force Refresh',
                __NAMESPACE__ . '\\force_refresh_specific_page_refresh_html',
                $post_type,
                'side'
            );  
        }
    }
});

?>