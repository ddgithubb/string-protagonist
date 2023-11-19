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