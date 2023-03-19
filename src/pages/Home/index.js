import React from "react";
const FileDownloader = React.lazy(() => import("../../pages/FileDownloader"));
const Home = () => {
    return (
        <FileDownloader/>
    );
};

export default Home;



// npm i yarn