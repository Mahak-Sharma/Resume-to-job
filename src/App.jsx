import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./HomePage.jsx";
import Login from "./Login.jsx";
import Signup from "./SignUp.jsx";
import Data from "./Resume-data/Data.jsx";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/SignUp" element={<Signup />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Resume-data/Data" element={<Data />} />
      </Routes>
    </Router>
  );
};
export default App;
