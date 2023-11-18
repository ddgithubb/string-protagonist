import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StartPage } from './views/StartPage';
import { Game } from './views/Game'; 

function App() {

    useEffect(() => {
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
