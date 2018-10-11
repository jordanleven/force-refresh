<?php

namespace JordanLeven\Plugins\ForceRefresh;

// Include the handlebars function
require_once __DIR__ . "/function-handlebars.php";

// All ajax calls from browsers
require_once __DIR__ . "/ajax-calls-client.php";

// All ajax calls from admins
require_once __DIR__ . "/ajax-calls-admin.php";

function force_refresh_specific_page_refresh_html(){
    // Since a Force Refresh can take place from any page, we also need to add the Handlebars template for a notice
    add_handlebars( WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID, 'force-refresh-main-admin-notice.handlebars' );
    // Get the current screen
    $current_screen = get_current_screen();
    // Get the current post type
    $current_post_type = $current_screen->post_type;
    // Include the admin JS
    add_script( 'force-refresh-meta-box-admin-js', '/library/dist/js/force-refresh-meta-box-admin.built.min.js', true );
    // Create the data we're going to localize to the script
    $localized_data            = array();
    // Add the API URL for the script
    $localized_data['api_url'] = get_stylesheet_directory_uri();
    // Add the API URL for the script
    $localized_data['site_id'] = get_current_blog_id();
    // Create a nonce for the user
    $localized_data['nonce']   = wp_create_nonce(WP_FORCE_REFRESH_ACTION);
    // Create a nonce for the user
    $localized_data['post_id'] = get_the_ID();
    // Add the ID of the handlebars notice
    $localized_data['handlebars_admin_notice_template_id'] = WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID;
    // Add the refresh interval
    $localized_data['refresh_interval'] = get_option(WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS, WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT);
    // Localize the data
    wp_localize_script(
        "force-refresh-meta-box-admin-js",
        "force_refresh_local_js",
        $localized_data
    );
    // Now that it's registered, enqueue the script
    wp_enqueue_script("force-refresh-meta-box-admin-js");
    // Create all of the replacements
    $handlebars_replacements = array(
        'post_type' => $current_post_type,
        'post_name' => get_the_title(),
    );
    render_handlebars(
        "force-refresh-meta-box-side-admin.handlebars", 
        $handlebars_replacements
    );
}

/**
 * Hook used to enqueue CSS and JS, as well as add the optional Force Refresh button to the WordPress Admin Bar.
 */
add_action('admin_head', function(){
    // Get this option from the database. Default value is null/false
    $show_force_refresh_in_wp_admin_bar = get_option(WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR) === 'true';
    // If the option to show Force Refresh in the admin bar is enabled, then we need to show the item in the WordPress Admin Bar
    if ( $show_force_refresh_in_wp_admin_bar ){
        // Show the Force Refresh option in the WordPress Admin Bar
        add_action( 'wp_before_admin_bar_render', __NAMESPACE__ . '\\show_force_refresh_in_wp_admin_bar', 999 );
    }
    // Since a Force Refresh can take place from any page, we also need to add the Handlebars template for a notice
    add_handlebars( WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID, 'force-refresh-main-admin-notice.handlebars' );
    // Include Font Awesome
    add_style("force-refresh-meta-box-admin-css", "/node_modules/font-awesome/css/font-awesome.min.css");
    // Include the admin CSS
    add_style("force-refresh-admin-css", "/library/dist/css/force-refresh-admin.built.min.css");
    // Add the Force Refresh script
    add_force_refresh_script();

});

/**
 * Hook used to save admin actions for Force Refresh.
 */
add_action('admin_init', function(){
    // If we are saving data from the Force Refresh options
    if (isset($_POST['force-refresh-admin-options-save']) && $_POST['force-refresh-admin-options-save'] == true){
        // Get updated options for viewing the refresh button in the WP Admin bar
        $show_in_admin_bar = isset($_POST['show-in-wp-admin-bar']) ? $_POST['show-in-wp-admin-bar'] : false;
        // Update the show in Admin Bar option
        update_option(WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR, $show_in_admin_bar);
        // Get updated options for the refresh interval
        $refresh_interval = isset($_POST['refresh-interval']) ? $_POST['refresh-interval'] : null;
        // If the new refresh interval option came through all right
        if ($refresh_interval){
            // Update the refresh interval
            update_option(WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS, $refresh_interval);
        }
    }
});

/**
 * Function to show the Force Refresh option in the WP Admin bar.
 *
 * @return void 
 *
 * @version 1.0 Added in version 2.0
 */
function show_force_refresh_in_wp_admin_bar(){
    // Globalize the WP Admin Bar object
    global $wp_admin_bar;
    // Add the item to show up in the WP Admin Bar
    $args = array(
        'id'     => 'force-refresh',
        'title'  => "<i class=\"fa fa-refresh\" aria-hidden=\"true\"></i> <span>Force Refresh Site</span>",
        'href'   => null,
    );
    // Add the menu
    $wp_admin_bar->add_menu( $args );
}

/** 
 * Main function to manage settings for Force Refresh.
 *
 * @return    void  
 *
 * @version 1.0 Introducted in version 1.0
 */
function manage_force_refresh(){
    // See what the existing settings are for showing Force Refresh in the WordPress Admin bar
    $preset_option_show_force_refresh_in_wp_admin_bar = get_option(WP_FORCE_REFRESH_OPTION_SHOW_IN_WP_ADMIN_BAR, false);
    // See what the existing settings are for the refresh interval
    $preset_option_refresh_interval = get_option(WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS, WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT);
    // Add the script
    add_force_refresh_script();
    // Render the HTML
    render_handlebars("force-refresh-main-admin.handlebars", 
        array(
            "site_name" => get_bloginfo(),
            "options" => array(
                // For the Show Force Refresh in Admin Menu option
                "preset_value_force_refresh_in_admin_bar_show" => $preset_option_show_force_refresh_in_wp_admin_bar === 'true' ? "selected" : null,
                "preset_value_force_refresh_in_admin_bar_hide" => $preset_option_show_force_refresh_in_wp_admin_bar === 'false' ? "selected" : null,

                // For the refresh interval option
                "preset_value_force_refresh_refresh_interval_30"  => $preset_option_refresh_interval === '30' ? "selected" : null,
                "preset_value_force_refresh_refresh_interval_60"  => $preset_option_refresh_interval === '60' ? "selected" : null,
                "preset_value_force_refresh_refresh_interval_90"  => $preset_option_refresh_interval === '90' ? "selected" : null,
                "preset_value_force_refresh_refresh_interval_120" => $preset_option_refresh_interval === '120' ? "selected" : null
            )
        )
    );
}

/**
 * Function to add the Force Refresh script, which contains the nonce required to initiate the call.
 *
 * @version 1.0 Introducted in version 2.0
 */
function add_force_refresh_script(){

    // Include the admin JS
    add_script("force-refresh-main-admin-js", "/library/dist/js/force-refresh-main-admin.built.min.js", true);

    // Create the data we're going to localize to the script
    $localized_data = array();

    // Add the API URL for the script
    $localized_data['api_url'] = get_stylesheet_directory_uri();
    
    // Add the API URL for the script
    $localized_data['site_id'] = get_current_blog_id();
    
    // Create a nonce for the user
    $localized_data['nonce']   = wp_create_nonce(WP_FORCE_REFRESH_ACTION);

    // Add the ID of the handlebars notice
    $localized_data['handlebars_admin_notice_template_id'] = WP_FORCE_REFRESH_HANDLEBARS_ADMIN_NOTICE_TEMPLATE_ID;

    // Add the refresh interval
    $localized_data['refresh_interval'] = get_option(WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS, WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT);

    // Localize the data
    wp_localize_script(
        "force-refresh-main-admin-js",
        "force_refresh_local_js",
        $localized_data
    );

    // Now that it's registered, enqueue the script
    wp_enqueue_script("force-refresh-main-admin-js");

}

/**
 * Function for enqueueing styles for this plugin.
 *
 * @param     string    $handle    The stylesheet handle
 * @param     string    $path      The path to the stylesheet (relative to the CSS dist directory)
 *
 * @return    void  
 *
 * @version 1.0 Introducted in version 1.0
 */
function add_style($handle, $path){

    // Get the file path
    $file_path = get_force_refresh_plugin_directory() . $path;

    // If the file doesn't exist, throw an error
    if (!file_exists($file_path)){

        echo "<div class=\"notice notice-error\">";
        echo "<p>$path is missing.</p>";
        echo "</div>";

        // Log error to server
        error_log("$path is missing.");
    }

    // Otherwise, work normally
    else {

        // Get the file version
        $file_version = filemtime($file_path);

        // Enqueue the style
        wp_enqueue_style($handle, get_force_refresh_plugin_url($path), array(), $file_version);
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
 *
 * @version 1.0 Introducted in version 1.0
 */
function add_script($handle, $path, $register = false){

    // Get the file path
    $file_path = get_force_refresh_plugin_directory() . $path;

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

            wp_register_script($handle, get_force_refresh_plugin_url($path), array("jquery", "jquery-ui-core"), $file_version);

        }

        // Otherwise, we want to enqueue the script
        else {

            // Enqueue the style
            wp_enqueue_script($handle, get_force_refresh_plugin_url($path), array("jquery", "jquery-ui-core"), $file_version);
        }
    }
}

?>