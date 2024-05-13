# Beta Versions

If you're encountering errors with Force Refresh, I may ask for you to download a beta release that contains bug fixes or other debugging features. Beta versions will be distributed exclusively through GitHub and will always be composed of [signed commits] to confirm that the code is genuine.

## Installing Beta Versions

1. Download the beta release directly from GitHub using the provided link.
1. Under "Plugins", [deactivate][help_deactivate_plugin] the existing Force Refresh plugin.
1. Upload the beta release of Force Refresh using your preferred method, like FTP or uploading through the UI as a .zip file.
1. Activate the beta release of Force Refresh under Plugins.

## Uninstalling Beta Versions

Once debugging is complete, or you've verified that the beta release fixes your issue, you may either stay on the beta version until the next release or you may revert to the previous version.

### Staying on Beta Until Next Release

1. Under "Plugins", [delete][help_delete_plugin] the previously active public release of Force Refresh.
1. Once the new version of Force Refresh is publicly available, updated like normal.

### Reverting to Previous Version

1. Under "Plugins", deactivate the beta Force Refresh plugin and [delete it][help_delete_plugin] from your WordPress installation.
1. Active the previously active public release of Force Refresh.

[signed commits]: https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits
[help_deactivate_plugin]: https://wordpress.com/support/plugins/deactivate-or-delete-a-plugin/#deactivate-a-plugin
[help_delete_plugin]: https://wordpress.com/support/plugins/deactivate-or-delete-a-plugin/#delete-a-plugin
