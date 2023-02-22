import { useState } from 'react'
import { Route, Router, Routes } from 'react-router-dom'
import './App.css'
import { LocalVideo } from './components/LocalVideo'
import VideoHome from './components/VideoHome'
import VideoRoom from './components/VideoRoom'


function App() {


  return (
    <div className="App">

      <Routes>
        <Route
          path='/'
          element={<VideoHome />}
        />
        <Route
          path='/video-room'
          element={<VideoRoom />}
        />
      </Routes>






    </div >
  )
}

export default App
