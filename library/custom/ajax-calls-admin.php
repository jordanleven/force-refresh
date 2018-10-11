<?php

// The call used for admins requesting a site be refreshed
add_action( 'wp_ajax_force_refresh_update_site_version', function() {
    // Get the data
    $data         = $_REQUEST;
    // Declare our return
    $return_array = array();
    // Get the nonce
    $nonce        = $data['nonce'];
    // Whether or not the call was successful
    $success      = false;
    // The HTTP status code
    $status_code  = null;
    // The status text
    $status_text  = null;
    // The return data
    $return_data  = array();
    // Check the nonce
    if (wp_verify_nonce( $nonce, WP_FORCE_REFRESH_ACTION )){
        // If the user is authenticated, get the current site version by making a hash of the current date
        $time = current_time( 'timestamp' );
        // Create the site version
        $site_version_hash = wp_hash( $time );
        // Get the first eight characters (the chance of having a duplicate hash from the first 8 characters is low)
        $site_version = substr( $site_version_hash, 0, 8 );
        // Remove the old option
        delete_option( 'force_refresh_current_site_version' );
        // Add the new option
        add_option('force_refresh_current_site_version', $site_version, null, 'no' );
        // The call was successful
        $success = true;
        // Redeclare the status code as 200
        $status_code = 200;
        // Redeclare the status text
        $status_text = 'You\'ve successfully requested all browsers to refresh (version <code>'. $site_version .'</code>).';
        // Redeclare the status text
        $return_data['new_site_version'] = $site_version;
    }
    else {
        // Redeclare the status code as 401 (unauthorized)
        $status_code = 401;
        $status_text = 'There was an issue verifying your nonce ($nonce).';
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

// The call used for admins requesting a site be refreshed
add_action( 'wp_ajax_force_refresh_update_page_version', function(){
    // Get the data
    $data         = $_REQUEST;
    // Declare our return
    $return_array = array();
    // Get the nonce
    $nonce        = $data['nonce'];
    // Get the page id
    $page_id      = $data['page_id'];
    // Whether or not the call was successful
    $success      = false;
    // The HTTP status code
    $status_code  = null;
    // The status text
    $status_text  = null;
    // The return data
    $return_data = array();
    // Check the nonce
    if (wp_verify_nonce($nonce, WP_FORCE_REFRESH_ACTION)){
        // If the user is authenticated, get the current site version by making a hash of the current date
        $time = current_time('timestamp');
        // Get the hash
        $page_version_hash = wp_hash($time);
        // Get the first eight characters (the chance of having a duplicate hash from the first 8 characters is low)
        $page_version = substr($page_version_hash, 0, 8);
        // Remove the old
        delete_post_meta( $page_id, 'force_refresh_current_page_version' );
        // Add the new
        update_post_meta( $page_id, 'force_refresh_current_page_version', $page_version, null, 'no' );
        // The call was successful
        $success = true;
        // Redeclare the status code as 200
        $status_code = 200;
        // Redeclare the status text
        $status_text = 'You\'ve successfully requested all browsers to refresh this page (version <code>' . $page_version . '</code>).';
        // Redeclare the status text
        $return_data['new_page_version'] = $page_version;
    }
    else {
        // Redeclare the status code as 401 (unauthorized)
        $status_code = 401;
        $status_text = 'There was an issue verifying your nonce ($nonce).';
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



?>