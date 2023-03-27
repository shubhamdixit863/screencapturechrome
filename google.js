// TODO: Set the below credentials
const CLIENT_ID = '911067435942-phmoaj6h02oqb6187ka8c5vcegdvag4g.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCf1kGuZQr7RoDVHdnxMXk-mShHpxmqjIA';

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient;
let gapiInited = false;
let gisInited = false;


(function(){
	
	gapiLoaded();
	gisLoaded();
		// attaching listener to the auth button
		document.getElementById("auth").addEventListener("click",async function(){
			await  handleAuthClick();
	   });

})();
/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
	gapi.load('client', async ()=>{
         try {
			let result=await gapi.client.init({
				apiKey: API_KEY,
				discoveryDocs: [DISCOVERY_DOC],
			});
			console.log(result);
		 } catch (error) {
			console.log(error);
		 }
		
		gapiInited = true;
		maybeEnableButtons();

	});
}



/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: '', // defined later
	});
	gisInited = true;
	maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
	if (gapiInited && gisInited) {
		document.getElementById('start').style.visibility = 'visible';
		document.getElementById('stop').style.visibility = 'visible';

	}
}

async function handleAuthClick() {
	try {
	  const token = gapi.client.getToken();
	  console.log(token);
	  if (token === null) {
		// Prompt the user to select a Google Account and ask for consent to share their data
		// when establishing a new session.
		await tokenClient.requestAccessToken({ prompt: 'consent' });
	  } else {
		// Skip display of account chooser and consent dialog for an existing session.
		await tokenClient.requestAccessToken({ prompt: '' });
	  }
	  console.log(token);
	  localStorage.setItem('googleToken', JSON.stringify(gapi.auth.getToken()));
	 // document.getElementById('signout_button').style.visibility = 'visible';
	 // document.getElementById('authorize_button').value = 'Refresh';
	
	} catch (error) {
	  console.error(error);
	}
  }
  

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
	const token = gapi.client.getToken();
	if (token !== null) {
		google.accounts.oauth2.revoke(token.access_token);
		gapi.client.setToken('');
		document.getElementById('content').style.display = 'none';
		document.getElementById('content').innerHTML = '';
		document.getElementById('authorize_button').value = 'Authorize';
		document.getElementById('signout_button').style.visibility = 'hidden';
	}
}

/**
 * Upload file to Google Drive.
 */
async function uploadFile(fileContent) {
	let  file = new Blob([fileContent], { type: 'video/mp4' });
	let  metadata = {
	  'name': 'sample-file-via-js.mp4', // Filename at Google Drive
	  'mimeType': 'video/mp4', // mimeType at Google Drive
	  // Note: remove this parameter, if no target is needed
	  'parents': ['SET-GOOGLE-DRIVE-FOLDER-ID'], // Folder ID at Google Drive which is optional
	};
  

	let  accessToken = localStorage.getItem("googleToken");//gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
	let  form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	let  xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=xa298sd_sdlkj2');
	xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xhr.responseType = 'json';
	xhr.onload = () => {
		document.getElementById('content').innerHTML = "File uploaded successfully. The Google Drive file id is <b>" + xhr.response.id + "</b>";
		document.getElementById('content').style.display = 'block';
	};
	xhr.send(form);
}