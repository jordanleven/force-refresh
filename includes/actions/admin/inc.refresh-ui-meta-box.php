<?php
/**
 * Action responsible for adding the area to request a refresh of a specific page.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

define( 'HTML_ID_META_BOX', 'force-refresh-meta-box' );

/**
 * Main function to generate the admin HTML.
 *
 * @return  void
 */
function force_refresh_specific_page_refresh_html() {
    echo '<div id="' . esc_html( HTML_ID_META_BOX ) . '"></div>';
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
