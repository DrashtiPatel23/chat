import logo from "./logo.svg";
import "./App.css";
import Form from "./modules/Form";
import Dashboard from "./modules/Dashboard";
import { Routes, Route, Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") != null || false;
  if (!isLoggedIn && auth) {
    return <Navigate to={"/user/signin"} />;
  } else if (
    isLoggedIn &&
    ["/user/signin", "/user/signup"].includes(window.location.pathname)
  ) {
    return <Navigate to={"/"} />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute auth={true}>
            <Dashboard />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/user/signin"
        element={
          <ProtectedRoute>
            <Form isSignInPage={true} />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/user/signup"
        element={
          <ProtectedRoute>
            <Form isSignInPage={false} />
          </ProtectedRoute>
        }
      ></Route>
    </Routes>
  );
}

export default App;
