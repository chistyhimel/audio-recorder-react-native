import React, {useEffect, useState} from 'react';
import {Button, FlatList, Text, View} from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  useEffect(() => {
    fetchRecordedAudios();
  }, []);

  useEffect(() => {
    let recordingTimer;
    if (isRecording) {
      recordingTimer = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimer);
    }
    return () => clearInterval(recordingTimer);
  }, [isRecording]);

  useEffect(() => {
    let playbackTimer;
    let isFinishedPlaying = false;

    const handleFinishedPlaying = () => {
      setIsPlaying(false);
      isFinishedPlaying = true;
      clearInterval(playbackTimer); // Stop the timer when playback finishes
    };

    if (isPlaying) {
      playbackTimer = setInterval(() => {
        setPlaybackDuration(prevDuration => prevDuration + 1);
      }, 1000);

      // Listen for the FinishedPlaying event
      SoundPlayer.addEventListener('FinishedPlaying', handleFinishedPlaying);
    } else {
      clearInterval(playbackTimer);
      if (isFinishedPlaying) {
        isFinishedPlaying = false; // Reset the flag
      }
    }

    return () => {
      clearInterval(playbackTimer); // Clear interval when component unmounts
    };
  }, [isPlaying]);

  const fetchRecordedAudios = async () => {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const audioFiles = files.filter(file => file.name.endsWith('.aac'));

      // console.log(
      //   audioRecorderPlayer.mmss(audioRecorderPlayer.getFileInfo(files[0])),
      //   '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      // );
      setRecordedAudios(audioFiles);
    } catch (error) {
      console.log('Error fetching recorded audios:', error);
    }
  };

  const startRecording = async () => {
    const audioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
    };

    try {
      const path = `${RNFS.DocumentDirectoryPath}/audio_${Date.now()}.aac`;
      await audioRecorderPlayer.startRecorder(path, audioSet);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.log('Uh-oh! Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      fetchRecordedAudios();
    } catch (error) {
      console.log('Oops! Failed to stop recording:', error);
    }
  };

  const playAudio = async audioPath => {
    try {
      await SoundPlayer.playUrl(audioPath);
      const soundData = await SoundPlayer.getInfo();
      console.log(soundData);

      setCurrentAudio(audioPath);
      setIsPlaying(true);
      setPlaybackDuration(0); // Reset playback duration
    } catch (error) {
      console.log('Oops! An error occurred while playing audio:', error);
    }
  };

  const stopAudio = async () => {
    try {
      await SoundPlayer.stop();
      setCurrentAudio(null);
      setIsPlaying(false);
    } catch (error) {
      console.log('Oops! An error occurred while stopping audio:', error);
    }
  };

  const renderAudioItem = ({item}) => {
    return (
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginVertical: 5}}>
        <Button title="Play" onPress={() => playAudio(item.path)} />
        <Text style={{marginLeft: 10}}>{item.name}</Text>
        <Text
          style={{marginLeft: 10}}>{`Duration: ${item.duration} seconds`}</Text>
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <View style={{marginBottom: 10}}>
        <Button
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isPlaying} // Disable recording while playing
        />
        {isRecording && (
          <Text>{`Recording Time: ${recordingDuration} seconds`}</Text>
        )}
      </View>
      <FlatList
        data={recordedAudios}
        renderItem={renderAudioItem}
        keyExtractor={item => item.path}
      />
      {currentAudio && (
        <View style={{marginTop: 20}}>
          <Text>{`Playing: ${currentAudio}`}</Text>
          <Button
            title={isPlaying ? 'Stop Playback' : 'Start Playback'}
            onPress={isPlaying ? stopAudio : () => playAudio(currentAudio)}
          />
          {isPlaying && (
            <Text>{`Playback Time: ${playbackDuration} seconds`}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default App;
