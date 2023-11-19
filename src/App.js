import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StartPage } from './views/StartPage';
import { Game } from './views/Game'; 
import { End } from './views/End';

function App() {

    useEffect(() => {
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/game/:songId/:revisionId/:image/:trackNumber" element={<Game />} />
                <Route path="/end" element={<End />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
