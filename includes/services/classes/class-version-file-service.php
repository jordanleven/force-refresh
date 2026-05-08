<?php
/**
 * Our class responsible for reading and writing the static version file.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Services;

/**
 * Class for static version file I/O.
 */
class Version_File_Service {

    const FILE_NAME = 'version.json';
    const DIR_NAME  = 'force-refresh';

    /**
     * Read the current version data from disk.
     *
     * Returns an empty array when the file does not exist, so callers
     * never need to null-check the result.
     *
     * @return array The decoded version data, or [] when the file is absent.
     */
    public static function read(): array {
        $path = self::get_file_path();

        if ( ! file_exists( $path ) ) {
            return array();
        }

        return self::decode_file( $path );
    }

    /**
     * Write version data to disk, creating the directory if needed.
     *
     * Uses LOCK_EX to serialize concurrent writes.
     *
     * @param array $data The version data to persist.
     *
     * @return void
     */
    public static function write( array $data ): void {
        $dir = self::get_upload_dir();
        self::ensure_directory_exists( $dir );
        self::get_filesystem()->put_contents( self::get_file_path(), wp_json_encode( $data ), FS_CHMOD_FILE );
    }

    /**
     * Delete the version file from disk.
     *
     * Safe to call when the file does not exist — no error is raised.
     *
     * @return void
     */
    public static function delete(): void {
        $path = self::get_file_path();

        if ( ! file_exists( $path ) ) {
            return;
        }

        wp_delete_file( $path );
    }

    /**
     * Return the public URL clients use to fetch the version file.
     *
     * @return string The full public URL.
     */
    public static function get_public_url(): string {
        return wp_upload_dir()['baseurl'] . '/' . self::DIR_NAME . '/' . self::FILE_NAME;
    }

    /**
     * Return the absolute filesystem path to the version file.
     *
     * @return string The absolute path.
     */
    private static function get_file_path(): string {
        return self::get_upload_dir() . '/' . self::FILE_NAME;
    }

    /**
     * Return the absolute filesystem path to the plugin uploads directory.
     *
     * @return string The absolute path.
     */
    private static function get_upload_dir(): string {
        return wp_upload_dir()['basedir'] . '/' . self::DIR_NAME;
    }

    /**
     * Create the given directory if it does not already exist.
     *
     * @param string $path The directory path to create.
     *
     * @return void
     */
    private static function ensure_directory_exists( string $path ): void {
        if ( file_exists( $path ) ) {
            return;
        }

        wp_mkdir_p( $path );
    }

    /**
     * Read and JSON-decode a file at the given path.
     *
     * Returns an empty array when the file content is not valid JSON.
     *
     * @param string $path The absolute file path.
     *
     * @return array The decoded content, or [] on parse failure.
     */
    private static function decode_file( string $path ): array {
        $contents = self::get_filesystem()->get_contents( $path );
        $decoded  = json_decode( $contents, true );

        return is_array( $decoded ) ? $decoded : array();
    }

    /**
     * Return an initialized WP_Filesystem instance.
     *
     * @return \WP_Filesystem_Base
     */
    private static function get_filesystem(): \WP_Filesystem_Base {
        global $wp_filesystem;

        if ( empty( $wp_filesystem ) ) {
            require_once ABSPATH . '/wp-admin/includes/file.php';
            WP_Filesystem();
        }

        return $wp_filesystem;
    }
}
