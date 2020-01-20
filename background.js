function translate(word, sendResponse) {
	var mkey = '';
	var ukey = '';
	const last_word = localStorage["last_word"];
	const last_translation = localStorage["last_translation"];
	const fromLang = localStorage["fromLang"];
	const toLang = localStorage["toLang"];
	const api_url = 'https://www.batua.eus/api/'+fromLang+'2'+toLang;
	const model = 'generic_'+fromLang+'2'+toLang;
	
	if (fromLang == "eu") {
		mkey = localStorage["mkey_for_eu2es"];
	} else {
		mkey = localStorage["mkey_for_es2eu"];
	}

	var response = {
		"fromLang": fromLang,
		"toLang": toLang,
		"word": word
	}

	if (last_word == word) {
		response.translation = last_translation;
		response.succeeded = true;
		sendResponse(JSON.stringify(response));
	} else {
		$.ajax({
			url: api_url + "/key/get",
			type: "POST",
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			dataType: "json",
			data: JSON.stringify({
				"mkey": mkey
			})
		}).then((data) => {
			ukey = data["ukey"];
			return $.ajax({
				url: api_url + '/job/add',
				type: 'POST',
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
				dataType: 'json',
				data: JSON.stringify({
					"mkey" : mkey,
					"ukey": ukey,
					"text": word,
					"model": model
				})
			});
		}).then((data) => {
			const url = api_url + '/job/' + ukey + '/status';
			setTimeout(function(){
				$.ajax({
					url: url,
					type: "GET",
					contentType: "application/x-www-form-urlencoded; charset=UTF-8",
					dataType: "json"
				}).then((data) => {
					if (data["message"] == "processed") {
						const url = api_url + '/job/' + ukey + '/get'
						return $.ajax({
							url: url,
							type: 'POST',
							contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
							dataType: 'json',
							data: JSON.stringify({
								"mkey": mkey
							})
						})
					} else {
						return {}
					}
				}).then((data) => {
					if (data["message"]) {
						response.translation = data["message"];
						response.succeeded = true;
						localStorage["last_word"] = word;
						localStorage["last_translation"] = data["message"];
					} else {
						response.succeeded = false;
					}
					sendResponse(JSON.stringify(response));
				})
			}, 500)
		})
	}

}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.handler) {
        case 'translate':
			if (localStorage["app"] == "on"){
				translate(request.word, sendResponse);
			} else {				
				sendResponse()
			}            
			break
		case 'switch_activated':
			if (localStorage["app"] == "on") {
				chrome.browserAction.setIcon({path: 'images/to_80.png'});
			} else {
				chrome.browserAction.setIcon({path: 'images/to_bw_90.png'});
			}
			break
        default:
            console.error('Unknown handler')
            sendResponse("unknown handler")
	}
	return true
})

chrome.runtime.onInstalled.addListener(function() {
	// Save the master key
	localStorage["mkey_for_eu2es"] = "378540641195b0";
	localStorage["mkey_for_es2eu"] = "85b92f176fe0efac";
	// Set default values for popup
	setDefaultOptions();
});

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.browserAction.setPopup({popup: "popup.html"});
});

function setDefaultOptions() {
	localStorage["fromLang"] = "eu";
	localStorage["toLang"] = "es";
	localStorage["app"] = "on";
}
