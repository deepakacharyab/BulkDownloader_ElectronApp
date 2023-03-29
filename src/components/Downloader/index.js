import React, { useEffect, useState } from "react";
import "./index.css";
import { ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Axios from "axios";

const { ipcRenderer } = window.require("electron");
const fs = require("fs");


const Downloader = ({ files = [], remove }) => {

  const clearAll = (files)=>{
    for(var i = 0; i < files.length; i++){
      remove(files[i].downloadId);
    }
  }

  return (
    <div className="downloader">
      <div className="card">
        <div className="card-header">File Downloader
          {files.length > 0 ? <span class='btn-right click-cursor' title="Delete All" onClick={() => clearAll(files)}>
            <FontAwesomeIcon icon="fa-solid fa-trash" />
          </span>:""}
        </div>
        <ul className="list-group list-group-flush">
          {files.map((file, idx) => (
            <DownloadItem
              key={idx}
              removeFile={() => remove(file.downloadId)}
              {...file}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

const DownloadItem = ({ name, file, filename, removeFile, flag}) => {
   let [flagStatus, setFlag] = useState(true);

  const [downloadInfo, setDownloadInfo] = useState({
    pause: false,
    progress: 0,
    completed: false,
    total: 0,
    loaded: 0,
    key: filename,
    resume: true
  });

  const pauseClicked  =  (flag) => {
    if(flag == 'pause') setFlag(false);
    else setFlag(true);
    ipcRenderer.send("send-data-event-name", file, filename, flag);
  }



  useEffect(() => {
 /*   const options = {
      onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;

        setDownloadInfo({
          progress: Math.floor((loaded * 100) / total),
          loaded,
          total,
          completed: false,
        });
      },
    };*/


    ipcRenderer.on(filename, (event, arg) => {

      if(arg == 'Exist'){
        setDownloadInfo({
          progress: 100,
          completed: 'Exist'
        })
      }else{
        if(arg && arg.progress){
          setDownloadInfo({
            progress: arg.progress,
            loaded: arg.downloadedBytes,
            total: arg.totalBytes,
            completed: arg.progress == 100 ? true: false,
            key: filename
          });
        }

      }
    });

    ipcRenderer.send("send-data-event-name", file, filename, 'start');
    
    
  }, []);

  const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-12 d-flex">
          <div className="d-inline font-weight-bold text-truncate">{name}</div>

          <div className="d-inline ml-2">
            <small>
              {downloadInfo.loaded > 0 && (
                <>
                  <span className="text-success">
                    {formatBytes(downloadInfo.loaded)}
                  </span>
                  / {formatBytes(downloadInfo.total)}
                </>
              )}
              {downloadInfo.loaded === 0 && <>Initializing...</>}
            </small>
          </div>
          <div className="d-inline ml-2 ml-auto">
            {downloadInfo.completed && downloadInfo.completed != 'Exist' && (
              <span className="text-success">
                Completed <FontAwesomeIcon icon="check-circle" />
              </span>
            )}
            {downloadInfo.completed == 'Exist' && (
                <span className="text-success">
                Already Downloaded <FontAwesomeIcon icon="check-circle" />

              </span>
            )}
          </div>
        </div>
        <div className="col-12 mt-2">
          <div className="row"><div className="col-10">
            <ProgressBar
                variant="success"
                now={(downloadInfo.progress).toFixed(2)}
                striped={true}
                label={`${(downloadInfo.progress).toFixed(2)}%`}
                  key = {downloadInfo.filename}
            /></div>
            <div className="col-2 trash-icon">
              {flagStatus && !downloadInfo.completed?<span className={'iconColorBlue'} title="Pause" onClick={() => pauseClicked('pause')}> <FontAwesomeIcon icon="fa-solid fa-circle-pause" size="lg"/></span>:''}
              <span className={'marginAdd'}></span>
              {flagStatus? '':<span  className={'iconColorBlue'} title="Resume" onClick={() =>  pauseClicked('play')}> <FontAwesomeIcon icon="fa-solid fa-play" size="lg"/></span>}
              <span className={'marginAdd'}></span>
              <span  className={'iconColorRed'} title="Delete" onClick={() => removeFile()}> <FontAwesomeIcon icon="fa-solid fa-trash" size="lg"/> </span>
            </div> </div>
        </div>
      </div>
    </li>
  );
};

export default Downloader;
