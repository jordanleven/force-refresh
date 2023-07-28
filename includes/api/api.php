<?php
/**
 * Our API calls responsible for handling requests from website visitors.
 *
 * @package ForceRefresh
 * @subpackage ApiCalls
 */

 /**
  * Custom intervals must be at least 30 seconds.
  */
 define( 'REFRESH_INTERVAL_CUSTOM_MINIMUM_IN_SECONDS', 30 );

 /**
  * Custom intervals must be, at max, four hours.
  */
 define( 'REFRESH_INTERVAL_CUSTOM_MAXIMUM_IN_SECONDS', 4 * 3600 );

/**
 * Function to reply to the client with a response.
 *
 * @param   int    $status_code  The standardized HTTP status code.
 * @param   string $message      The plaintext message displayed to the user
 *                               that explains the status.
 * @param   array  $data         An array of data to sent as the response.
 *
 * @return  void
 */
function return_api_response( int $status_code, string $message, $data = array() ) {
    status_header( $status_code );
    print wp_json_encode(
        array(
            'status_code' => $status_code,
            'status_text' => $message,
            'success'     => 200 === $status_code,
            'data'        => $data,
        )
    );
    wp_die();
}

// All ajax calls from admins.
require_once __DIR__ . '/admin/admin.php';
// All ajax calls from clients.
require_once __DIR__ . '/client/client.php';
