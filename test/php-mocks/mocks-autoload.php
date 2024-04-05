<?php
/**
 * Our mock autoloader.
 *
 * @package ForceRefresh
 */

namespace JordanLeven\Plugins\ForceRefresh\Mocks;

/**
 * Function to automatically load interfaces and mock classes.
 *
 * @param string $class_name The name of the class.
 *
 * @return  void
 * @throws \Exception If the file isn't found.
 */
function autoload_classes_and_interfaces( string $class_name ) {
    // If the autoloaded class is not of our namespace, do an early exit.
    if ( strpos( $class_name, __NAMESPACE__ ) === false ) {
        return;
    }

    // Format the string based on our agreed-upon file structure.
    $file_path = str_replace(
        array( __NAMESPACE__, '\\', '_' ),
        array( '', '/', '-' ),
        $class_name
    );

    $file_path_absolute = strtolower( sprintf( '%s%s.php', __DIR__, $file_path ) );
    $file_name          = basename( $file_path_absolute );
    $file_name_adjusted = $file_name;

    // If the file is an interface, then we need to adjust the naming convention.
    if ( strpos( $file_name, 'interface' ) ) {
        $file_name_adjusted = 'interfaces/interface-' . str_replace( '-interface', '', $file_name );
    } else {
        $file_name_adjusted = 'classes/class-' . $file_name;
    }

    $file_path_absolute_adjusted = str_replace( $file_name, $file_name_adjusted, $file_path_absolute );

    if ( ! file_exists( $file_path_absolute_adjusted ) ) {
        // phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
        throw new \Exception( sprintf( 'Unable to locate file %s', $file_path_absolute_adjusted ) );
        // phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
    }

    require_once $file_path_absolute_adjusted;
}

spl_autoload_register( __NAMESPACE__ . '\\autoload_classes_and_interfaces' );
