import { Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <>
      <header className='App-header'>
        <p className='Title'>
          ChainPerks
        </p>
        <div className="App-Interactions">
          <Link to="/login">
            <button>Login</button>
          </Link>
          <Link to="/sign-in">
            <button>Sign in</button>
          </Link>
          <Link to="/signup">
            <button>Signup</button>
          </Link>
        </div>
      </header>
    </>
  );
}

export default App;
