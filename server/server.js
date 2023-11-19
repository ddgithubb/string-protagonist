import express from 'express';
import { searchSong, getSongMetadata, getSongData } from './api.js';

const app = express();

const port = process.env.PORT || 8080;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/song-search', async (req, res) => {
    const { query, limit } = req.query;

    let searchResults = undefined;
    try {
       searchResults = await searchSong(query, limit);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error');
        return;
    }

    if (!searchResults) {
        res.status(404).send('Not found');
        return;
    }

    res.json(searchResults);
});

app.get('/song-metadata', async (req, res) => {
    const { songId } = req.query;

    let songMetadata = undefined;
    try {
        songMetadata = await getSongMetadata(songId);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error');
        return;
    }

    if (!songMetadata) {
        res.status(404).send('Not found');
        return;
    }

    res.json(songMetadata);
});

app.get('/song-data', async (req, res) => {
    const { songId, revisionId, image, trackNumber } = req.query;

    let songData = undefined;
    try {
        songData = await getSongData(songId, revisionId, image, trackNumber);
    } catch (e) {
        console.log(e);
        res.status(500).send('Internal server error');
        return;
    }

    if (!songData) {
        res.status(404).send('Not found');
        return;
    }

    res.json(songData);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});