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
function get_plugin_readme() {
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
    $release_notes                = preg_replace( '/.* Changelog \=\=/s', '', $readme );
    $release_notes_split          = explode( "\n", $release_notes );
    $release_notes_split_filtered = array_filter( $release_notes_split );

    return $release_notes_split_filtered;
}

/**
 * Function to get the release note node.
 *
 * @param string $current_plugin_version The currently-loaded version of Force Refresh.
 * @param string $version_number The version number of this node.
 *
 * @return array The release note node.
 */
function get_release_note_node( string $current_plugin_version, string $version_number ): array {
    return array(
        'date'             => null,
        'isCurrentVersion' => $current_plugin_version === $version_number,
        'notes'            => array(),
    );
}

/**
 * Function to get the release note date from a note.
 *
 * @param string $note The note to parse.
 *
 * @return string The note release date.
 */
function get_release_note_date( string $note ): string {
    return str_replace( array( '_', '' ), '', $note );
}

/**
 * Function to get a release header node from a note.
 *
 * @param string $note The note.
 *
 * @return array The release note header node.
 */
function get_release_note_header_node( string $note ): array {
    $release_header = str_replace( array( '#', '*' ), '', $note );
    return array(
        'sectionHeader' => $release_header,
        'sectionNotes'  => array(),
    );
}

/**
 * Function to modify the current version index and notes based on a specific release note.
 *
 * @param string $current_plugin_version The currently-loaded version of Force Refresh.
 * @param int    $current_version_i      The index of the current release version.
 * @param array  $notes_formatted        The key/value pairs of release notes.
 * @param string $note                   The note to parse.
 *
 * @return  void
 */
function assign_release_note_based_on_role( string $current_plugin_version, &$current_version_i, &$notes_formatted, $note ): void {
    switch ( true ) {
        // If the line is a version number.
        case preg_match( '/#### [0-9].*/', $note ):
            $version_number                     = str_replace( array( '#', ' ' ), '', $note );
            $notes_formatted[ $version_number ] = get_release_note_node( $current_plugin_version, $version_number );

            $current_version_i = $version_number;
            break;

        // Release dates.
        case preg_match( '/^\_/', $note ):
            $notes_formatted[ $current_version_i ]['date'] = get_release_note_date( $note );
            break;

        // Release headers.
        case preg_match( '/^##### .*/', $note ):
            array_push(
                $notes_formatted[ $current_version_i ]['notes'],
                get_release_note_header_node( $note )
            );
            break;

        // If the line is a release note.
        default:
            $release_note         = str_replace( array( '#', '*' ), '', $note );
            $all_notes            = &$notes_formatted[ $current_version_i ]['notes'];
            $release_notes_length = count( $all_notes );

            array_push(
                $all_notes[ $release_notes_length - 1 ]['sectionNotes'],
                trim( $release_note ),
            );
            break;
    }
}

/**
 * Function to get release notes as formatted JSON.
 *
 * @param string $current_plugin_version The currently-loaded version of Force Refresh.
 *
 * @return  array  An array of release notes.
 */
function get_release_notes_json( string $current_plugin_version ) {
    $readme_contents = get_plugin_readme();
    if ( ! $readme_contents ) {
        return null;
    }

    $release_notes = get_release_notes_from_plugin_readme( $readme_contents );

    $notes_formatted       = array();
    $current_version_index = null;

    foreach ( $release_notes as $k => $v ) {
        assign_release_note_based_on_role( $current_plugin_version, $current_version_index, $notes_formatted, $v );
    }

    return $notes_formatted;
}

/**
 * Function to get the release notes.
 *
 * @param string $current_plugin_version The currently-loaded version of Force Refresh.
 *
 * @return array Array of release notes.
 */
function get_release_notes( string $current_plugin_version ) {
    return get_release_notes_json( $current_plugin_version );
}
