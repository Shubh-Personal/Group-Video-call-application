import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

const VideoRoom = () => {

    let roomName = localStorage.getItem('room');
    const socket = io("localhost:5000");
    const [tempObj, setTempObj] = useState<RTCPeerConnection>();
    const [videoCallUsersInRoom, setVideoCallUsersInRoom] = useState<any>([])
    const [localStream, setLocalStream] = useState<MediaStream>()
    const [remoteStream, setRemoteStream] = useState<any>({})
    const [peerConnections, setPeerConnections] = useState<any>({})
    let tempPeerConnections: { [key: string]: any } = {}
    let localSt: MediaStream;
    const navigate = useNavigate();
    const videoRef = useRef<any>()
    const getLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localSt = stream
            setLocalStream(stream);
        } catch (error) {
            console.error(error);
        }
    }

    const stopLocalStream = () => {

        localStream?.getTracks().forEach(track => {
            track.stop()
        })
        setLocalStream(undefined)
    }
    const sendMessage = (eventName: string, data: any) => {
        socket.emit(eventName, { ...data, room: `video-${roomName}` })
    }

    const addNewVideoUser = (data: any) => {
        setVideoCallUsersInRoom([...videoCallUsersInRoom, data])
    }

    const addNewPeerConnection = async (data: any, sendTo: string) => {
        console.log("New peer Connection is set");

        peerConnections[sendTo] = data;
        setPeerConnections(peerConnections)
    }

    const initNewPeer = (data: string) => {
        let peerConnectionObj = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ],
        })

        localSt?.getTracks().forEach(track => {
            peerConnectionObj.addTrack(track, localSt)
        });

        peerConnectionObj.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { from: socket.id, to: data, candidate: event.candidate });
            }
        }

        peerConnectionObj.ontrack = (e) => {
            videoRef.current.srcObject = e.streams[0]
            console.log(videoRef.current.autoplay);

            let newStream: { [key: string]: any } = {}
            newStream[data] = e.streams[0]
            setRemoteStream({ ...remoteStream, newStream })
        }
        return peerConnectionObj;
    }

    const requestConnectionToNewUser = async (data: any) => {
        sendMessage("connect-to-me", { to: data, sender: socket.id })

        let peerConnectionObj = initNewPeer(data)

        let offer = await peerConnectionObj.createOffer()
        await peerConnectionObj.setLocalDescription(offer)

        await addNewPeerConnection(peerConnectionObj, data)
        sendMessage('offer', { offer, to: data, from: socket.id });

    }

    const initPeerConnectionResponse = async ({ offer, from }: any) => {
        let peerConnectionObj = initNewPeer(from)
        setTempObj(peerConnectionObj);
        await peerConnectionObj.setRemoteDescription(offer)
        let answer = await peerConnectionObj.createAnswer()
        await peerConnectionObj.setLocalDescription(answer)

        sendMessage('answer', { answer, to: from, from: socket.id })
    }

    useEffect(() => {
        if (!roomName)
            navigate('/')
    })

    useEffect(() => {
        getLocalStream()

        socket.on('connect', () => {
            sendMessage("room-id", {})
        })

        socket.on('user-connected', ({ id }) => {
            requestConnectionToNewUser(id)
            addNewVideoUser(id)
        })

        socket.on('connect-request', ({ user }) => {
            addNewVideoUser(user)
        })

        socket.on('offer-request', (data) => {
            initPeerConnectionResponse(data)
        })

        socket.on('answer-request', async (data) => {
            console.log(peerConnections);
            await peerConnections[data.from].setRemoteDescription(data.answer);
        })

        socket.on('ice-candidate', ({ to, candidate, from }) => {
            try {
                const pc = peerConnections[from] || peerConnections[to];
                console.log(pc);
                pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });
        return () => {
            socket.off('connect')
            socket.off('user-connected')
            socket.off('connect-request')
            socket.off('offer-request')
            socket.off('answer-request')
            socket.off('ice-candidate')
            stopLocalStream()
        }
    }, []);

    return (
        <>
            <div>Room Name - {roomName}</div> {socket.id}
            <video ref={videoRef} style={{ border: "2px solid black" }} autoPlay={true} muted={true} height="500" width={500}></video>
            {
                videoCallUsersInRoom.map((user: any, i: any) =>
                    <div className='d-block-inline' key={i}>
                        <h3>{i}-{JSON.stringify(user)}</h3>
                    </div>
                )
            }
            <button onClick={() => navigate('/')}>Back</button>
        </>
    )
}

export default VideoRoom