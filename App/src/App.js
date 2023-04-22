import React, { useState } from 'react';
import './App.css';
import Home from './components/Home';
import Camera from './components/Camera';
import ErrorMessage from './components/ErrorMessage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {

  const [errorMessage, setErrorMessage] = useState('');

  return (
    <Router>
      <div className="App h-100">
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/camera/:id" element={<Camera setErrorMessage={setErrorMessage} />} />
        </Routes>
        {errorMessage && <ErrorMessage message={errorMessage} />}
      </div>
    </Router>
  );
}

export default App;
