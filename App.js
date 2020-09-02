import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Button, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';
import { t } from './i18n/index'
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';

export default function App() {
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();
  const [cachedRemotePC, setCachedRemotePC] = useState();
  const [isAcceptCall, setIsAcceptCall] = useState(false);
  const [isCall, setIsCall] = useState(false)
  const [remotePC, setRemotePc] = useState()
  const [localPC, setLocalPc] = useState()
  const [configuration] = useState({ iceServers: [{ url: 'stun:stun.l.google.com:19302' }] })
  const [langue,setLangue]=useState("en")


  //access to the data stream of audio
  const startLocalStream = async () => {
    // isFront will determine if the initial camera should face user or environment
    const isFront = true;
    const devices = await mediaDevices.enumerateDevices();
    const facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(device => device.kind === 'videoinput' && device.facing === facing);
    //  const audioSourceId = devices.find(device => device.kind === 'audioinput');

    const facingMode = isFront ? 'user' : 'environment';
    const constraints = {
      audio: true,
      //video:false,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    };
    const newStream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(newStream);
  };

  const startCall = async () => {
    const localPC = new RTCPeerConnection(configuration);
    const remotePC = new RTCPeerConnection(configuration);




    //share network information to establish a direct connection
    // listen to the event icecandidate ,if iCE candidate  found then pass it to the ICE agent of their RTCPeerConnection object.
    localPC.onicecandidate = e => {
      try {
        if (e.candidate) {
          remotePC.addIceCandidate(e.candidate);
        }
      } catch (err) {
        console.error(`Error adding remotePC iceCandidate: ${err}`);
      }
    };
    remotePC.onicecandidate = e => {
      try {
        // console.log('remotePC icecandidate:', e.candidate);
        if (e.candidate) {
          localPC.addIceCandidate(e.candidate);
        }
      } catch (err) {
        console.error(`Error adding localPC iceCandidate: ${err}`);
      }
    };
    remotePC.onaddstream = e => {
      if (e.stream && remoteStream !== e.stream) {
        setRemoteStream(e.stream);
      }
    };


    //exchanged the media data, and notified each other that they want to start a video chat
    localPC.addStream(localStream);
    try {
      //localpc create offer
      const offer = await localPC.createOffer();
      await localPC.setLocalDescription(offer);
      setLocalPc(localPC)
      // console.log('remotePC, setRemoteDescription');
      //remotPc receive the offer and sets it as the remote description
      await remotePC.setRemoteDescription(localPC.localDescription);
      setRemotePc(remotePC)
      setIsCall(true)

    } catch (err) {
      console.error(err);
    }
    setCachedLocalPC(localPC);
    setCachedRemotePC(remotePC);

  };

  useEffect(() => {
    //user accept call
    if (isAcceptCall) {
      createAnswerFromRemotPc(localPC, remotePC)
      setIsAcceptCall(false)
      setIsCall(false)
    }
  }, [isAcceptCall])


  const createAnswerFromRemotPc = async (localPC, remotePC) => {
    console.log("create answer", localPC, remotePC)
    //remetePc create answer 
    const answer = await remotePC.createAnswer();
    //  console.log("answer",answer)
    // console.log(`Answer from remotePC: ${answer.sdp}`);
    // console.log('remotePC, setLocalDescription');
    await remotePC.setLocalDescription(answer);
    // console.log('localPC, setRemoteDescription');
    //localPc receive answer and set it as the remote description
    await localPC.setRemoteDescription(remotePC.localDescription);

  }



  const closeStreams = () => {
    if (isCall) {
      setIsCall(false)
    }
    if (isAcceptCall) {
      setIsAcceptCall(false)
    }
    if (cachedLocalPC) {
      cachedLocalPC.removeStream(localStream);
      cachedLocalPC.close();
    }
    if (cachedRemotePC) {
      cachedRemotePC.removeStream(remoteStream);
      cachedRemotePC.close();
    }
    setLocalStream();
    setRemoteStream();
    setCachedRemotePC();
    setCachedLocalPC();
  };

  const changeLanguage=()=>{
    if(langue=="en"){
      setLangue("fr")
    }
    if(langue=="fr"){
      setLangue("en")
    }
  }

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>

        <View style={{alignItems:'center',marginTop:10}}>
        <Button title={t("changeLanguage",{ locale: langue })} onPress={changeLanguage} />
        </View>

        <View>
          <Text>{t("userLocal",{ locale: langue })}</Text>
        </View>


        <View >
          <View style={styles.containerRtc}>
            {localStream ? <RTCView style={styles.rtc} streamURL={localStream.toURL()} /> :
              <View style={styles.containerUser} />}
            <View style={{ justifyContent: 'center', marginLeft: 30 }}>
              {localStream && <Button title={t("startCall",{ locale: langue })} onPress={startCall} disabled={!!remoteStream} />}
            </View>

          </View>
        </View>

        <View style={{marginTop:50}}>
          <Text>
             {t("remoteUser",{ locale: langue })}
        </Text>
        </View>
        <View style={{ backgroundColor: 'red', alignItems: 'center' }}>

          <View style={styles.containerRtc}>
            {remoteStream ? <RTCView style={styles.rtc} streamURL={remoteStream.toURL()} /> :
              <View style={styles.containerUser}>
              </View>
            }
            {localStream &&
              <View style={{ flexDirection: 'column', justifyContent: 'center', marginLeft: 30 }}>
                <View style={{ marginBottom: 10 }}>
                  <Button title={t("acceptCall",{ locale: langue })} onPress={() => setIsAcceptCall(!isAcceptCall)} disabled={!isCall} />
                </View>
                <Button title={t("stopCall",{ locale: langue })} onPress={closeStreams} disabled={!remoteStream} />
              </View>}

          </View>
        </View>

        <View style={{ marginTop: 30, marginHorizontal: 30 }}>
          {!localStream && <Button title={t("startStream",{ locale: langue })}  onPress={startLocalStream} />}

        </View>

      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    //justifyContent: 'space-between',
    //alignItems: 'center',
    flex: 1

  },
  text: {
    fontSize: 30,
  },
  rtcview: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: 100,
    backgroundColor: 'black',
  },
  rtc: {
    backgroundColor: 'grey',
    height: Dimensions.get('window').height / 4,
    width: Dimensions.get('window').width / 2
  },
  containerRtc: {
    width: Dimensions.get('window').width, flexDirection: 'row', backgroundColor: 'grey', borderColor: 'grey', borderWidth: 1
  },
  containerUser: {
    backgroundColor: 'grey', height: Dimensions.get('window').height / 4, width: Dimensions.get('window').width / 2
  }

});