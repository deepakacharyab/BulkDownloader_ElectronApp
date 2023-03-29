import React from "react";
import Header from "../../components/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useFileDownloader from "../../hooks/useFileDownloader";
import ExternalInfo from "../../components/ExternalInfo";
import logo from '../../NASA_logo.svg';
import background from '../../eds1.png';
import files from '../../const/input'

// const { ipcRenderer } = window.require("electron");




// const files3 = [
//   {
//     name: "Link 1",
//     file:"https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/VHRMC.nc",
//     filename: "VHRMC.nc",
//   },
//   {
//     name: "Link 2",
//     file: "https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/VHRSC.nc",
//     filename: "VHRSC.nc",
//   },
//   {
//     name: "Link 3",
//     file:"https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_ER2_20200205_R0",
//     filename: "IMPACTS_MetNav_ER2_20200205_R0",
//   },
//   {
//     name: "Link 4",
//     file:
//         "https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_ER2_20200207_R0",
//     filename: "IMPACTS_MetNav_ER2_20200207_R0",
//   },
//   {
//     name: "Link 5",
//     file:"https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_ER2_20200225_R0",
//     filename: "IMPACTS_MetNav_ER2_20200225_R0",
//   },
//   {
//     name: "Link 6",
//     file: "https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_P3B_20200112_R0",
//     filename: "IMPACTS_MetNav_P3B_20200112_R0",
//   },
//   {
//     name: "Link 7",
//     file: "https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_P3B_20200118_R1",
//     filename: "IMPACTS_MetNav_P3B_20200118_R1",
//   },
//   {
//     name: "Link 8",
//     file: "https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_P3B_20200125_R1",
//     filename: "IMPACTS_MetNav_P3B_20200125_R1",
//   },
//   {
//     name: "Link 9",
//     file:"https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/impacts/flight_track/IMPACTS_MetNav_P3B_20200218_R0",
//     filename: "IMPACTS_MetNav_P3B_20200218_R0",
//   },
// ];

const FileDownloader = () => {

  const [downloadFile, downloaderComponentUI] = useFileDownloader();

  const download = (file) => {downloadFile(file)};

  const dee = (file) => {
    download(file);
  }

  const sendData = (file) => {
    if(file && file.length > 0){
      console.log('file file ->', file)

    }
   else{
      console.log('dddddd',[file])
    }
    dee(file);
    var links = [
      "https://i.imgur.com/xineeuw.jpg",
      "https://i.imgur.com/RguiWa6.jpg",
      "https://i.imgur.com/JR4Z0aD.jpg",
      "https://i.imgur.com/ccvEJO1.jpg",
      "https://i.imgur.com/yqZoShd.jpg"
    ];

  /* if(file && file.length > 0)
     ipcRenderer.send("send-data-event-name", file);
   else{
     ipcRenderer.send("send-data-event-name", [file]);
   }*/
  };

  


console.log(files());
  return (
    <>
      <div className='logo-size'>
        <img src ={logo} alt="NASA"/>
        <Header title="EarthData BulkDownloader" />
      </div>

      <div className="container">
          <div className="row">
          <div className="col-md-5">
            <div className="demo-content">
              {files().map((file, idx) => (
                  <div className="col" key={idx}>
                    <div className="card ">
                      <div className="card-body" key={idx}>
                        <h5 className="card-title">{file.name}
                          {<a
                              className="btn btn-primary cursor-pointer text-white btn-right"
                              onClick={() => sendData(file) }
                          ><FontAwesomeIcon icon="download" />

                          </a>}
                        </h5>
                      </div>

                    </div>
                  </div>
              ))}
            </div>
          </div>
          <div className="col-md-7">
            <div className="demo-content bg-alt">
              {downloaderComponentUI}
            </div>
          </div>
        </div>
        <a
            className="btn btn-primary cursor-pointer text-white"
            onClick={() => sendData(files()) }
        > Download All <FontAwesomeIcon icon="download" /></a>
      </div>
    </>
  );
};

export default FileDownloader;
