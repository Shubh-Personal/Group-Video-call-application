import React, { ElementRef, useEffect, useRef, useState } from 'react'

import './styles/localvideo.css'
export const LocalVideo = () => {

    const [localStream, setLocalStream] = useState<MediaStream>();
    const [dtls, setDtls] = useState<MediaDeviceInfo[]>([]);
    const [showVideo, setShowVideo] = useState(true)

    let localVideoRef = useRef<any>(null);

    const getLocalStream = async () => {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(stream)
        let devices = await navigator.mediaDevices.enumerateDevices();
        setDtls(devices)
        return stream;
    }
    useEffect(() => {
        getLocalStream()

        return () => {
            localStream
                ?.getTracks()
                .forEach(stream => stream.stop())
            console.log("calling off");

            setLocalStream(undefined)
        }
    }, []);

    useEffect(
        () => {
            localVideoRef.current.srcObject = localStream
        }, [localStream])

    const addNewStream = async (mediaDevice: MediaDeviceInfo, kind: any) => {


        if (mediaDevice.label.includes('video')) {
            let stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: mediaDevice.deviceId,
                    height: 500,
                    width: 500
                }
            });
            setLocalStream(stream)
        }
    }

    return (
        <div className='fluid-container'>
            <video hidden={!localStream || !showVideo} ref={localVideoRef} autoPlay playsInline muted={true} controls={false} className='video'></video>
            <h1 hidden={!!localStream}>Loading...</h1>
            <button className='btn btn-primary' onClick={() => setShowVideo(!showVideo)}>{showVideo ? "Stop Video" : "Start Video"}</button>
        </div>
    )
}


