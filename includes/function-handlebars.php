<?php
/**
 * Functions relating to our use of handlebars.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh;

use LightnCandy as ZordiusLightnCandy;

// The location of the handlebars directory relative to the plugin root.
define( 'FORCE_REFRESH_HANDLEBARS_DIRECTORY', '/dist/handlebars/' );

/**
 * Function used to add a handlebars template to the DOM (to be used by JavaScript).
 *
 * @param string $id  The ID used to identify the handlebars  template.
 * @param string $src The location of the handlebars template relative to the
 *                    predefined handlebars template directory.
 */
function add_handlebars( $id, $src ) {
    // Get the directory of the plugin.
    $directory = get_force_refresh_plugin_directory();
    // Get the location of the Handlebars template.
    $file_location = $directory . FORCE_REFRESH_HANDLEBARS_DIRECTORY . $src;
  if ( file_exists( $file_location ) ) {
      // phpcs:disable WordPress.WP.AlternativeFunctions
      // In the future, this method of loading handlebars templates will be deprecated as the
      // front-end moves towards Vue.
      $handlebar_contents = file_get_contents( $file_location );
      // phpcs:enable WordPress.WP.AlternativeFunctions
      echo '<script id="' . esc_html( $id ) . '" type="text/x-handlebars-template">';
      // phpcs:disable WordPress.Security.EscapeOutput
      // In the future, this method of loading handlebars templates will be deprecated as the
      // front-end moves towards Vue.
      echo $handlebar_contents;
      // phpcs:enable WordPress.Security.EscapeOutput
      echo '</script>';
  }
}

/**
 * Function to render handlebars in PHP. Users the Handlebars framework (via Composer).
 *
 * @param string  $template_name           The name of the template.
 * @param array   $replacements_array  The replacements.
 * @param boolean $return                 Whether to return the HTML or print it.
 *
 * @return string The HTML
 */
function render_handlebars(
  $template_name,
  $replacements_array = array(),
  $return = false
  ) {
    // Get the directory of the plugin.
    $directory = get_force_refresh_plugin_directory();
    // Add the template directory to the replacements.
    $replacements_array['template_directory_uri'] = get_template_directory_uri();
    $file_location                                = $directory
                                                    . FORCE_REFRESH_HANDLEBARS_DIRECTORY
                                                    . $template_name;
  if ( file_exists( $file_location ) ) {
      // Get the file contents.
      // phpcs:disable WordPress.WP.AlternativeFunctions
      // In the future, this method of loading handlebars templates will be deprecated as the
      // front-end moves towards Vue.
    $handlebar_contents = file_get_contents( $file_location );
      // phpcs:enable WordPress.WP.AlternativeFunctions
    $php = ZordiusLightnCandy\LightnCandy::compile(
        $handlebar_contents,
        array(
            'flags' => ZordiusLightnCandy\LightnCandy::FLAG_RENDER_DEBUG
              | ZordiusLightnCandy\LightnCandy::FLAG_HANDLEBARSJS,
        ),
    );
    // Get the render function.
    $renderer      = ZordiusLightnCandy\LightnCandy::prepare( $php );
    $rendered_html = $renderer( $replacements_array );
    // If return is true, then return the HTML.
    if ( $return ) {
      return $rendered_html;
    }
    // Otherwise, echo it.
    // phpcs:disable WordPress.Security.EscapeOutput
    // In the future, this method of loading handlebars templates will be deprecated as the
    // front-end moves towards Vue.
    echo $rendered_html;
    // phpcs:disable WordPress.Security.EscapeOutput
  }
}
