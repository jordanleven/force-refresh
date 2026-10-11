<?php
/**
 * Feature flag definitions for Force Refresh.
 *
 * Each entry maps a flag name to a boolean. Set a flag to true to enable the
 * corresponding feature, or false to disable it.
 *
 * A single site can override these values without editing this file by
 * defining `FORCE_REFRESH_FEATURE_FLAGS` in `wp-config.php`, above the "stop
 * editing" line:
 *
 *     define( 'FORCE_REFRESH_FEATURE_FLAGS', array( 'websockets' => true ) );
 *
 * Flags missing from the override keep the value below, and names that are not
 * listed below are ignored.
 *
 * @package ForceRefresh
 */

return array(
    'scheduledRefresh'           => true,
    'troubleshootingTerminal'    => false,
    'troubleshootingSubmitDebug' => true,
    'websockets'                 => false,
);
