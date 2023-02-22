import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { LocalVideo } from './LocalVideo'

const VideoHome = () => {
    const [roomValid, setRoomValid] = useState(false)
    const [roomName, setRoomName] = useState("");

    const navigate = useNavigate();

    const validateRoom = (e: any) => {
        {

            console.log(e.target.value.split('\t').length > 1);
            if ((e.target.value && e.target.value.split(' ').length > 1) || (e.target.value === "")) {
                e.target.value = "Please add valid room id without space"
            }
            else {
                setRoomName(e.target.value)
                setRoomValid(true)
            }

        }
    }
    return (
        <>
            <LocalVideo />
            <label>Room Name</label>
            <div className="input-group mb-3">
                <input type="text" className={"form-control"} onBlur={validateRoom} />
                <button onClick={() => { localStorage.setItem('room', roomName); navigate('/video-room') }} disabled={!roomValid} className='btn btn-primary'>Join Room</button>
            </div>
        </>
    )
}

export default VideoHome