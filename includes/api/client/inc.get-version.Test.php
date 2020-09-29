<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/inc.get-version.php';

class GetVersion extends TestCase {

    public function testGetVersion() {
        // Nonce doesn't exist
        $_REQUEST['nonce'] = null;
        $this->assertEquals( get_version(), '' );
    }
}
