# Tr3nch
Tr3nch allows you to open a menu on various "chrome urls" to perform
various actions that a normal extension is not capable of doing, and is kind of like
the spiritual successor to "Swamp ULTRA" due to its behaviour. It utilizes a code execution in chrome urls to do a number of things, including:
- Adding gmails regardless of policy
- Open a webview proxy invisible to some filters
- Edit network settings for any network
- Loopkill/Disable extensions
- Run code on the page and extension with API access
- Update the device and pause/resume automatic updates

And more.


However, Google has patched Skiovox in ChromeOS release R121, breaking the setup chain. While it possible to downgrade to R120 currently to set it up (only for auto enrollment), it is likely you won't be able to do this forever. Code execution in extensions is necessary.

### Usage
Warning! This might be difficult to setup if you do not have at least some experience with skiovox breakout and sh0vel! 

A more detailed setup guide can be found [here](https://whelement.me/tr3nch/).

Usage is fairly straight forward:
- Find and install an extension capable of executing Sh0vel (it will still work if it's installed from the webstore or admin installed). Some known ones are GoGuardian and Equatio, but to see if another potential extension is vulnerable, open its manifest and verify that "manifest_version" is set to 2 (3 WILL NOT WORK!), verify that "unsafe-eval" (NOT "wasm-unsafe-eval", that will NOT WORK!) is in the "content_security_policy" tag at least somewhere (This does not count if it is in the "sandbox" attribute that will not work!), "browserAction" or "browser_action" present somewhere, and that "activeTab" is in the list of permissions.
- Set up Skiovox Breakout on the extension. See [this guide](https://rentry.co/pm6ta) on how to do that.
- On this repo, copy the contents of `tr3nch.js`, open the page you bookmarked for skiovox breakout (if you cant open it normally, right click the bookmark and select "Open in New Tab"), paste the contents into the textbox, and press evaluate.
- Tr3nch is now set up on this extension. When the extension restarts (e.g. from signing out/in, killing it and disabling it, or deloading tr3nch), tr3nch will be unloaded, and can be reloaded by opening the skiovox breakout page (Yes you HAVE to open it first!) and changing the url to `filesystem:chrome-extension://id_for_the_extension_here/temporary/evaluations/index.html`. If you ever run something other than tr3nch from skiovox breakout you will need to redo the setup.
- Once tr3nch is set up, go to any "chrome url" (The best of which being chrome://extensions, chrome://chrome-signin, chrome://os-settings, chrome://settings, and chrome://file-manager) and clicking the icon of the extension you injected tr3nch into in the top right menu.

### Credits
- Zeglol1234: The general idea, Main developer
- Writable: Assistance with Sh0vel and code from skiovox-breakout
- Kelsea: Making the logo
- Kxtz: Misc development & Testing
- Notboeing747: Misc development & Testing
- Katie: Testing
- Evelyn: Meowing
