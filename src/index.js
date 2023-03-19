import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";

import "./index.css";
import reducers from "./reducers";
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TagManager from 'react-gtm-module'

import App from './App'


let createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
let store = createStoreWithMiddleware(reducers);

ReactDOM.render(
    <Provider store={store}>
        <DndProvider backend={HTML5Backend}>
            <App />
        </DndProvider>
    </Provider>,
    document.getElementById("root")
);
