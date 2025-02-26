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

// const API_URL = 'http://localhost:5000';
const API_URL = 'https://hulumoya2.zapto.org';

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

const fetchData = async () => {
  const { data } = await axios.get(`${API_URL}/home`);
  return {
    services: data['services'],
    categories: data['serviceCategories'], // Assuming 'category' is the key in your API response
  };
};

const AdminDashboard = () => {
  const [selectedIcons, setSelectedIcons] = useState({});

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });

  const handleIconChange = (id, type) => (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/png') {
      setSelectedIcons((prev) => ({
        ...prev,
        [`${type}-${id}`]: {
          file,
          preview: URL.createObjectURL(file),
          type, // Store the type (service or category)
        },
      }));
    } else {
      alert('Please select a PNG file');
    }
  };

  const handleRemoveIcon = (id, type) => () => {
    setSelectedIcons((prev) => {
      const newIcons = { ...prev };
      delete newIcons[`${type}-${id}`];
      return newIcons;
    });
  };

  const handleUpload = async () => {
    const serviceFormData = new FormData();
    const categoryFormData = new FormData();

    Object.entries(selectedIcons).forEach(([key, iconData]) => {
      const [type, id] = key.split('-');
      if (type === 'service') {
        serviceFormData.append(id, iconData.file);
      } else if (type === 'category') {
        categoryFormData.append(id, iconData.file);
      }
    });

    try {
      const servicePromise =
        serviceFormData.entries().next().done === false
          ? axios.post(`${API_URL}/admin/icons`, serviceFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          : Promise.resolve();
      const categoryPromise =
        categoryFormData.entries().next().done === false
          ? axios.post(`${API_URL}/admin/category-icons`, categoryFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          : Promise.resolve();

      await Promise.all([servicePromise, categoryPromise]);
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
              Icons Management (Services & Categories)
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {isPending ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
          ) : error ? (
            <Typography color="error">Error loading data: {error.message}</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Services Section */}
              <Box>
                <Typography variant="h5" gutterBottom>
                  Services
                </Typography>
                {data.services.map((service) => (
                  <Card key={service.id} sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: 3, mb: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ minWidth: 100 }}>
                        {service.icon ? (
                          <PreviewImage
                            src={`${API_URL}/uploads/${service.icon}`}
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
                        {selectedIcons[`service-${service.id}`] ? (
                          <>
                            <PreviewImage
                              src={selectedIcons[`service-${service.id}`].preview}
                              alt="Preview"
                            />
                            <IconButton
                              color="error"
                              onClick={handleRemoveIcon(service.id, 'service')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <label htmlFor={`icon-upload-service-${service.id}`}>
                            <UploadInput
                              accept="image/png"
                              id={`icon-upload-service-${service.id}`}
                              type="file"
                              onChange={handleIconChange(service.id, 'service')}
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
              </Box>

              {/* Categories Section */}
              <Box>
                <Typography variant="h5" gutterBottom>
                  Categories
                </Typography>
                {data.categories.map((category) => (
                  <Card key={category.id} sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: 3, mb: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ minWidth: 100 }}>
                        {category.icon ? (
                          <PreviewImage
                            src={`${API_URL}/uploads/${category.icon}`}
                            alt={category.name}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No Icon
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" color="primary">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || 'No description'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {selectedIcons[`category-${category.id}`] ? (
                          <>
                            <PreviewImage
                              src={selectedIcons[`category-${category.id}`].preview}
                              alt="Preview"
                            />
                            <IconButton
                              color="error"
                              onClick={handleRemoveIcon(category.id, 'category')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <label htmlFor={`icon-upload-category-${category.id}`}>
                            <UploadInput
                              accept="image/png"
                              id={`icon-upload-category-${category.id}`}
                              type="file"
                              onChange={handleIconChange(category.id, 'category')}
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
              </Box>

              {/* Upload Button */}
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