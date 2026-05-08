<?php
/**
 * Tests for Version_File_Service.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

use JordanLeven\Plugins\ForceRefresh\Mocks;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/class-mocked-service-test-case.php';
require_once __DIR__ . '/../../../includes/services/classes/class-version-file-service.php';

/**
 * Test for Version_File_Service.
 */
final class VersionFileServiceTest extends Mocked_Service_Test_Case {

    /**
     * Absolute path to the temporary uploads directory used across all tests.
     *
     * @var string
     */
    private static string $temp_dir;

    /**
     * Mock for `wp_upload_dir`.
     *
     * @var Mocks\Mock_Wp_Upload_Dir
     */
    private static $mock_wp_upload_dir;

    /**
     * Mock for `wp_mkdir_p`.
     *
     * @var Mocks\Mock_Wp_Mkdir_P
     */
    private static $mock_wp_mkdir_p;

    /**
     * Mock for `wp_json_encode`.
     *
     * @var Mocks\Mock_Wp_Json_Encode
     */
    private static $mock_wp_json_encode;

    /**
     * Set up shared mocks and a temp uploads directory for the test class.
     *
     * @return void
     */
    public static function setUpBeforeClass(): void {
        self::$temp_dir = sys_get_temp_dir() . '/force-refresh-test-' . uniqid();
        mkdir( self::$temp_dir, 0755, true );

        self::$mock_wp_upload_dir = new Mocks\Mock_Wp_Upload_Dir( __NAMESPACE__ );
        self::$mock_wp_mkdir_p    = new Mocks\Mock_Wp_Mkdir_P( __NAMESPACE__ );
        self::$mock_wp_json_encode = new Mocks\Mock_Wp_Json_Encode( __NAMESPACE__ );

        self::$mock_wp_upload_dir->set_return_value(
            array(
                'basedir' => self::$temp_dir,
                'baseurl' => 'http://example.com/wp-content/uploads',
            )
        );
    }

    /**
     * Remove the version file and its directory before each test so every
     * test starts from a clean slate.
     *
     * @return void
     */
    public function setUp(): void {
        $file = self::get_expected_file_path();
        $dir  = self::get_expected_dir_path();

        if ( file_exists( $file ) ) {
            unlink( $file );
        }

        if ( is_dir( $dir ) ) {
            rmdir( $dir );
        }
    }

    /**
     * Disable all mocks and remove the temp directory after the test class.
     *
     * @return void
     */
    public static function tearDownAfterClass(): void {
        self::disable_mocks(
            array(
                self::$mock_wp_upload_dir,
                self::$mock_wp_mkdir_p,
                self::$mock_wp_json_encode,
            )
        );

        self::remove_directory( self::$temp_dir );
    }

    // -------------------------------------------------------------------------
    // read()
    // -------------------------------------------------------------------------

    /**
     * Returns an empty array when the version file does not exist.
     */
    public function testReadReturnsEmptyArrayWhenFileDoesNotExist(): void {
        $result = Version_File_Service::read();

        $this->assertSame( array(), $result );
    }

    /**
     * Returns the decoded JSON content when the file exists.
     */
    public function testReadReturnsDecodedContentWhenFileExists(): void {
        $data = array( 'site' => 'abc12345', 'pages' => array( '42' => 'xyz78901' ) );
        $this->write_file_directly( $data );

        $result = Version_File_Service::read();

        $this->assertSame( $data, $result );
    }

    /**
     * Returns an empty array when the file exists but contains invalid JSON.
     */
    public function testReadReturnsEmptyArrayWhenFileContainsInvalidJson(): void {
        mkdir( self::get_expected_dir_path(), 0755, true );
        file_put_contents( self::get_expected_file_path(), 'not-valid-json' );

        $result = Version_File_Service::read();

        $this->assertSame( array(), $result );
    }

    // -------------------------------------------------------------------------
    // write()
    // -------------------------------------------------------------------------

    /**
     * Creates the uploads directory when it does not exist before writing.
     */
    public function testWriteCreatesDirectoryWhenAbsent(): void {
        $this->assertDirectoryDoesNotExist( self::get_expected_dir_path() );

        Version_File_Service::write( array( 'site' => 'abc12345' ) );

        $this->assertDirectoryExists( self::get_expected_dir_path() );
    }

    /**
     * Persists the correct JSON content to disk.
     */
    public function testWritePersistsCorrectContent(): void {
        $data = array( 'site' => 'abc12345', 'pages' => array() );

        Version_File_Service::write( $data );

        $written = json_decode( file_get_contents( self::get_expected_file_path() ), true );
        $this->assertSame( $data, $written );
    }

    /**
     * Does not fail when the directory already exists.
     */
    public function testWriteSucceedsWhenDirectoryAlreadyExists(): void {
        mkdir( self::get_expected_dir_path(), 0755, true );

        Version_File_Service::write( array( 'site' => 'abc12345' ) );

        $this->assertFileExists( self::get_expected_file_path() );
    }

    // -------------------------------------------------------------------------
    // delete()
    // -------------------------------------------------------------------------

    /**
     * Removes the version file from disk.
     */
    public function testDeleteRemovesFile(): void {
        $this->write_file_directly( array( 'site' => 'abc12345' ) );
        $this->assertFileExists( self::get_expected_file_path() );

        Version_File_Service::delete();

        $this->assertFileDoesNotExist( self::get_expected_file_path() );
    }

    /**
     * Does not raise an error when the file does not exist.
     */
    public function testDeleteIsSafeWhenFileDoesNotExist(): void {
        $this->assertFileDoesNotExist( self::get_expected_file_path() );

        // Should not throw.
        Version_File_Service::delete();

        $this->assertFileDoesNotExist( self::get_expected_file_path() );
    }

    // -------------------------------------------------------------------------
    // get_public_url()
    // -------------------------------------------------------------------------

    /**
     * Returns the correctly formed public URL for the version file.
     */
    public function testGetPublicUrlReturnsCorrectUrl(): void {
        $expected = 'http://example.com/wp-content/uploads/force-refresh/version.json';

        $this->assertSame( $expected, Version_File_Service::get_public_url() );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Return the expected absolute path for the version directory.
     *
     * @return string
     */
    private static function get_expected_dir_path(): string {
        return self::$temp_dir . '/force-refresh';
    }

    /**
     * Return the expected absolute path for the version file.
     *
     * @return string
     */
    private static function get_expected_file_path(): string {
        return self::get_expected_dir_path() . '/version.json';
    }

    /**
     * Write data directly to the version file, bypassing the service, so
     * individual tests can start with a known file state.
     *
     * @param array $data The data to write.
     *
     * @return void
     */
    private function write_file_directly( array $data ): void {
        $dir = self::get_expected_dir_path();

        if ( ! is_dir( $dir ) ) {
            mkdir( $dir, 0755, true );
        }

        file_put_contents( self::get_expected_file_path(), json_encode( $data ) );
    }

    /**
     * Recursively remove a directory and all its contents.
     *
     * @param string $path The directory to remove.
     *
     * @return void
     */
    private static function remove_directory( string $path ): void {
        if ( ! is_dir( $path ) ) {
            return;
        }

        $entries = array_diff( scandir( $path ), array( '.', '..' ) );

        foreach ( $entries as $entry ) {
            $full_path = $path . '/' . $entry;
            is_dir( $full_path ) ? self::remove_directory( $full_path ) : unlink( $full_path );
        }

        rmdir( $path );
    }
}
