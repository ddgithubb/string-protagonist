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

    // const filteredSongs = mockSearchResults.filter(result =>
    //   result.title.concat(" - ".concat(result.artist)).toLowerCase().includes(text.toLowerCase())
    // );

    // setFilteredSongs(filteredSongs);
    // setTrackListShown(false);

    // if (text == "") {
    //   setIsVisible(false);
    // }
    // else {
    //   setIsVisible(true);
    // }
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

  const handleButtonClick = () => {
    inputSongTitle = inputText;
    setInputText("");
    if (inputSongTitle == "") {
      setIsVisible(false);
    }
    else {
      setIsVisible(true);
    }
    setTrackListShown(false);
  };

  return (
    <div className="start-page">
      <div className="start-page-title">
        <img alt="String Protagonist" src="../../public/images/title.png"></img>
      </div>
      <div className="start-page-container">
        <div className="search-container">
          <SongSearchInput inputText={inputText} handleInputChange={handleInputChange} handleCursorIn={handleCursorIn} />
          <ChangeTextButton handleButtonClick={handleButtonClick} />
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
      placeholder="Type your song here"
      variant="outlined"
      size="lg"
      value={inputText}
      onChange={handleInputChange}
      style={{
        margin: '0 auto',
        color: "#FF000090",
        backgroundColor: "#00000050",
        fontSize: "25pt",
        height: "70px",
        width: "700px",
        border: "solid white 1px",
        borderRadius: "15px",
        fontFamily: "roboto",
        fontWeight: "light",
      }}
      sx={{
        input: { textAlign: "center" }
      }}
    >
    </Input>
  );
}

function ChangeTextButton({ handleButtonClick, isVisible }) {
  return (
    <Button onClick={handleButtonClick}
      style={{
        color: "#00000090",
        fontSize: "25px",
        fontFamily: "arial",
        width: "200px",
        height: "65px",
        margin: "auto",
        background: "linear-gradient(30deg, rgba(2,0,36,0.8) 0%, rgba(219,41,2,0.8) 0%, rgba(200,200,40,0.8) 100%)"
      }}>Submit</Button>
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
    <List className={isVisible ? 'fade-in' : 'fade-out'} style={{overflowY: 'auto'}}>
      {trackListShown ? (
        selectedMetadata.tracks.map((track, index) => (
          <ListItem key={index}>
            <ListItemText className="song-list-item">
              {track.name + ', ' + track.instrument}
            </ListItemText>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleTrackSelect(track)}
            >
              Select
            </Button>
          </ListItem>
        ))
      ) : (
        filteredSongs.map((result, index) => (
          <ListItem key={index}>
            <ListItemText className="song-list-item"
              style={{
                color: "#FFDDAA",
                height: "30px",
                background: "linear-gradient(90deg, rgba(2,0,36,0.3) 0%, rgba(100,100,0,0.3) 0%, rgba(200,0,0,0.3) 100%)"
              }}>
              {result.title + ' - ' + result.artist}
            </ListItemText>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleSongSelect(result.songId)}
            >
              Select
            </Button>
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