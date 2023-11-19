// https://dqsljvtekg760.cloudfront.net/{songId}/{revisionId}/{image}/{trackNumber}.json
// https://www.songsterr.com/api/video-points/{songId}/{revisionId}/list

const SERVER_URL = "http://localhost:8080";

export async function getSongData(songId, revisionId, image, trackNumber) {
    const songData = await fetch(SERVER_URL + `/song-data?songId=${songId}&revisionId=${revisionId}&image=${image}&trackNumber=${trackNumber}`);

    if (!songData.ok) {
        return undefined;
    }

    return await songData.json();
}

export async function searchSong(query, limit=5) {
    const searchResults = await fetch(SERVER_URL + `/song-search?query=${encodeURIComponent(query)}&limit=${limit}`);

    if (!searchResults.ok) {
        return undefined;
    }

    return await searchResults.json();
}

export async function getSongMetadata(songId) {
    const songMetadata = await fetch(SERVER_URL + `/song-metadata?songId=${songId}`);

    if (!songMetadata.ok) {
        return undefined;
    }

    return await songMetadata.json();
}