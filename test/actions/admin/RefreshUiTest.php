<?php
/**
 * Tests for inc-refresh-ui.php.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use PHPUnit\Framework\TestCase;

/**
 * Mock WordPress version for tests in this file.
 *
 * @var string
 */
$mock_wordpress_version = '6.9';

/**
 * Stub add_action during file load.
 *
 * @return void
 */
function add_action() {}

/**
 * Stub add_filter during file load.
 *
 * @return void
 */
function add_filter() {}

/**
 * Stub get_bloginfo for targeted tests.
 *
 * @param string $show Requested info key.
 * @return string
 */
function get_bloginfo( string $show = '' ): string {
    global $mock_wordpress_version;

    if ( 'version' === $show ) {
        return $mock_wordpress_version;
    }

    return '';
}

require_once __DIR__ . '/../../../includes/functions.php';
require_once __DIR__ . '/../../../includes/actions/admin/inc-refresh-ui.php';

/**
 * Tests for admin refresh UI helpers.
 */
final class RefreshUiTest extends TestCase {

    /**
     * The shared WordPress-version helper returns the current version string.
     */
    public function testGetWordPressVersionReturnsCurrentVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0.1';

        $this->assertSame( '7.0.1', get_wordpress_version() );
    }

    /**
     * Admin body class reflects the major WordPress version.
     */
    public function testAddsAdminBodyClassForMajorVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp7', $result );
    }

    /**
     * Release candidates use the major version number for the admin body class.
     */
    public function testAddsAdminBodyClassForReleaseCandidateUsingMajorVersion() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '7.0-RC2';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp7', $result );
    }

    /**
     * Admin body class reflects the correct major version for non-7 installs.
     */
    public function testAddsCorrectAdminBodyClassForOtherMajorVersions() {
        global $mock_wordpress_version;

        $mock_wordpress_version = '6.9';

        $result = add_force_refresh_admin_body_classes( 'wp-admin ' );

        $this->assertStringContainsString( 'force-refresh-wp6', $result );
    }
}
