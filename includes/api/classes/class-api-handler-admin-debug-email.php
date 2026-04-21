<?php
/**
 * API handler for sending a debug report email.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;

/**
 * Main class controller.
 */
class Api_Handler_Admin_Debug_Email extends Api_Handler_Admin implements Api_Handler_Admin_Interface {

    /**
     * The path for this endpoint.
     *
     * @var string
     */
    const ENDPOINT_PATH = '/debug-email';

    /**
     * The version for this endpoint.
     *
     * @var int
     */
    const ENDPOINT_VERSION = 1;

    /**
     * The recipient address for debug reports.
     *
     * @var string
     */
    const RECIPIENT_EMAIL = 'force-refresh@jordanleven.com';

    /**
     * Method for registering the endpoints for this class.
     *
     * @return void
     */
    public function register_routes(): void {
        self::register_rest_endpoint(
            self::ENDPOINT_PATH,
            self::ENDPOINT_VERSION,
            array(
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'send_debug_email' ),
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );
    }

    /**
     * Builds the debug payload from the current WordPress environment.
     *
     * @return array The debug payload.
     */
    private function get_debug_payload(): array {
        $plugin_data = get_plugin_data( \JordanLeven\Plugins\ForceRefresh\get_main_plugin_file() );

        return array(
            'siteUrl'            => get_bloginfo( 'url' ),
            'siteName'           => get_bloginfo( 'name' ),
            'wordPressVersion'   => get_bloginfo( 'version' ),
            'phpVersion'         => phpversion(),
            'forceRefreshVersion' => $plugin_data['Version'],
        );
    }

    /**
     * Formats the debug payload as a plain-text email body.
     *
     * @param array $payload The debug payload.
     *
     * @return string The formatted email body.
     */
    private function format_email_body( array $payload ): string {
        return implode(
            "\n",
            array(
                'A Force Refresh debug report was submitted.',
                '',
                sprintf( 'Site Name:              %s', $payload['siteName'] ),
                sprintf( 'Site URL:               %s', $payload['siteUrl'] ),
                sprintf( 'Force Refresh Version:  %s', $payload['forceRefreshVersion'] ),
                sprintf( 'WordPress Version:      %s', $payload['wordPressVersion'] ),
                sprintf( 'PHP Version:            %s', $payload['phpVersion'] ),
                '',
                sprintf( 'Submitted: %s', gmdate( 'Y-m-d H:i:s T' ) ),
            )
        );
    }

    /**
     * Handles the request to send a debug report email.
     *
     * @return \WP_REST_Response
     */
    public function send_debug_email(): \WP_REST_Response {
        $payload    = $this->get_debug_payload();
        $subject    = sprintf( '[Force Refresh] Debug Report — %s', $payload['siteName'] );
        $body       = $this->format_email_body( $payload );
        $mail_error = null;

        add_action(
            'wp_mail_failed',
            function ( \WP_Error $error ) use ( &$mail_error ) {
                $mail_error = $error->get_error_message();
            }
        );

        $sent = wp_mail( self::RECIPIENT_EMAIL, $subject, $body );

        if ( ! $sent ) {
            return $this->return_api_response(
                \WP_Http::INTERNAL_SERVER_ERROR,
                $mail_error ?? 'The debug report could not be sent. Please try again.'
            );
        }

        return $this->return_api_response(
            \WP_Http::OK,
            'Your debug report was sent successfully.'
        );
    }

    /**
     * Method for getting the endpoint for this service.
     *
     * @return string The service endpoint.
     */
    public static function get_rest_endpoint(): string {
        return self::get_formatted_rest_endpoint( self::ENDPOINT_PATH, self::ENDPOINT_VERSION );
    }
}
