import React, { useState, useContext } from "react";
import AuthLayout from "../../components/layout/AuthLayout";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/inputs";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import uploadImage from "../../utils/uploadImage";
import { UserContext } from "../../context/userContext";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  // Handle SignUp Form Submit
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!fullName) {
      setError("Please enter a full name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
    setIsLoading(true);

    let profileImageUrl = "";

    try {
      // 1. Upload profile image if selected
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }

      // 2. Register user
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName.trim(),
        email: email.trim(),
        password,
        profileImageUrl,
        adminInviteToken: adminInviteToken ? adminInviteToken.trim() : undefined,
      });

      const { token, role } = response.data;

      if (token) {
        login(response.data, token);

        // Redirect based on role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-lg mx-auto md:mx-0 flex flex-col justify-center">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Create an Account
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">
          Join us today by entering your details below.
        </p>

        <form onSubmit={handleSignUp} className="w-full flex flex-col">
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="John Doe"
              type="text"
            />

            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
            />

            <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Min 8 Characters"
              type="password"
            />

            <Input
              value={adminInviteToken}
              onChange={({ target }) => setAdminInviteToken(target.value)}
              label="Admin Invite Token"
              placeholder="6 Digit Code (Optional)"
              type="text"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs pb-2.5 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer my-2 shadow-sm ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 text-center sm:text-left">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Log In
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;