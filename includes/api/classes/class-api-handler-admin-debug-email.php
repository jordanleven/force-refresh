<?php
/**
 * API handler for sending a debug report email.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Api;

use JordanLeven\Plugins\ForceRefresh\Api\Api_Handler_Admin;
use JordanLeven\Plugins\ForceRefresh\Api\Interfaces\Api_Handler_Admin_Interface;
use JordanLeven\Plugins\ForceRefresh\Services\Options_Storage_Service;
use JordanLeven\Plugins\ForceRefresh\Services\Versions_Storage_Service;

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
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_debug_data' ),
                'permission_callback' => array( $this, 'user_is_able_to_admin_force_refresh' ),
            ),
        );
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
     * Handles the request to return the debug payload.
     *
     * @return \WP_REST_Response
     */
    public function get_debug_data(): \WP_REST_Response {
        $current_user = wp_get_current_user();

        return $this->return_api_response(
            \WP_Http::OK,
            '',
            array(
                'rows'           => $this->get_debug_rows(),
                'submitterEmail' => ! empty( $current_user->user_email ) ? $current_user->user_email : null,
            )
        );
    }

    /**
     * Returns a standardized error response for support topic validation.
     *
     * @param int    $status_code The HTTP status code.
     * @param string $message_key The translation key for the error.
     *
     * @return \WP_REST_Response
     */
    private function return_support_topic_error_response( int $status_code, string $message_key ): \WP_REST_Response {
        return $this->return_api_response(
            $status_code,
            $message_key,
            array(
                'field' => 'supportTopicUrl',
            )
        );
    }

    /**
     * Builds the ordered list of rows for the debug preview UI.
     *
     * @return array Array of { key, value } objects.
     */
    private function get_debug_rows(): array {
        $payload = $this->get_debug_payload();

        return array(
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_NAME',
                'value' => $payload['siteName'],
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_URL',
                'value' => $payload['siteUrl'],
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_FR_VERSION',
                'value' => $payload['forceRefreshVersion'],
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_SITE_VERSION',
                'value' => $payload['siteVersion'],
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_REFRESH_INTERVAL',
                'value' => sprintf( '%ss', $payload['refreshInterval'] ),
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_WP_VERSION',
                'value' => $payload['wordPressVersion'],
            ),
            array(
                'key'   => 'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_LABEL_PHP_VERSION',
                'value' => $payload['phpVersion'],
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
            'siteUrl'             => get_bloginfo( 'url' ),
            'siteName'            => get_bloginfo( 'name' ),
            'wordPressVersion'    => get_bloginfo( 'version' ),
            'phpVersion'          => phpversion(),
            'forceRefreshVersion' => $plugin_data['Version'],
            'siteVersion'         => Versions_Storage_Service::get_site_version(),
            'refreshInterval'     => Options_Storage_Service::get_refresh_interval(),
        );
    }

    /**
     * Validates that the provided URL is a WordPress.org support topic URL.
     *
     * @param string $support_topic_url The user-provided support topic URL.
     *
     * @return bool Whether the URL shape is valid.
     */
    private function is_valid_support_topic_url( string $support_topic_url ): bool {
        $parsed_url = wp_parse_url( $support_topic_url );

        if ( empty( $parsed_url['host'] ) || 'wordpress.org' !== strtolower( $parsed_url['host'] ) ) {
            return false;
        }

        if ( empty( $parsed_url['scheme'] ) || ! in_array( strtolower( $parsed_url['scheme'] ), array( 'http', 'https' ), true ) ) {
            return false;
        }

        if ( empty( $parsed_url['path'] ) ) {
            return false;
        }

        return 1 === preg_match( '#^/support/topic/[^/]+/?$#', $parsed_url['path'] );
    }

    /**
     * Checks whether the supplied WordPress.org support topic is unresolved.
     *
     * @param string $support_topic_url The validated topic URL.
     *
     * @return true|\WP_REST_Response True when unresolved, or an error response.
     */
    private function validate_support_topic_is_unresolved( string $support_topic_url ) {
        $response = wp_remote_get(
            $support_topic_url,
            array(
                'redirection' => 3,
                'timeout'     => 10,
            )
        );

        if ( is_wp_error( $response ) ) {
            return $this->return_support_topic_error_response(
                \WP_Http::BAD_GATEWAY,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_UNAVAILABLE'
            );
        }

        $status_code = wp_remote_retrieve_response_code( $response );

        if ( \WP_Http::OK !== $status_code ) {
            return $this->return_support_topic_error_response(
                \WP_Http::BAD_REQUEST,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_NOT_FOUND'
            );
        }

        $response_body = wp_remote_retrieve_body( $response );
        $normalized    = strtolower( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $response_body ) ) );

        if ( false !== strpos( $normalized, 'status: not resolved' ) ) {
            return true;
        }

        if ( false !== strpos( $normalized, 'status: resolved' ) ) {
            return $this->return_support_topic_error_response(
                \WP_Http::CONFLICT,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_RESOLVED'
            );
        }

        return $this->return_support_topic_error_response(
            \WP_Http::BAD_GATEWAY,
            'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_UNCONFIRMED'
        );
    }

    /**
     * Formats the debug payload as a plain-text email body.
     *
     * @param array  $payload            The debug payload.
     * @param string $support_topic_url  The support topic URL provided by the user.
     *
     * @return string The formatted email body.
     */
    private function format_email_body( array $payload, string $support_topic_url ): string {
        return implode(
            "\n",
            array(
                'A Force Refresh debug report was submitted.',
                '',
                sprintf( 'Support Topic URL:      %s', $support_topic_url ),
                sprintf( 'Site Name:              %s', $payload['siteName'] ),
                sprintf( 'Site URL:               %s', $payload['siteUrl'] ),
                sprintf( 'Force Refresh Version:  %s', $payload['forceRefreshVersion'] ),
                sprintf( 'Current Site Version:   %s', $payload['siteVersion'] ),
                sprintf( 'Refresh Interval:       %ss', $payload['refreshInterval'] ),
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
     * @param \WP_REST_Request $request The WordPress REST request.
     *
     * @return \WP_REST_Response
     */
    public function send_debug_email( \WP_REST_Request $request ): \WP_REST_Response {
        $support_topic_url = esc_url_raw( trim( (string) $request->get_param( 'supportTopicUrl' ) ) );

        if ( empty( $support_topic_url ) ) {
            return $this->return_support_topic_error_response(
                \WP_Http::BAD_REQUEST,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_REQUIRED'
            );
        }

        if ( ! $this->is_valid_support_topic_url( $support_topic_url ) ) {
            return $this->return_support_topic_error_response(
                \WP_Http::BAD_REQUEST,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SUPPORT_URL_INVALID'
            );
        }

        $support_topic_validation = $this->validate_support_topic_is_unresolved( $support_topic_url );

        if ( true !== $support_topic_validation ) {
            return $support_topic_validation;
        }

        $payload    = $this->get_debug_payload();
        $subject    = sprintf( '[Force Refresh] Debug Report — %s', $payload['siteName'] );
        $body       = $this->format_email_body( $payload, $support_topic_url );
        $mail_error = null;

        add_action(
            'wp_mail_failed',
            function ( \WP_Error $error ) use ( &$mail_error ) {
                $mail_error = $error->get_error_message();
            }
        );

        $current_user = wp_get_current_user();
        $headers      = $current_user->user_email
            ? array( sprintf( 'Cc: %s', $current_user->user_email ) )
            : array();

        $sent = wp_mail( self::RECIPIENT_EMAIL, $subject, $body, $headers );

        if ( ! $sent ) {
            return $this->return_api_response(
                \WP_Http::INTERNAL_SERVER_ERROR,
                'ADMIN_TROUBLESHOOTING.DEBUG_MODAL_SEND_FAILED'
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
