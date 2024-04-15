# Tr3nch
Tr3nch is an exploit allowing you to open a menu on various "chrome urls" to perform
various actions that a normal extension is not capable of doing, and is kind of like
the spiritual successor to the "Swamp ULTRA" exploit due to its behaviour and the
fact that goguardian users are guarunteed to be able to do this. It utilizes a bug
in chrome urls to allow for code execution with access to the chrome API (this bug
has been dubbed "Sh0vel") and abuses this bug to do a number of things, including:
- Adding gmails regardless of policy
- Open a webview proxy invisible to some filters
- Edit network settings for any network
- Loopkill/Disable extensions
- Run code on the page and extension with API access
- Update the device and pause/resume automatic updates

And more.

It is very unlikely that this exploit will ever be patched, as it entirely revolves around Sh0vel, which itself entirely revolves around the extensions-on-chrome-urls flag, and is technically just an automated version of the Point-Blank exploit, which Google also did not patch (unless you count the R115 bookmarklet restrictions) due to it being technically intended behaviour.
However, Google has patched Skiovox in ChromeOS release R121, breaking the setup chain. While it possible to downgrade to R120 currently to set it up, it is likely you won't be able to do this forever. The only part that matters is that you have code execution in an extension and it runs the contents of installer.js, wether you do that through DNS spoofing, XSS, or something else does not matter.

### Setup
---
The setup is somewhat complicated! If you don't know how to setup some of the things mentioned here, this might not be the best exploit for you, as it gets somewhat complicated in some areas.
- First, find an extension vulnerable to Sh0vel. This can be determined by looking at its manifest and looking for its permissions and seeing if it has "activeTab", "manifest_version" set to 2 (3 WILL NOT WORK), "browser_action", and "unsafe-eval" (NOT wasm-unsafe-eval) anywhere in the manifest. If it does, then perfect! Use that extension for the following steps. If you're stuggling to find a vulnerable extension, I can garuntee that the extensions "GoGuardian" and "Equatio" are vulnerable.
- Once you have a vulnerable extension, set up skiovox breakout. To do this, use [this guide](https://skiovox.com) to get in to skiovox (Note only steps 2a will work for skiovox breakout), then install [the skiovox breakout extension](https://github.com/MunyDev/skiovox-breakout) the same way you installed skiovox-helper. From there, figure out a way to download an image file of some sorts, then open the file manager in skiovox, and double click the image, and your school window will open. Don't close it. Navigate back to the unblocked window, click the "skiovox breakout" extension, remove "alert(1);" from the payload box, paste the contents of `installer.js` from this repo in the payload box, then put the ID of the vulnerable extension, and click "Start Injection". From there, go to chrome://extensions on the School window, go to the vulnerable extension's details page, look for any switch (usually one is labelled "Allow access to file urls") and click it.
- You will recieve an alert informing you Tr3nch has been setup, and you will be informed to bookmark a page. Do as it says, and Tr3nch has been permenantly set up on this extension.
- Sign in normally, navigate to chrome://flags, locate the flag "extensions-on-chrome-urls" and set it to enabled, then press the switch to restart.

### Usage
---
Make sure you've gone through the setup on an extension beforehand.
- Open the bookmark that you created in the last step of the setup. If you're struggling to get it to open, right click the bookmark and select "Open In New Tab".
- The page should close instantly, this is normal.
- Now that Tr3nch is loaded in, go to any chrome URL. Different URLs have different permissions, so some will have different options than others. The most powerful are typically "chrome://settings", "chrome://os-settings", "chrome://file-manager", "chrome://chrome-signin", "chrome://extensions", and "chrome://network". If the url opens a new window when opening instead of opening as a normal tab, it needs to open normally. This can be forced by opening Tr3nch on any tab (you might see a notification complaining it lacks necessary permisions, this will still work, ignore it), then navigating to "Quick Navigate" and selecting the url of your choice from the options.
- Once you're on the page, find your extension in the top right corner of the browser (it might be hidden in the extension menu, click the puzzle piece menu to find it) and click the icon of the extension you loaded Tr3nch on.
- Assuming you did everything correctly, the Tr3nch menu should load in. From here you can mess around with the menu options, run code in a bunch of places, and unload Tr3nch instantly if needed.

It is highly recommended that you update Tr3nch every once in a while, as the menu may be often updated with new features and exploits that may not have been implemented when you installed it. There's an option to update Tr3nch at the very top of the menu once it's loaded in, just make sure you're connected to wifi and it will automatically set things up for you. 
There is also a button for unloading Tr3nch, right next to the update switch. This will instantly close the current Tr3nch window and unload Tr3nch from the extension, bringing it back to normal.

### Credits
- Zeglol1234: The general idea, Main developer
- Writable: Assistance with Sh0vel and code from skiovox-breakout
- Kelsea: Making the logo
- Kxtz: Misc development & Testing
- Boeing: Misc development & Testing
- Katie: Testing
