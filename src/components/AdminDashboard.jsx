// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import Alert from '@mui/material/Alert';

const LOCAL_URL = 'http://localhost:5000';
const SERVER_URL = 'https://hulumoya.zapto.org';

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

const FixedUploadContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  right: 0,
  left: 240, // Sidebar width
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end',
}));

const fetchData = async (baseUrl) => {
  const { data } = await axios.get(`${baseUrl}/home`);
  return {
    services: data['services'],
    categories: data['serviceCategories'],
  };
};

const AdminDashboard = () => {
  const [selectedIcons, setSelectedIcons] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [useLocalUrl, setUseLocalUrl] = useState(() => {
    const saved = localStorage.getItem('useLocalUrl');
    return saved ? JSON.parse(saved) : false;
  });

  const API_URL = useLocalUrl ? LOCAL_URL : SERVER_URL;

  useEffect(() => {
    localStorage.setItem('useLocalUrl', JSON.stringify(useLocalUrl));
  }, [useLocalUrl]);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['data', API_URL],
    queryFn: () => fetchData(API_URL),
  });

  const handleUrlToggle = () => {
    setUseLocalUrl(prev => !prev);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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
    if (Object.keys(selectedIcons).length === 0) {
      showSnackbar('No icons selected for upload', 'warning');
      return;
    }

    setIsUploading(true);
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
          ? axios.post(`${API_URL}/admin/service-icons`, serviceFormData, {
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
      showSnackbar('Icons uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      showSnackbar(err.message || 'Failed to upload icons', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // New function to organize services by category
  const organizeServicesByCategory = (services, categories) => {
    const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, services: [] }]));
    const uncategorized = [];

    services.forEach(service => {
      if (service.categoryId && categoryMap.has(service.categoryId)) {
        categoryMap.get(service.categoryId).services.push(service);
      } else {
        uncategorized.push(service);
      }
    });

    const organizedCategories = Array.from(categoryMap.values());
    return { organizedCategories, uncategorized };
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
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Icons Management (Services & Categories)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={useLocalUrl}
                  onChange={handleUrlToggle}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="textSecondary">
                  {useLocalUrl ? 'Using Local URL' : 'Using Server URL'}
                </Typography>
              }
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
          {isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Error loading data: {error.message}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Categories with Services */}
              {(() => {
                const { organizedCategories, uncategorized } = organizeServicesByCategory(
                  data.services,
                  data.categories
                );

                return (
                  <>
                    {/* Categories Section */}
                    {organizedCategories.map((category) => (
                      <Box key={category.id}>
                        <Card sx={{ bgcolor: '#f8f9fa', borderRadius: 2, boxShadow: 2, mb: 3 }}>
                          <CardContent>
                            {/* Category Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                              <Box sx={{ minWidth: 100 }}>
                                {category.icon ? (
                                  <PreviewImage
                                    src={`${API_URL}/uploads/${category.icon}`}
                                    alt={category.categoryName}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No Icon
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" color="primary" gutterBottom>
                                  {category.categoryName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {category.description || 'No description'}
                                </Typography>
                              </Box>
                              <Box>
                                <label htmlFor={`icon-upload-category-${category.id}`}>
                                  <UploadInput
                                    accept="image/png"
                                    id={`icon-upload-category-${category.id}`}
                                    type="file"
                                    onChange={handleIconChange(category.id, 'category')}
                                  />
                                  {selectedIcons[`category-${category.id}`] ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                    </Box>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<UploadFileIcon />}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      Upload Icon
                                    </Button>
                                  )}
                                </label>
                              </Box>
                            </Box>

                            {/* Services within Category */}
                            <Box sx={{ pl: 2 }}>
                              {category.services.map((service) => (
                                <Card
                                  key={service.id}
                                  sx={{
                                    bgcolor: '#ffffff',
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    mb: 2,
                                    border: '1px solid #e0e0e0',
                                  }}
                                >
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
                                    <Box>
                                      <label htmlFor={`icon-upload-service-${service.id}`}>
                                        <UploadInput
                                          accept="image/png"
                                          id={`icon-upload-service-${service.id}`}
                                          type="file"
                                          onChange={handleIconChange(service.id, 'service')}
                                        />
                                        {selectedIcons[`service-${service.id}`] ? (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                          </Box>
                                        ) : (
                                          <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<UploadFileIcon />}
                                            sx={{ borderRadius: 2 }}
                                          >
                                            Upload Icon
                                          </Button>
                                        )}
                                      </label>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}

                    {/* Uncategorized Services Section */}
                    {uncategorized.length > 0 && (
                      <Box>
                        <Typography variant="h5" color="text.secondary" gutterBottom>
                          Uncategorized Services
                        </Typography>
                        {uncategorized.map((service) => (
                          <Card
                            key={service.id}
                            sx={{
                              bgcolor: '#ffffff',
                              borderRadius: 2,
                              boxShadow: 3,
                              mb: 2,
                              border: '1px solid #e0e0e0',
                            }}
                          >
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
                              <Box>
                                <label htmlFor={`icon-upload-service-${service.id}`}>
                                  <UploadInput
                                    accept="image/png"
                                    id={`icon-upload-service-${service.id}`}
                                    type="file"
                                    onChange={handleIconChange(service.id, 'service')}
                                  />
                                  {selectedIcons[`service-${service.id}`] ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                    </Box>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<UploadFileIcon />}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      Upload Icon
                                    </Button>
                                  )}
                                </label>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </>
                );
              })()}
            </Box>
          )}
        </Container>

        {/* Fixed Upload Button */}
        {Object.keys(selectedIcons).length > 0 && (
          <FixedUploadContainer>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              size="large"
              disabled={isUploading}
              sx={{
                borderRadius: 2,
                px: 4,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              {isUploading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Uploading...
                </>
              ) : (
                'Upload Selected Icons'
              )}
            </Button>
          </FixedUploadContainer>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminDashboard;