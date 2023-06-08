import React, { useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Camera from "./components/Camera";
import ErrorMessage from "./components/ErrorMessage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { BrowserView, MobileView } from "react-device-detect";

function App() {
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <>
      <BrowserView>
        <div className="browser-view-div text-center">
          <h1 className="browser-view-h">
            Esta aplicação foi desenhada para dispositivos móveis. Por favor aceda através de um smartphone para usar a
            Inclu.
          </h1>
        </div>
      </BrowserView>
      <MobileView>
        <Router>
          <div className="App h-100">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/camera/:id" element={<Camera setErrorMessage={setErrorMessage} />} />
              <Route exact path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
            {errorMessage && <ErrorMessage message={errorMessage} />}
          </div>
        </Router>
      </MobileView>
    </>
  );
}

export default App;
