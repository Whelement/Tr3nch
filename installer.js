// The majority of this is taken from https://github.com/MunyDev/skiovox-breakout/blob/main/sw.js
// Thanks Writable!
webkitRequestFileSystem(TEMPORARY, 1024 * 1024 * 300, async function (fs) {
	function writeFile(name, data) {
		return new Promise((resolve) => {
			fs.root.getFile(name, {create: true}, function (entry) {
				entry.createWriter(function (writer) {
					writer.write(new Blob([data]));
                    writer.onwriteend=function () {
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

	await removeFile("tr3nch.html");
	await removeFile("tr3nch.js");
	// This will only work when the repo goes public
	fetch("https://raw.githubusercontent.com/Whelement/Tr3nch/main/tr3nch.js").then(res => res.text()).then((data) => {
		await writeFile(data, tr3nch);
		let src=await writeFile('<script src="tr3nch.js"></script>', "tr3nch.html");
		alert(`Please save this page in you bookmarks, you'll need it to load in Tr3nch: ${src}`);
	});
});
