# Beta Versions

If you're encountering errors with Force Refresh, I may ask for you to download a beta release that contains bug fixes or other debugging features. Beta versions are distributed exclusively through GitHub. Each one is built from a pull request opened from a branch of the Force Refresh repository, and is deleted once that pull request is closed or merged, so download links stop working after that. If a link no longer works, install the latest public release or ask for a new beta.

Beta versions are numbered after the release they lead up to, such as `3.3.0-beta.412.7`. WordPress treats a beta as older than the final release, so once that release is publicly available it will be offered as a normal update.

## Installing Beta Versions

1. Download the beta release `.zip` from GitHub using the provided link.
1. Under "Plugins", [deactivate][help_deactivate_plugin] the existing Force Refresh plugin.
1. In WordPress admin, go to **Plugins > Add New Plugin > Upload Plugin**.
1. Choose the downloaded `.zip` file and click **Install Now**.
1. Activate the beta release of Force Refresh under Plugins.

## Uninstalling Beta Versions

Once debugging is complete, or you've verified that the beta release fixes your issue, you may either stay on the beta version until the next release or you may revert to the previous version.

### Staying on Beta Until Next Release

1. Under "Plugins", [delete][help_delete_plugin] the previously active public release of Force Refresh.
1. Once the new version of Force Refresh is publicly available, update like normal.

### Reverting to Previous Version

1. Under "Plugins", deactivate the beta Force Refresh plugin and [delete it][help_delete_plugin] from your WordPress installation.
1. Activate the previously active public release of Force Refresh.

[help_deactivate_plugin]: https://wordpress.com/support/plugins/deactivate-or-delete-a-plugin/#deactivate-a-plugin
[help_delete_plugin]: https://wordpress.com/support/plugins/deactivate-or-delete-a-plugin/#delete-a-plugin
