<?php
/**
 * Our API calls responsible for handling requests from website visitors.
 *
 * @package ForceRefresh
 * @subpackage ApiCalls
 */

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
