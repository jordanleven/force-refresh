<?php
/**
 * Action responsible for adding the area to request a refresh of a specific page.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

/**
 * Main function to generate the admin HTML.
 *
 * @return  void
 */
function force_refresh_specific_page_refresh_html() {
    define( 'HTML_CLASS_META_BOX', 'force-refresh-meta-box' );
    define( 'FILE_NAME_META_BOX_ADMIN', 'force-refresh-meta-box-admin-js' );
    // Include the admin JS.
    add_script( FILE_NAME_META_BOX_ADMIN, '/dist/js/force-refresh-meta-box-admin.js', true );
    // Get the current screen.
    $current_screen = get_current_screen();
    // Create the data we're going to localize to the script.
    $localized_data = array(
        // Wrap in inner array to preserve primitive types.
        'localData' => array(
            // Add the API URL for the script.
            'apiUrl'          => get_stylesheet_directory_uri(),
            // Add the API URL for the script.
            'siteId'          => get_current_blog_id(),
            // Create a nonce for the user.
            'nonce'           => wp_create_nonce( WP_FORCE_REFRESH_ACTION ),
            // Create a nonce for the user.
            'postId'          => get_the_ID(),
            'postType'        => $current_screen->post_type,
            'postName'        => get_the_title(),
            'targetClass'     => HTML_CLASS_META_BOX,
            // Add the refresh interval.
            'refreshInterval' => get_option(
                WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS,
                WP_FORCE_REFRESH_OPTION_REFRESH_INTERVAL_IN_SECONDS_DEFAULT
            ),
        ),
    );
    // Localize the data.
    wp_localize_script( FILE_NAME_META_BOX_ADMIN, 'forceRefreshLocalJs', $localized_data );
    // Now that it's registered, enqueue the script.
    wp_enqueue_script( FILE_NAME_META_BOX_ADMIN );
    echo '<div class="' . esc_html( HTML_CLASS_META_BOX ) . '"></div>';
}

// Add meta boxes for specific pages that we want to refresh.
add_action(
    'add_meta_boxes',
    function() {
        // All post types.
        $all_post_types = get_post_types();
        // Loop through all the post types.
        foreach ( $all_post_types as $post_type => $post_key ) {
            // Get the post type attributes.
            $post_type_attributes = get_post_type_object( $post_type );
            // The post types public attribute.
            $post_type_is_public = $post_type_attributes->public;
            // Only add the box if the post type is public and we're not excluding
            // the post type.
            if ( $post_type_is_public
                && ! in_array( $post_type, WP_FORCE_REFRESH_EXCLUDE_FROM_POST_TYPES, true )
            ) {
                // Add the box.
                add_meta_box(
                    'force_refresh_specific_page_refresh',
                    'Force Refresh',
                    __NAMESPACE__ . '\\force_refresh_specific_page_refresh_html',
                    $post_type,
                    'side'
                );
            }
        }
    }
);
