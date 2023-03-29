const { app, BrowserWindow, session, net } = require('electron')

const path = require('path')
const isDev = require('electron-is-dev')
//const DownloadManager = require("electron-download-manager");



const { ipcMain } = require("electron");

const fs = require('fs');

let downloadFolder = app.getPath('downloads');
let lastWindowCreated;

const queue = [];

const _popQueueItem = (url) => {
  let queueItem = queue.find(item => item.url === url);
  queue.splice(queue.indexOf(queueItem), 1);
  return queueItem;
};

const _bytesToSize = (bytes,decimals) => {
  if(bytes == 0) return '0 Bytes';
  var k = 1000,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const _convertTime = (input, separator) => {
  var pad = function(input) {return input < 10 ? "0" + input : input;};
  return [
    pad(Math.floor(input / 3600)),
    pad(Math.floor(input % 3600 / 60)),
    pad(Math.floor(input % 60)),
  ].join(typeof separator !== 'undefined' ?  separator : ':' );
}

function _registerListener(win, opts = {}) {

  lastWindowCreated = win;
  downloadFolder = opts.downloadFolder || downloadFolder;

  const listener = (e, item, web) => {


    const itemUrl = decodeURIComponent(item.getURLChain()[0] || item.getURL())
    const itemFilename = decodeURIComponent(item.getFilename());

    let queueItem = _popQueueItem(itemUrl);
    let ReceivedBytesArr = [];

    if (queueItem) {
      const folder = queueItem.downloadFolder || downloadFolder
      const filePath = path.join(folder, queueItem.path, itemFilename);

      const totalBytes = item.getTotalBytes();
      let speedValue = 0;
      let receivedBytes;
      let PreviousReceivedBytes;

      item.setSavePath(filePath);

      // Resuming an interrupted download
      if (item.getState() === 'interrupted') {
        item.resume();
      }
      ipcMain.on("send-data-event-name", (event, data, downloadId, flag) => {

        if(flag == 'pause' && item.getFilename() == downloadId) {
          item.pause();
        }
        if(flag != 'pause'  && item.getFilename() == downloadId) {
          item.resume();
        }


      })
      item.on('updated', (x) => {
       // console.log('web', web);
        //console.log('xxxxxxx=> ',x)

        receivedBytes = item.getReceivedBytes();
        ReceivedBytesArr.push(receivedBytes);
        if (ReceivedBytesArr.length >= 2) {
          PreviousReceivedBytes = ReceivedBytesArr.shift();
          speedValue = Math.max(PreviousReceivedBytes, ReceivedBytesArr[0]) - Math.min(PreviousReceivedBytes, ReceivedBytesArr[0]);
        }
        const progress = {
          progress: receivedBytes * 100 / totalBytes,
          speedBytes: speedValue,
          speed: _bytesToSize(speedValue) + '/sec',
          remainingBytes: totalBytes - receivedBytes,
          remaining: _bytesToSize(totalBytes - receivedBytes),
          totalBytes: totalBytes,
          total: _bytesToSize(totalBytes),
          downloadedBytes: receivedBytes,
          downloaded: _bytesToSize(receivedBytes),
          state: item.getState()
        }


        if (typeof queueItem.onProgress === 'function') {
          queueItem.onProgress(progress, item);
        }
      });


      item.on('done', (e, state) => {

        let finishedDownloadCallback = queueItem.callback || function () {};

        if (!win.isDestroyed()) {
          win.setProgressBar(-1);
        }

        if (state === 'interrupted') {
          const message = `The download of ${item.getFilename()} was interrupted`;

          finishedDownloadCallback(new Error(message), { url: item.getURL(), filePath });

        } else if (state === 'completed') {
          if (process.platform === 'darwin') {
            app.dock.downloadFinished(filePath);
          }

          // TODO: remove this listener, and/or the listener that attach this listener to newly created windows
          // if (opts.unregisterWhenDone) {
          //     webContents.session.removeListener('will-download', listener);
          // }

          finishedDownloadCallback(null, { url: item.getURL(), filePath });

        }

      });
    }
  };

  win.webContents.session.on('will-download', listener);
}

const register = (opts = {}) => {
  app.on('browser-window-created', (e, win) => {
    _registerListener(win, opts);
  });
};

const download = (options, callback) => {

  let win = BrowserWindow.getFocusedWindow() || lastWindowCreated;
  options = Object.assign({}, { path: '' }, options);

  const request = net.request(options.url);

  const filename = decodeURIComponent(path.basename(options.url));
  const url = decodeURIComponent(options.url);

  const folder = options.downloadFolder || downloadFolder
  const filePath = path.join(folder, options.path.toString(), filename.split(/[?#]/)[0])

  if (options.headers) {
    options.headers.forEach((h) => { request.setHeader(h.name, h.value) })

    // Modify the user agent for all requests to the following urls.
    const filter = {
      urls: [options.url]
    }

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      options.headers.forEach((h) => { details.requestHeaders[h.name] =  h.value })
      // details.requestHeaders['User-Agent'] = 'MyAgent'
      callback({ cancel: false, requestHeaders: details.requestHeaders })
    })
  }

  if (typeof options.onLogin === 'function') {
    request.on('login', options.onLogin)
  }


  request.on('error', function (error) {
    let finishedDownloadCallback = callback || function () { };

    const message = `The request for ${filename} was interrupted: ${error}`;

    finishedDownloadCallback(new Error(message), { url: options.url, filePath: filePath });
  });

  request.on('response', function (response) {
    request.abort();

    queue.push({
      url: url,
      filename: filename,
      downloadFolder: options.downloadFolder,
      path: options.path.toString(),
      callback: callback,
      onProgress: options.onProgress,
    });


    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);

      const fileOffset = stats.size;

      const serverFileSize = parseInt(response.headers['content-length']);

      console.log(filename + ' exists, verifying file size: (' + fileOffset + ' / ' + serverFileSize + ' downloaded)');

      // Check if size on disk is lower than server
      if (fileOffset < serverFileSize) {
        console.log('File needs re-downloaded as it was not completed');

        options = {
          path: filePath,
          urlChain: [options.url],
          offset: parseInt(fileOffset),
          length: serverFileSize,
          lastModified: response.headers['last-modified']
        };

        win.webContents.session.createInterruptedDownload(options);

      } else if(options.dee == 'start'){
         // if(options.dee == 'play') win.webContents.downloadURL(options.url);
        console.log(filename + ' verified, no download needed');

        let finishedDownloadCallback = callback || function () {};

        finishedDownloadCallback('Exist', { url, filePath });

      }

    } else {
      console.log(filename + ' does not exist, download it now');
      win.webContents.downloadURL(options.url);
    }
  });
  request.end();
};

/*const bulkDownload = (options, callback) => {

  options = Object.assign({}, { urls: [], path: '' }, options);

  let urlsCount = options.urls.length;
  let finished = [];
  let errors = [];

  options.urls.forEach((url) => {
    download({ url, path: options.path, onProgress: options.onProgress, flag: options.flag }, function (error, itemInfo) {

      if (error) {
        errors.push(itemInfo.url);
      } else {
        finished.push(itemInfo.url);
      }

      let errorsCount = errors.length;
      let finishedCount = finished.length;

      if (typeof options.onResult === 'function') {
        options.onResult(finishedCount, errorsCount, itemInfo.url);
      }

      if ((finishedCount + errorsCount) === urlsCount) {
        if (errorsCount > 0) {
          callback(new Error(errorsCount + ' downloads failed'), finished, errors);
        } else {
          callback(null, finished, []);
        }
      }
    });
  });
};*/

register({
  downloadFolder: app.getPath("downloads") + "/bulk_downloader"
});

require('@electron/remote/main').initialize()


function onProgress(progress) {
  console.log(progress)
}

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  )
  
  
  const path2 = app.getPath("downloads") + "/bulk_downloader/";
  ipcMain.on("delete", (event, filenameDelete) => {
    console.log('filenameDelete',filenameDelete)
    try {
      fs.unlinkSync(path2+filenameDelete);
      console.log("File removed:", path2);
    } catch (err) {
      console.error(err);
    }
  })


  ipcMain.on("send-data-event-name", (event, data, downloadId, flag) => {
    //console.log('queue',event);


// here we can process the data

// we can send reply to react using below code

   // console.log('daaata = ', data);
    //console.log('downloadId = ', downloadId);

   // for(var i = 0; i < data.length; i++){
      download({
        url: data,
        dee: flag,
        onProgress:  (progress, item) => { //console.log('progress',progress);

          event.reply(downloadId, progress);
        }

      }, function (response, info) {

        console.log('response: -> ',response);
        event.reply(downloadId, response);
        console.log("DONE: " + info? Object.keys(info):"Exist");
      });

   // }



  });
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
