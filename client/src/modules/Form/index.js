import Button from "../../components/Button";
import Input from "../../components/Input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const Form = ({ isSignInPage = false }) => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    ...(!isSignInPage && { name: "" }),
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    console.log("data", data);
    e.preventDefault();
    const res = await fetch(
      `http://localhost:8003/api/${isSignInPage ? "login" : "register"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (res.status == 400) {
      alert("Invalid credential");
    } else {
      if (isSignInPage) {
        const responseData = await res.json();
        console.log("responseData", responseData);
        console.log("responseData", responseData.user);
        if (responseData.token) {
          localStorage.setItem("user:token", responseData.token);
          localStorage.setItem(
            "user:detail",
            JSON.stringify(responseData.user)
          );
          navigate("/");
        }
      }
      else{
        alert("User Registered Successfully");
        navigate("/");
      }
    }
  };

  console.log("data", data);
  return (
    <div className="bg-light h-screen flex justify-center items-center">
      <div className="bg-white w-[600px] h-[700px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold">
          Welcome {isSignInPage && "Back"}
        </div>
        <div className="text-2xl font-light mb-10">
          {isSignInPage ? "Sign In" : "Sign Up"}
        </div>
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="w-full flex flex-col items-center"
        >
          {!isSignInPage && (
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              className="mb-6"
              value={data?.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          )}
          <Input
            label="Email"
            name="email"
            placeholder="Enter your email"
            className="mb-6"
            type="email"
            value={data?.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            className="mb-8"
            value={data?.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isSignInPage ? "Sign In" : "Sign Up"}
            className="w-1/2 mb-2"
            type="submit"
          />
        </form>
        <div>
          {isSignInPage
            ? "Didn't have an account?"
            : "Already have an account?"}
          <span
            className="text-primary cursor-pointer underline mx-1"
            onClick={() =>
              navigate(`/user/${isSignInPage ? "signup" : "signin"}`)
            }
          >
            {isSignInPage ? "Sign Up" : "Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
};
export default Form;
