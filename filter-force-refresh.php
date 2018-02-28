<?php

namespace JordanLeven\Plugins\ForceRefresh;

define("WP_FORCE_REFRESH_ACTION", "wp_force_refresh");

/*
Plugin Name: Force Refresh
Plugin URI: 
Description: Force Refresh is a simple plugin that allows you to force a page refresh for users currently visiting your site.
Version: 1.1.2
Author: Jordan Leven
Author URI: https://github.com/jordanleven
Contributors: 
*/

// Add the menu where we'll configure the settings
add_action( 'admin_menu', function(){

    add_submenu_page(
        'tools.php',
        'Force Refresh',
        'Force Refresh',
        'activate_plugins',
        'force_refresh',
        __NAMESPACE__ . '\\manage_force_refresh'
    );

});

/**
 * Add the script for normal frontfacing pages (non-admin)
 */
add_action("wp_enqueue_scripts", function(){

    // Include the normal JS
    add_script("force-refresh-js", "force-refresh.built.min.js", true);

    // Localize the admin ajax URL. This doesn't sound like the best idea but WP is into it (https://codex.wordpress.org/AJAX_in_Plugins)
    wp_localize_script(
        "force-refresh-js",
        "force_refresh_js_object",
        array(
            "ajax_url" => admin_url( 'admin-ajax.php' )
        )
    );

    // Now that it's registered, enqueue the script
    wp_enqueue_script("force-refresh-js");

});

/**
* The function used by ajax requests to get the current site version.
*
* @return    void
*/
function ajax_request_get_site_version(){

    // Get the data
    $data = $_REQUEST;

    // Declare our return
    $return_array = array();

    // Whether or not the call was successful
    $success = true;

    // The HTTP status code
    $status_code = 200;

    // The status text
    $status_text = "The current site version has been successfully retrieved.";

    // The return data
    $return_data = array();

    // Get the current site version
    $current_site_version = get_option("force_refresh_current_site_version");

    // If no current site version exists, then the site version will default to version 0. This should be a string and not an integer
    if (!$current_site_version){

        $current_site_version = "0";
    }

    $return_data['current_site_version'] = $current_site_version;

    // Set the HTTP code
    status_header($status_code);

    // Return the success
    $return_array['success']     = $success;
    
    // Return the status code
    $return_array['status_code'] = $status_code;
    
    // Return the status text
    $return_array['status_text'] = $status_text;
    
    // Return the return data
    $return_array['return_data'] = $return_data;

    print json_encode($return_array);

    wp_die(); 
}

/**
* The call used for users requesting the current site version from non-admins
*/
add_action( 'wp_ajax_nopriv_force_refresh_get_site_version', __NAMESPACE__ . "\\ajax_request_get_site_version");

/**
* The call used for users requesting the current site version from admins
*/
add_action( 'wp_ajax_force_refresh_get_site_version', __NAMESPACE__ . "\\ajax_request_get_site_version");

/**
* The call used for admins requesting a site be refreshed
*/
add_action( 'wp_ajax_force_refresh_update_site_version', function(){

    // Get the data
    $data = $_REQUEST;

    // Declare our return
    $return_array = array();

    // Get the nonce
    $nonce = $data['nonce'];

    // Whether or not the call was successful
    $success = false;

    // The HTTP status code
    $status_code = null;

    // The status text
    $status_text = null;

    // The return data
    $return_data = array();

    // Check the nonce
    if (wp_verify_nonce($nonce, WP_FORCE_REFRESH_ACTION)){

        // If the user is authenticated, get the current site version by making a hash of the current date
        $time = current_time("timestamp");

        $site_version_hash = wp_hash($time);

        // Get the first eight characters (the chance of having a duplicate hash from the first 8 characters is low)
        $site_version = substr($site_version_hash, 0, 8);

        delete_option("force_refresh_current_site_version");

        add_option("force_refresh_current_site_version", $site_version, null, "no" );

        // The call was successful
        $success = true;

        // Redeclare the status code as 200
        $status_code = 200;

        // Redeclare the status text
        $status_text = "You've successfully requested all browsers to refresh (version <code>$site_version</code>).";

        // Redeclare the status text
        $return_data['new_site_version'] = $site_version;


    }

    else {

        // Redeclare the status code as 401 (unauthorized)
        $status_code = 401;

        $status_text = "There was an issue verifying your nonce ($nonce).";

    }

    // Set the HTTP code
    status_header($status_code);

    // Return the success
    $return_array['success']     = $success;
    
    // Return the status code
    $return_array['status_code'] = $status_code;
    
    // Return the status text
    $return_array['status_text'] = $status_text;
    
    // Return the return data
    $return_array['return_data'] = $return_data;

    print json_encode($return_array);

    wp_die(); 
});

/** 
* Main function to manage settings for Force Refresh.
*
* @return    void    
*/
function manage_force_refresh(){

    // Include the admin CSS
    add_style("force-refresh-admin-css", "force-refresh-admin.built.min.css");

    // Include the admin JS
    add_script("force-refresh-admin-js", "force-refresh-admin.built.min.js", true);

    // Create the data we're going to localize to the script
    $localized_data = array();

    // Add the API URL for the script
    $localized_data['api_url'] = get_stylesheet_directory_uri();

    // Add the API URL for the script
    $localized_data['site_id'] = get_current_blog_id();

    // Create a nonce for the user
    $localized_data['nonce'] = wp_create_nonce(WP_FORCE_REFRESH_ACTION);

    // Localize the data
    wp_localize_script(
        "force-refresh-admin-js",
        "force_refresh_local_js",
        $localized_data
    );

    // Now that it's registered, enqueue the script
    wp_enqueue_script("force-refresh-admin-js");

    ?>

    <div class="wrap">

        <h2>Site Refresh</h2>

        <div id="alert-container">

        </div>

        <div style="text-align: left">

            <div class="site-refresh-inner" style="font-size:16px;">

                <p><span class="dashicons dashicons-update logo"></span></p>

                <p>Here, you can force all user to manually reload the site "<?php echo get_bloginfo();?>".</p>

                <form id="force-refresh-admin" action="#" method="POST" > 

                    <button type="submit" class="button button-primary">Refresh site</button>

                </form>
            </div>
        </div>

    </div>
    <?php
}

/**
* Function for enqueueing styles for this plugin.
*
* @param     string    $handle    The stylesheet handle
* @param     string    $path      The path to the stylesheet (relative to the CSS dist directory)
*
* @return    void               
*/
function add_style($handle, $path){

    // Get the file path
    $file_path = plugin_dir_path(__FILE__) . "library/dist/css/$path";

    // If the file doesn't exist, throw an error
    if (!file_exists($file_path)){

        echo "<div class=\"notice notice-error\">";
        echo "<p>$path is missing.</p>";
        echo "</div>";

    }
    // Otherwise, work normally
    else {

        // Get the file version
        $file_version = filemtime($file_path);

        // Enqueue the style
        wp_enqueue_style("force-refresh-admin", plugins_url("/library/dist/css/$path", __FILE__), array(), $file_version);

    }

}

/**
* Function for adding scripts for this plugin.
*
* @param     string     $handle      The script handle
* @param     string     $path        The path to the script (relative to the JS dist directory)
* @param     boolean    $register    Whether we should simply register the script instead of enqueing it
*
* @return    void               
*/
function add_script($handle, $path, $register = false){

    // Get the file path
    $file_path = plugin_dir_path(__FILE__) . "library/dist/js/$path";

    // If the file doesn't exist, throw an error
    if (!file_exists($file_path)){

        echo "<div class=\"notice notice-error\">";
        echo "<p>$path is missing.</p>";
        echo "</div>";

    }
    // Otherwise, work normally
    else {

        // Get the file version
        $file_version = filemtime($file_path);

        // If we want to only register the script
        if ($register){

            wp_register_script($handle, plugins_url("/library/dist/js/$path", __FILE__), array("jquery"), $file_version);

        }

        // Otherwise, we want to enqueue the script
        else {

            // Enqueue the style
            wp_enqueue_script($handle, plugins_url("/library/dist/js/$path", __FILE__), array("jquery"), $file_version);

        }

    }

}

?>