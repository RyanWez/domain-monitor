import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTabValue = () => {
    switch (location.pathname) {
      case '/': return 0;
      case '/settings': return 1;
      case '/reports': return 2;
      case '/users': return 3;
      default: return 0;
    }
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0: navigate('/'); break;
      case 1: navigate('/settings'); break;
      case 2: navigate('/reports'); break;
      case 3: navigate('/users'); break;
      default: break;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Domain Monitor
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Tabs value={getTabValue()} onChange={handleTabChange}>
            <Tab label="Dashboard" />
            <Tab label="Settings" />
            <Tab label="Reports" />
            {user?.permissions?.includes('manage_users') && (
              <Tab label="Users" />
            )}
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        {children}
      </Container>
    </Box>
  );
}

export default Layout;