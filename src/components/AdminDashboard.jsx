// src/components/AdminDashboard.js
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';

// Styled Components
const UploadInput = styled('input')({
  display: 'none',
});

const PreviewImage = styled('img')({
  maxWidth: '80px',
  maxHeight: '80px',
  objectFit: 'contain',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
});

const Sidebar = styled(Drawer)({
  width: 240,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 240,
    boxSizing: 'border-box',
    backgroundColor: '#1a2035',
    color: '#ffffff',
  },
});

const fetchServices = async () => {
  const { data } = await axios.get('http://localhost:5000/home');
  return data['services'];
};

const AdminDashboard = () => {
  const [selectedIcons, setSelectedIcons] = useState({});

  const { data: services, isPending, error, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const handleIconChange = (serviceId) => (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/png') {
      setSelectedIcons((prev) => ({
        ...prev,
        [serviceId]: {
          file,
          preview: URL.createObjectURL(file),
        },
      }));
    } else {
      alert('Please select a PNG file');
    }
  };

  const handleRemoveIcon = (serviceId) => () => {
    setSelectedIcons((prev) => {
      const newIcons = { ...prev };
      delete newIcons[serviceId];
      return newIcons;
    });
  };

  const handleUpload = async () => {
    const formData = new FormData();
    Object.entries(selectedIcons).forEach(([serviceId, iconData]) => {
      formData.append(serviceId, iconData.file);
    });

    try {
      await axios.post('http://localhost:5000/admin/icons', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedIcons({});
      refetch();
      alert('Icons uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload icons');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar variant="permanent" anchor="left">
        <Toolbar>
          <Typography variant="h6" noWrap>
            Admin Panel
          </Typography>
        </Toolbar>
        <List>
          {[
            { text: 'Dashboard', icon: <DashboardIcon /> },
            { text: 'Users', icon: <PeopleIcon /> },
            { text: 'Settings', icon: <SettingsIcon /> },
          ].map((item) => (
            <ListItem button key={item.text}>
              <ListItemIcon sx={{ color: '#ffffff' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Sidebar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', color: '#1a2035' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Service Icons Management
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {isPending ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
          ) : error ? (
            <Typography color="error">Error loading services: {error.message}</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {services.map((service) => (
                <Card key={service.id} sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: 3 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ minWidth: 100 }}>
                      {service.icon ? (
                        <PreviewImage
                          src={`http://localhost:5000/uploads/${service.icon}`}
                          alt={service.name}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Icon
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" color="primary">
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {selectedIcons[service.id] ? (
                        <>
                          <PreviewImage
                            src={selectedIcons[service.id].preview}
                            alt="Preview"
                          />
                          <IconButton
                            color="error"
                            onClick={handleRemoveIcon(service.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      ) : (
                        <label htmlFor={`icon-upload-${service.id}`}>
                          <UploadInput
                            accept="image/png"
                            id={`icon-upload-${service.id}`}
                            type="file"
                            onChange={handleIconChange(service.id)}
                          />
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<UploadFileIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Upload PNG
                          </Button>
                        </label>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {Object.keys(selectedIcons).length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    size="large"
                    sx={{ borderRadius: 2, px: 4 }}
                  >
                    Upload Selected Icons
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
