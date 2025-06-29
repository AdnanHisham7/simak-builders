import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService"; // your existing function
import { clearUser } from "../../store/slices/authSlice";

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
