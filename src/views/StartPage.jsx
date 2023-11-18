import './StartPage.css';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/joy/Typography';
import React, { useState } from 'react';

const mockSearchResults = [
    {
        songId: "0",
        title: "Title0",
        artist: "Artist0",
        tracks:[
            {
                trackNumber: 0,
                name: 'Name0',
                instrument: 'Instrument0',
            },
            {
                trackNumber: 1,
                name: 'Name1',
                instrument: 'Instrument1',
            },
            {
                trackNumber: 2,
                name: 'Name2',
                instrument: 'Instrument2',
            }
        ]
    },
    {
        songId: "1",
        title: "Title1",
        artist: "Artist1",
        tracks:[
            {
                trackNumber: 0,
                name: 'Name0',
                instrument: 'Instrument0',
            },
            {
                trackNumber: 1,
                name: 'Name1',
                instrument: 'Instrument1',
            },
            {
                trackNumber: 2,
                name: 'Name2',
                instrument: 'Instrument2',
            }
        ]
    },
    {
        songId: "2",
        title: "Title2",
        artist: "Artist2",
        tracks:[
            {
                trackNumber: 0,
                name: 'Name0',
                instrument: 'Instrument0',
            },
            {
                trackNumber: 1,
                name: 'Name1',
                instrument: 'Instrument1',
            },
            {
                trackNumber: 2,
                name: 'Name2',
                instrument: 'Instrument2',
            }
        ]
    },
    {
        songId: "3",
        title: "Title3",
        artist: "Artist3",
        tracks:[
            {
                trackNumber: 0,
                name: 'Name0',
                instrument: 'Instrument0',
            },
            {
                trackNumber: 1,
                name: 'Name1',
                instrument: 'Instrument1',
            },
            {
                trackNumber: 2,
                name: 'Name2',
                instrument: 'Instrument2',
            }
        ]
    },
]

export function StartPage() {
  let inputSongTitle="";
  let selectedSongTitle="";
  let selectedSongID=0;
  const [inputText, setInputText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [trackListShown, setTrackListShown] = useState(false);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleButtonClick = () => {
    inputSongTitle=inputText;
    setInputText("");
    setIsVisible(false);
    if (trackListShown){
        setTrackListShown(false);
    }
    const filteredSongs = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(inputSongTitle.toLowerCase())
      );
  
    setFilteredSongs(filteredSongs);

  };

    return (
        <div className="start-page">
            <div className="start-page-title">
                <p>
                    STRING PROTAGONIST
                </p>
            </div>
            <div className="start-page-container">
                <div className="search-container">
                    <SongSearchInput inputText={inputText} handleInputChange={handleInputChange} isVisible={true} />
                    <ChangeTextButton handleButtonClick={handleButtonClick} isVisible={true}/>
                </div>

                <div className="song-list">
                    <SongList isVisible={!isVisible} filteredSongs={filteredSongs} 
                        selectedSongID={selectedSongID} selectedSongTitle={selectedSongTitle}
                            trackListShown={trackListShown} setTrackListShown={setTrackListShown}/>
                </div>
            </div>
        </div>
    );
}

function SongSearchInput({ inputText, handleInputChange, isVisible, handleSelect}) {
    return (
      <Input
        type="text"
        placeholder="Type Song Name"
        value={inputText}
        onChange={handleInputChange}
        className={isVisible ? '' : 'fade-out'}
      >
    </Input>
    );
  }
  
  function ChangeTextButton({ handleButtonClick, isVisible}) {
    return (
      <Button onClick={handleButtonClick}
      className={isVisible ? '' : 'fade-out'}
      >Submit</Button>
    );
  }

  function SongList({isVisible, filteredSongs, selectedSongID, selectedSongTitle, trackListShown,
    setTrackListShown}){

    const [trackList, setTrackList]= useState(filteredSongs)
 

    const handleSongSelect= (tracks) =>{
        setTrackList(tracks)
        setTrackListShown(true);
    }

    const handleTrackSelect=(track) =>{
        console.log(track.name);
    }

    const cancelTrackSelect=()=>{
        setTrackListShown(false);
    }
    return (
      <List className={isVisible ? 'fade-in' : 'fade-out'}>
        {trackListShown ? (
          trackList.map((track, index) => (
            <React.Fragment key={track.name}>
              <ListItem>
                <ListItemText className="song-list-item">
                  {track.name + ',' + track.instrument}
                </ListItemText>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleTrackSelect(track)}
                >
                  Select
                </Button>
              </ListItem>
              {index < trackList.length - 1 && <hr className="custom-divider" />}
            </React.Fragment>
          ))
        ) : (
          filteredSongs.map((result, index) => (
            <React.Fragment key={result.songId}>
              <ListItem>
                <ListItemText className="song-list-item">
                  {result.title + ',' + result.artist}
                </ListItemText>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleSongSelect(result.tracks)}
                >
                  Select
                </Button>
              </ListItem>
              {index < filteredSongs.length - 1 && <hr className="custom-divider" />}
            </React.Fragment>
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