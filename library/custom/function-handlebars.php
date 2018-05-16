<?php

namespace JordanLeven\Plugins\ForceRefresh;

use LightnCandy as ZordiusLightnCandy;

// The location of the handlebars directory relative to the plugin root
define("FORCE_REFRESH_HANDLEBARS_DIRECTORY", "library/dist/handlebars/");

/**
 * Function used to add a handlebars template to the DOM (to be used by JavaScript).
 *
 * @param    string     $id                The ID used to identify the handlebars  template
 * @param    string     $src               The location of the handlebars template relative to the predefined handlebars template directory
 */
function add_handlebars($id, $src){

    // If we're adding handlebars, then we need to make sure we are also including the handlebars framework
    add_script("force-refresh-handlebars", "/node_modules/handlebars/dist/handlebars.min.js");

    // Get the directory of the plugin
    $directory = get_force_refresh_plugin_directory();

    // Get the location of the Handlebars template
    $file_location = $directory . FORCE_REFRESH_HANDLEBARS_DIRECTORY . $src;

    if (file_exists($file_location)){

        $handlebar_contents = file_get_contents($file_location);

        echo '<script id="' . $id . '" type="text/x-handlebars-template">';
        echo $handlebar_contents;
        echo '</script>';
    }

    else {
        error_log("Handlebars template ($file_location) doesn't exist");
    }
}

/**
* Function to render handlebars in PHP. Users the Handlebars framework (via Composer).
*
* @param     string     $template_name         The name of the template
* @param     array      $replacements_array    The replacements
* @param     boolean    $return                Whether to return the HTML or print it
* 
* @return    string The HTML
*/
function render_handlebars($template_name, $replacements_array = array(), $return = false){

    // Get the directory of the plugin
    $directory = get_force_refresh_plugin_directory();

    // Add the template directory to the replacements
    $replacements_array["template_directory_uri"] = get_template_directory_uri();

    $file_location = $directory . FORCE_REFRESH_HANDLEBARS_DIRECTORY . $template_name;

    $file_directory = dirname($file_location);

    if (file_exists($file_location)){

        // Get the file contents
        $handlebar_contents = file_get_contents($file_location);

        $php = ZordiusLightnCandy\LightnCandy::compile(
            $handlebar_contents, array(
                'flags' => ZordiusLightnCandy\LightnCandy::FLAG_RENDER_DEBUG | ZordiusLightnCandy\LightnCandy::FLAG_HANDLEBARSJS
            )
        );

        // Get the render function
        $renderer = ZordiusLightnCandy\LightnCandy::prepare($php);

        $rendered_html = $renderer($replacements_array);

        // If return is true, then return the HTML
        if ($return){

            return $rendered_html;
        }

        // Otherwise, echo it
        else {

            echo $rendered_html;
            
        }

    }

    else {
        error_log("Unable to locate handlebars: " . $file_location);
    }
}

?>