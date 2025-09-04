// App.jsx
import React from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import Login from './Login';
import AgencyDashboard from './AgencyDashboard';
import { logoutAction } from './actions';
import AdminDashboard from './components/AdminDashboard';

const AppContent = () => {
  const { isAuthenticated } = useSelector(state => state);
  const dispatch = useDispatch();

  const handleLoginSuccess = () => {
    // No need to do anything here as redux state handles it
  };

  const handleLogout = () => {
    dispatch(logoutAction());
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <button 
            onClick={handleLogout}
            className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
          <AgencyDashboard />
        </div>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <AdminDashboard />
  </Provider>
);

// const App = () => {
//   return (
//     <AdminDashboard />
//   )
// }
export default App;