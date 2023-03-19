import { useState, useMemo, Suspense } from 'react'
import { FilesViewer } from './FilesViewer'
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./components/FontawsomeIcons";
const fs = window.require('fs')
const pathModule = window.require('path')

function App() {
    return (
        <Router>
            <Suspense fallback={<div>Loading...</div>}>
                <Switch>

                    <Route path="/" exact>
                        <Home />
                    </Route>
                    <Route>
                    </Route>
                </Switch>
            </Suspense>
        </Router>
    );
}

export default App;
