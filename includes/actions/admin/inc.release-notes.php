<?php
/**
 * Our action that enqueues all required admin scripts.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php';
require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php';

/**
 * Function to get the contents of the plugin's README file.
 *
 * @return  mixed   String if file is located.
 */
function get_plugin_readme(): mixed {
    $readme_file_location = dirname( get_main_plugin_file() ) . '/README.txt';

    if ( ! file_exists( $readme_file_location ) ) {
        return null;
    }

    $filesystem = new \WP_Filesystem_Direct( true );
    return $filesystem->get_contents( $readme_file_location );
}

/**
 * Function to get the parsed array of release notes.
 *
 * @param string $readme The readme contents.
 *
 * @return array An array of release notes.
 */
function get_release_notes_from_plugin_readme( string $readme ): array {
    // Remove the "== Changelog ==" string and everything before.
    $release_notes                = preg_replace( "/(.|\n)* Changelog \=\=/", '', $readme );
    $release_notes_split          = explode( "\n", $release_notes );
    $release_notes_split_filtered = array_filter( $release_notes_split );

    return $release_notes_split_filtered;
}

/**
 * Function to modify the current version index and notes based on a specific release note.
 *
 * @param int    $current_version_i  The index of the current release version.
 * @param array  $notes_formatted        The key/value pairs of release notes.
 * @param string $note                   The note to parse.
 *
 * @return  void
 */
function assign_release_note_based_on_role( &$current_version_i, &$notes_formatted, $note ): void {
    switch ( true ) {
        // If the line is a version number.
        case preg_match( ' /= .* /', $note ):
            $version_number                     = str_replace( array( '=', ' ' ), '', $note );
            $notes_formatted[ $version_number ] = array(
                'date'  => null,
                'notes' => array(),
            );

            $current_version_i = $version_number;
            break;

        // If the line is a release note.
        case preg_match( '/^\* /', $note ):
            $release_note = str_replace( '*', '', $note );
            array_push(
                $notes_formatted[ $current_version_i ]['notes'],
                trim( $release_note ),
            );
            break;

        // Release dates.
        case preg_match( '/^\*/', $note ):
            $release_date_formatted = str_replace( array( '*', 'Released on ' ), '', $note );

            $notes_formatted[ $current_version_i ]['date'] = $release_date_formatted;
            break;
    }
}

/**
 * Function to get release notes as formatted JSON.
 *
 * @return  array  An array of release notes.
 */
function get_release_notes_json(): mixed {
    $readme_contents = get_plugin_readme();
    if ( ! $readme_contents ) {
        return null;
    }

    $release_notes = get_release_notes_from_plugin_readme( $readme_contents );

    $notes_formatted       = array();
    $current_version_index = null;

    foreach ( $release_notes as $k => $v ) {
        assign_release_note_based_on_role( $current_version_index, $notes_formatted, $v );
    }

    return $notes_formatted;
}

/**
 * Function to get the release notes.
 *
 * @return  array  Array of release notes.
 */
function get_release_notes(): mixed {
    return get_release_notes_json();
}
