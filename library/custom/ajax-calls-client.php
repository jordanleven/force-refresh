<?php

// The call used for users requesting the current site version from non-admins
add_action( 'wp_ajax_nopriv_force_refresh_get_version', __NAMESPACE__ . "\\ajax_request_get_version");

// The call used for users requesting the current site version from admins
add_action( 'wp_ajax_force_refresh_get_version', __NAMESPACE__ . "\\ajax_request_get_version");

/**
 * The function used by ajax requests to get the current site version.
 *
 * @return    void
 *
 * @version 1.0 Introducted in version 1.0
 */
function ajax_request_get_version(){
    // Get the data
    $data = $_REQUEST;
    // Declare our return
    $return_array = array();
    // Whether or not the call was successful
    $success      = true;
    // The HTTP status code
    $status_code  = 200;
    // The status text
    $status_text  = "The current site version has been successfully retrieved.";
    // Get the post ID
    $post_id      = isset( $_REQUEST['post_id'] ) ? $_REQUEST['post_id'] : null;
    // The return data
    $return_data  = array();
    // Get the current site version
    $current_site_version = get_option("force_refresh_current_site_version");
    // Get the current site version
    $current_page_version = get_post_meta( $post_id, 'force_refresh_current_page_version', true);
    // If no current site version exists, then the site version will default to version 0. This should be a string and not an integer
    if ( !$current_site_version ){
        $current_site_version = "0";
    }
    if ( !$current_page_version ){
        $current_page_version = "0";
    }
    $return_data['current_site_version'] = $current_site_version;
    $return_data['current_page_version'] = $current_page_version;
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

?>