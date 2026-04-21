<?php
/**
 * Configures WordPress to route outgoing mail through the local Mailpit SMTP container.
 * Only active in the Docker dev environment.
 *
 * @package ForceRefresh
 */

add_action(
    'phpmailer_init',
    function ( PHPMailer\PHPMailer\PHPMailer $phpmailer ) {
        $phpmailer->isSMTP();
        $phpmailer->Host       = 'mailpit';
        $phpmailer->Port       = 1025;
        $phpmailer->SMTPAuth   = false;
        $phpmailer->SMTPSecure = '';
    }
);
