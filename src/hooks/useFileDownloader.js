import Downloader from "../components/Downloader";
import React, { useState } from "react";
import { v4 as uuid } from "uuid";
const { ipcRenderer } = window.require("electron");



const useFileDownloader = () => {
  const [files, setFiles] = useState(() => []);

  const download = (file) =>
    setFiles((fileList) => [...fileList, { ...file, downloadId: uuid() }]);

  const remove = (removeId) =>{
    setFiles((files) => [
      ...files.filter((file) => file.downloadId !== removeId),
    ]);

    const val = [
      ...files.filter((file) => file.downloadId === removeId),
    ]
    for(var i = 0; i < val.length; i++)
      ipcRenderer.send("delete", val[i].filename);

  }


  return [
    (e) => {console.log('e',e);

    if( e && e.length > 0) {
      for(var i=0; i < e.length; i++){
        download(e[i]);
      }
    } else download(e) },
      <Downloader files={files} remove={(e) => remove(e)} />
  ];
};

export default useFileDownloader;
