import { MAX_LEADERBOARD_SIZE } from './config.js'
import JSONdb from 'simple-json-db'

const db = new JSONdb('./database/leaderboards.json')

export function getLeaderboardID(songId, revisionId, image, trackNumber) {
    return `${songId}-${revisionId}-${image}-${trackNumber}`
}

export function getLeaderboard(songId, revisionId, image, trackNumber) {
    return db.get(getLeaderboardID(songId, revisionId, image, trackNumber)) || []
}

export function addToLeaderboard(songId, revisionId, image, trackNumber, name, score) {
    const leaderboardID = getLeaderboardID(songId, revisionId, image, trackNumber)
    const leaderboard = db.get(leaderboardID) || []
    leaderboard.push({ name, score, timestamp: Date.now() })
    leaderboard.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)

    if (leaderboard.length > MAX_LEADERBOARD_SIZE) {
        leaderboard.pop()
    }

    db.set(leaderboardID, leaderboard)

    return leaderboard
}