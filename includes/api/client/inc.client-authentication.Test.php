<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/inc.client-authentication.php';

// Our mock action
const WP_ACTION_GET_VERSION = 'mock-action-get-version';

// Our value for the verify nonce
$GLOBALS['$nonce_verified'] = false;

/**
 * Mock function for WP verify nonce function
 */
function wp_verify_nonce() {
    return $GLOBALS['$nonce_verified'];
}

/**
 * Mock function for sanitize_text_field
 */
function sanitize_text_field( $text ): string {
    return $text;
}

/**
 * Mock function for wp_unslash
 */
function wp_unslash( $text ): string {
    return $text;
}

class ClientAuthentication extends TestCase {

    public function testReturnsFalseWhenNonceIsMissing() {
        // Nonce doesn't exist
        $_REQUEST['nonce'] = null;
        $this->assertEquals( is_client_nonce_valid(), false );
    }

    public function testReturnsFalseWhenNonceIsInvalid() {
        // Nonce doesn't exist
        $_REQUEST['nonce']          = 'invalid-nonce';
        $GLOBALS['$nonce_verified'] = false;
        $this->assertEquals( is_client_nonce_valid(), false );
    }

    public function testReturnsTrueWhenNonceIsValid() {
        // Nonce doesn't exist
        $_REQUEST['nonce']          = 'valid-nonce';
        $GLOBALS['$nonce_verified'] = 1;
        $this->assertEquals( is_client_nonce_valid(), true );
    }
}
