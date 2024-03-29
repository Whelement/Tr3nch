# Tr3nch
Tr3nch is an exploit allowing you to open a menu on various "chrome urls" to perform
various actions that a normal extension is not capable of doing. It utilizes a bug
in chrome urls to allow for code execution with access to the chrome API (this bug
has been dubbed "Sh0vel") and abuses this bug to do a number of things, including:
- Adding gmails regardless of policy
- Open a webview proxy invisible to some filters
- Edit network settings for any network (includes a metered toggle)
- Edit site settings for any page
- Disable extensions
- Run code on the chrome url and extension
- Update the device regardless of caub
- Unenroll! (ONLY FOR PEOPLE WHO CAN DOWNGRADE TO R111, NOT TESTED YET!)

And more.

### Setup
---
The setup is somewhat complicated! If you don't know how to setup some of the things mentioned here, this might not be the best exploit for you, as it gets somewhat complicated in some areas.
- First, find an extension vulnerable to Sh0vel. This can be determined by looking at its manifest and looking for its permissions and seeing if it has "activeTab", "manifest_version" set to 2 (3 WILL NOT WORK), "browser_action", and "unsafe-eval" (NOT wasm-unsafe-eval) anywhere in the manifest. If it does, then perfect! Use that extension for the following steps. If you're stuggling to find a vulnerable extension, I can garuntee that the extensions "GoGuardian" and "Equatio" are vulnerable.
- Once you have a vulnerable extension, set up skiovox breakout on it. To do this, use [this guide](https://skiovox.com) to get in to skiovox (Note only steps 2a will work for skiovox breakout), then install [the skiovox breakout extension](https://github.com/MunyDev/skiovox-breakout) the same way you installed skiovox-helper. From there, figure out a way to download an image file of some sorts, then open the file manager in skiovox, and double click the image, and your school window will open. Don't close it. Navigate back to the unblocked window, click the "skiovox breakout" extension, remove "alert(1);" from the payload box, then put the first 5 letters of the ID of the vulnerable extension. From there, go to chrome://extensions on the School window, go to the vulnerable extension's details page, look for any switch (usually one is labelled "Allow access to file urls") and click it. When prompted, bookmark the page it tells you to. You can now exit skiovox, it is no longer needed.
- Sign in normally, navigate to chrome://flags, locate the flag "extensions-on-chrome-urls" and set it to enabled, then press the switch to restart.
- In this repo, copy the contents of `installer.js`. Open the page you bookmarked in step 2 (If you can't open it, right click the bookmark and click "open in new tab"), then paste the contents into the textbox and press Evaluate.
- You will recieve an alert informing you Tr3nch has been setup, and you will be informed to bookmark another page. Do as it says, and Tr3nch has been permenantly set up on this extension.

### Usage
---
Make sure you've gone through the setup on an extension beforehand.
- Open the bookmark that you created in the last step of the setup. If you're struggling to get it to open, right click the bookmark and select "Open In New Tab".
- The page should close instantly, this is normal.
- Now that Tr3nch is loaded in, go to any chrome URL. Different URLs have different permissions, so some will have different options than others. The most powerful are typically "chrome://settings", "chrome://os-settings", "chrome://file-manager", "chrome://chrome-signin", "chrome://extensions", and "chrome://network". If the url opens a new window when opening instead of opening as a normal tab, it needs to open normally. This can be forced by opening the bookmark you made for skiovox breakout (not the one you made for Tr3nch), then in the textbox pasting `chrome.tabs.create({}, () => {chrome.tabs.update({url: "chrome://whatever-url-you-chose"});});`, and it should open as a normal page.
- Once you're on the page, find your extension in the top right corner of the browser (it might be hidden in the extension menu, click the puzzle piece menu to find it) and click the icon of the extension you loaded Tr3nch on.
- Assuming you did everything correctly, the Tr3nch menu should load in.
