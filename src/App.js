import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { StartPage } from './views/StartPage';
function App() {

    useEffect(() => {
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/game" element={<GamePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
