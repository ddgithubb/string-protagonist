import './StartPage.css';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemText from '@mui/material/ListItemText';
import React, { useState } from 'react';
import { getSongMetadata, searchSong } from '../game/api';
import { useNavigate } from 'react-router-dom';

export function StartPage() {
  let inputSongTitle = "";
  let selectedSongTitle = "";
  let selectedSongID = 0;
  const [inputText, setInputText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [trackListShown, setTrackListShown] = useState(false);

  const handleCursorIn = () => {
    if (inputText == "") {
      setIsVisible(false);
    }
  }

  const handleInputChange = (event) => {
    let text = event.target.value;
    setInputText(text);

    searchSong(text).then((songs) => {
      setFilteredSongs(songs);
      setTrackListShown(false);

      if (text == "") {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    });
  };

  return (
    <div className="start-page">
      <div className="start-page-title">
        <img alt="String Protagonist" src="/images/title.png" id="title"></img>
      </div>
      <div className="start-page-container">
        <div className="search-container">
          <SongSearchInput inputText={inputText} handleInputChange={handleInputChange} handleCursorIn={handleCursorIn} />
        </div>

        <div className="song-list">
          <SongList isVisible={isVisible} filteredSongs={filteredSongs}
            selectedSongID={selectedSongID} selectedSongTitle={selectedSongTitle}
            trackListShown={trackListShown} setTrackListShown={setTrackListShown} />
        </div>
      </div>
    </div>
  );
}

function SongSearchInput({ inputText, handleInputChange, handleCursorIn }) {
  return (
    <Input
      type="text"
      className = "search-bar"
      padding="0px"
      placeholder="Type your song here"
      variant = "outlined"
      size="md"
      value={inputText}
      onChange={handleInputChange}
      style={{
       margin: '0 auto',
       color: "#FF000090",
       backgroundColor: "#00000099",
       fontSize: "25pt",
       height: "70px",
       width: "700px",
       border: "solid white 1px",
       borderRadius: "15px",
       fontFamily: "roboto",
       fontWeight: "light",
      }}
      sx={{ input: { textAlign: "center"}
    }}
    >
    </Input>
  );
}

function SongList({ isVisible, filteredSongs, selectedSongID, selectedSongTitle, trackListShown,
  setTrackListShown }) {

  const [selectedMetadata, setSelectedMetadata] = useState(null);
  const navigate = useNavigate();

  const handleSongSelect = (songId) => {
    getSongMetadata(songId).then((metadata) => {
      setSelectedMetadata(metadata);
      setTrackListShown(true);
    });
  }

  const handleTrackSelect = (track) => {
    navigate("/game/" + selectedMetadata.songId + "/" + selectedMetadata.revisionId + "/" + selectedMetadata.image + "/" + track.trackNumber);
  }

  const cancelTrackSelect = () => {
    setTrackListShown(false);
  }
  return (
    <List className={isVisible ? 'fade-in' : 'fade-out'}>
      {trackListShown ? (
        selectedMetadata.tracks.map((track, index) => (
          <ListItem key={index}>
            <ListItemText className="song-list-item"
              onClick={() => handleTrackSelect(track)}
              style={{
                color: "#FFDDAA",
                height: "35px",
                border: "solid white 2px",
                background: "linear-gradient(90deg, rgba(2,0,36,0.34) 0%, rgba(150,100,0,0.34) 0%, rgba(200,0,0,0.34) 100%)"
              }}>
              <p class="trackNames">{track.name + ', ' + track.instrument}</p>
            </ListItemText>
          </ListItem>
        ))
      ) : (
        filteredSongs.map((result, index) => (
          <ListItem key={index}>
            <ListItemText className="song-list-item"
              onClick={() => handleSongSelect(result.songId)}
              style={{
                color: "#FFDDAA",
                height: "30px",
                background: "linear-gradient(90deg, rgba(2,0,36,0.3) 0%, rgba(100,100,0,0.3) 0%, rgba(200,0,0,0.3) 100%)"
              }}>
              <p class="songTitles">{result.title + ' - ' + result.artist}</p>
            </ListItemText>
          </ListItem>
        ))
      )}
      {trackListShown && (
        <Button
          variant="outlined"
          color="primary"
          onClick={cancelTrackSelect}
          className="cancel-track-button"
        >
          Cancel
        </Button>
      )}
    </List>
  );

}