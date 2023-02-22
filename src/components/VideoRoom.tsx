import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

const VideoRoom = () => {

    let roomName = localStorage.getItem('room');
    const socket = io("localhost:5000");

    const [videoCallUsersInRoom, setVideoCallUsersInRoom] = useState<any>([])
    const [localStream, setLocalStream] = useState<MediaStream>()
    const [remoteStream, setRemoteStream] = useState<any>()
    const [peerConnections, setPeerConnections] = useState<any>([])

    const navigate = useNavigate();

    const getLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
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

    const addNewPeerConnection = async (data: any, sendTo: any) => {
        let newData = { data, sendTo };
        setPeerConnections([...peerConnections, newData])
        console.log("Set new PC", peerConnections);
    }

    const initNewPeer = (data: any) => {
        let peerConnectionObj = new RTCPeerConnection()

        localStream?.getTracks().forEach(track => {
            peerConnectionObj.addTrack(track, localStream)
        });

        peerConnectionObj.onicecandidate = () => {

        }

        peerConnectionObj.ontrack = (e) => {
            setRemoteStream({ ...remoteStream, data: e.streams[0] })
        }

        return peerConnectionObj;


    }
    const requestConnectionToNewUser = async (data: any) => {
        sendMessage("connect-to-me", { to: data, sender: socket.id })

        let peerConnectionObj = initNewPeer(data)

        let offer = await peerConnectionObj.createOffer()
        await peerConnectionObj.setLocalDescription(offer)
        await addNewPeerConnection(peerConnectionObj, data)
        await sendMessage('offer', { offer, to: data, from: socket.id });

    }

    const initPeerConnectionResponse = async ({ offer, from }: any) => {
        let peerConnectionObj = initNewPeer(from)
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

        socket.on('answer-request', (data) => {
            console.log(peerConnections);
            console.log(data.from, socket.id);

            // await peerConnection[0].data.setRemoteDescription(data.answer)
        })

        return () => {
            socket.off('connect')
            socket.off('user-connected')
            socket.off('connect-request')
            socket.off('offer-request')
            socket.off('answer-request')
            stopLocalStream()
        }
    }, []);

    return (
        <>
            <div>Room Name - {roomName}</div> {socket.id}
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