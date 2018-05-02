# Force Refresh
>v 1.2

Force Refresh is a simple plugin that allows you to force a page refresh for users currently visiting your site.

## Features
* Support for both parent and child themes
* Allows an admin to simply click a button to request browsers to refresh their page. This is done within two minutes after making the request.
* Ability to add refreshing capabilities to any role using the "Invoke Force Refresh" capability.

## How it works
It's pretty simple. When you click "Refresh Site," a hash is created and stored of the current time so no two hashes will be the same. On the front end of things, users will check for the current hash every two minutes. If the hash is different than the one that is stored - poof - the browser refreshes!

To force a refresh, just activate the plugin, navigate to "Tools" and click on "Force Refresh."

## Changelog ##

### 1.2 ###
* The ability to perform a refresh is now assigned to a capability called, "Invoke Force Refresh" – allowing you to granularly control what types of users and roles can invoke a refresh.

### 1.1.2 ###
* Update dependencies

### 1.1.1 ###
* Code cleanup

### 1.1 ###
* Bug fixes

## License
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
