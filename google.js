const CLIENT_ID = '911067435942-phmoaj6h02oqb6187ka8c5vcegdvag4g.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCf1kGuZQr7RoDVHdnxMXk-mShHpxmqjIA';

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient;
let gapiInited = false;
let gisInited = false;

//document.getElementById('authorize_button').style.visibility = 'hidden';
//document.getElementById('signout_button').style.visibility = 'hidden';

document.getElementById("auth").addEventListener("click",function(){
	handleAuthClick();
})
/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
	gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
	await gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: [DISCOVERY_DOC],
	});
	gapiInited = true;
	maybeEnableButtons();
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

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	tokenClient.callback = async (resp) => {
		if (resp.error !== undefined) {
			throw (resp);
		}
		//document.getElementById('signout_button').style.visibility = 'visible';
		//document.getElementById('authorize_button').value = 'Refresh';
		//await uploadFile();

	};

	if (gapi.client.getToken() === null) {
		// Prompt the user to select a Google Account and ask for consent to share their data
		// when establishing a new session.
		tokenClient.requestAccessToken({ prompt: 'consent' });
		localStorage.setItem("token",gapi.client.getToken())
	} else {
		// Skip display of account chooser and consent dialog for an existing session.
		tokenClient.requestAccessToken({ prompt: '' });
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
 async function uploadFile(myBlob) {
	//var file = new File([myBlob], "video.mp4");

	//var fileContent = 'Hello World'; // As a sample, upload a text file.
	//const file = new Blob(recordedChunks, { type: 'video/mp4' }); // recordedChunks is assumed to be an array of video chunks
	const metadata = {
		name: Date.now() + '.mp4',// file name
	  mimeType: 'video/mp4', // file MIME type
	  'parents': ['SET-GOOGLE-DRIVE-FOLDER-ID'], // optional: folder ID to upload the file to
	};

	var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
	var form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json' }));
	form.append('file', myBlob);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
	xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xhr.responseType = 'json';
	xhr.send(form);
}

// File upload function here

let start = document.getElementById('start'),
    stop  = document.getElementById('stop'),
    mediaRecorder;

start.addEventListener('click', async function(){
    let stream = await recordScreen();
    let mimeType = 'video/webm';
    mediaRecorder = createRecorder(stream, mimeType);
  let node = document.createElement("p");
    node.textContent = "Started recording";
    document.body.appendChild(node);
})

stop.addEventListener('click', function(){
    mediaRecorder.stop();
    let node = document.createElement("p");
    node.textContent = "Stopped recording";
    document.body.appendChild(node);
})

async function recordScreen() {
    return await navigator.mediaDevices.getDisplayMedia({
        audio: true, 
        video: { mediaSource: "screen"}
    });
}

function createRecorder (stream, mimeType) {
  // the stream data is stored in this array
  let recordedChunks = []; 

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }  
  };
  mediaRecorder.onstop = function () {
     saveFile(recordedChunks);
     recordedChunks = [];
  };
  mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
  return mediaRecorder;
}

async function saveFile(recordedChunks){

   const blob = new Blob(recordedChunks, {
      type: 'video/mp4'
    });
    await uploadFile(blob);
    
    let filename = window.prompt('Enter file name'),
        downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.mp4`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(blob); // clear from memory
    document.body.removeChild(downloadLink);
    
}