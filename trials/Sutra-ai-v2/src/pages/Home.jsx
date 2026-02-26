import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = false;

  const handleClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/courses");
    }
  };

  return (
    <div>
      <h1>Welcome to Sutra AI</h1>
      <button onClick={handleClick}>Master Training</button>
    </div>
  );
}

export default Home;
