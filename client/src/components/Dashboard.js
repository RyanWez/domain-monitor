import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  PlayArrow as PlayArrowIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

function Dashboard() {
  const { user } = useAuth();
  const [domains, setDomains] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', url: '', group_id: '' });
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' });
  const [checkingDomains, setCheckingDomains] = useState(new Set());
  const [checkingGroups, setCheckingGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchDomains();
    fetchGroups();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDomains();
      fetchGroups();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/api/domains');
      setDomains(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch domains');
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleAddDomain = () => {
    setEditingDomain(null);
    setFormData({ name: '', url: '', group_id: '' });
    setDialogOpen(true);
  };

  const handleEditDomain = (domain) => {
    setEditingDomain(domain);
    setFormData({ name: domain.name, url: domain.url, group_id: domain.group_id || '' });
    setDialogOpen(true);
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupFormData({ name: '', description: '' });
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({ name: group.name, description: group.description || '' });
    setGroupDialogOpen(true);
  };

  const handleDeleteDomain = async (id) => {
    if (window.confirm('Are you sure you want to delete this domain?')) {
      try {
        await axios.delete(`/api/domains/${id}`);
        fetchDomains();
      } catch (err) {
        setError('Failed to delete domain');
      }
    }
  };

  const handleSaveDomain = async () => {
    try {
      if (editingDomain) {
        await axios.put(`/api/domains/${editingDomain.id}`, formData);
      } else {
        await axios.post('/api/domains', formData);
      }
      setDialogOpen(false);
      fetchDomains();
    } catch (err) {
      setError('Failed to save domain');
    }
  };

  const handleCheckNow = async (domainId) => {
    setCheckingDomains(prev => new Set([...prev, domainId]));
    try {
      await axios.post(`/api/domains/${domainId}/check`);
      fetchDomains();
    } catch (err) {
      setError('Failed to check domain');
    } finally {
      setCheckingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const getStatusChip = (status) => {
    if (status === 'up') {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Up"
          color="success"
          size="small"
        />
      );
    } else if (status === 'down') {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="Down"
          color="error"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          label="Unknown"
          color="default"
          size="small"
        />
      );
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'url', headerName: 'URL', width: 300 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value)
    },
    {
      field: 'response_time',
      headerName: 'Response Time',
      width: 130,
      renderCell: (params) => params.value ? `${params.value}ms` : '-'
    },
    {
      field: 'uptime_percentage',
      headerName: 'Uptime',
      width: 100,
      renderCell: (params) => `${params.value || 0}%`
    },
    {
      field: 'last_checked',
      headerName: 'Last Checked',
      width: 180,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : '-'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Check Now">
            <IconButton
              size="small"
              onClick={() => handleCheckNow(params.row.id)}
              disabled={checkingDomains.has(params.row.id)}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditDomain(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteDomain(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        await axios.put(`/api/groups/${editingGroup.id}`, groupFormData);
      } else {
        await axios.post('/api/groups', groupFormData);
      }
      setGroupDialogOpen(false);
      fetchGroups();
    } catch (err) {
      setError('Failed to save group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this group? Domains in this group will be moved to Ungrouped.')) {
      try {
        await axios.delete(`/api/groups/${id}`);
        fetchGroups();
        fetchDomains();
      } catch (err) {
        setError('Failed to delete group');
      }
    }
  };

  const handleCheckGroup = async (groupId) => {
    setCheckingGroups(prev => new Set([...prev, groupId]));
    try {
      await axios.post(`/api/groups/${groupId}/check`);
      fetchDomains();
      fetchGroups();
    } catch (err) {
      setError('Failed to check group domains');
    } finally {
      setCheckingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  // Group domains by group_id
  const groupedDomains = domains.reduce((acc, domain) => {
    const groupId = domain.group_id || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(domain);
    return acc;
  }, {});

  // Get group info for each group
  const groupsWithInfo = groups.map(group => {
    const domainsInGroup = groupedDomains[group.id] || [];
    const upCount = domainsInGroup.filter(d => d.status === 'up').length;
    const downCount = domainsInGroup.filter(d => d.status === 'down').length;
    
    return {
      ...group,
      domains: domainsInGroup,
      upCount,
      downCount
    };
  });

  // Add ungrouped domains as a special "group"
  const ungroupedDomains = groupedDomains.ungrouped || [];
  const ungroupedUpCount = ungroupedDomains.filter(d => d.status === 'up').length;
  const ungroupedDownCount = ungroupedDomains.filter(d => d.status === 'down').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Domain Dashboard
        </Typography>
        <Box>
          {user?.permissions?.includes('add_group') && (
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={handleAddGroup}
              sx={{ mr: 1 }}
            >
              Add Group
            </Button>
          )}
          {user?.permissions?.includes('add_domain') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddDomain}
            >
              Add Domain
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="grouped" label="Grouped View" />
          <Tab value="list" label="List View" />
        </Tabs>
      </Box>

      {viewMode === 'grouped' ? (
        <Box>
          {/* Ungrouped domains */}
          {ungroupedDomains.length > 0 && (
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="h6">
                    Ungrouped Domains ({ungroupedDomains.length})
                  </Typography>
                  <Box>
                    {ungroupedUpCount > 0 && (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label={`${ungroupedUpCount} Up`} 
                        color="success" 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                    )}
                    {ungroupedDownCount > 0 && (
                      <Chip 
                        icon={<ErrorIcon />} 
                        label={`${ungroupedDownCount} Down`} 
                        color="error" 
                        size="small" 
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <DataGrid
                  rows={ungroupedDomains}
                  columns={columns}
                  autoHeight
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  sx={{ border: 'none' }}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {/* Grouped domains */}
          {groupsWithInfo.map(group => (
            <Accordion key={group.id} defaultExpanded={group.downCount > 0} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {group.name} ({group.domains.length})
                    </Typography>
                    {group.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {group.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {group.upCount > 0 && (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label={`${group.upCount} Up`} 
                        color="success" 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                    )}
                    {group.downCount > 0 && (
                      <Chip 
                        icon={<ErrorIcon />} 
                        label={`${group.downCount} Down`} 
                        color="error" 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                    )}
                    <Tooltip title="Check All Domains in Group">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckGroup(group.id);
                        }}
                        disabled={checkingGroups.has(group.id)}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Group">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGroup(group);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Group">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {group.domains.length > 0 ? (
                  <DataGrid
                    rows={group.domains}
                    columns={columns}
                    autoHeight
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectionOnClick
                    sx={{ border: 'none' }}
                  />
                ) : (
                  <Typography color="text.secondary">No domains in this group</Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={domains}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={loading}
            disableSelectionOnClick
          />
        </Box>
      )}

      {/* Domain Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDomain ? 'Edit Domain' : 'Add New Domain'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Domain Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL"
            fullWidth
            variant="outlined"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Group</InputLabel>
            <Select
              value={formData.group_id}
              label="Group"
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
            >
              <MenuItem value="">
                <em>None (Ungrouped)</em>
              </MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDomain} variant="contained">
            {editingDomain ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGroup ? 'Edit Group' : 'Add New Group'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={groupFormData.name}
            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            value={groupFormData.description}
            onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveGroup} variant="contained">
            {editingGroup ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;