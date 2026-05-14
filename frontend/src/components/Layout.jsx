import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return <>
    <header className="topbar">
      <Link className="brand" to="/">PollPulse</Link>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/create">Create poll</NavLink>
        {user ? <button onClick={logout}>Log out {user.name}</button> : <NavLink to="/login">Log in</NavLink>}
      </nav>
    </header>
    <main className="shell">
      <Outlet />
    </main>
  </>;
}
