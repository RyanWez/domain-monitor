import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import axios from 'axios';

function Reports() {
  const [domains, setDomains] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filteredDomains, setFilteredDomains] = useState([]);

  useEffect(() => {
    fetchDomains();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchLogs(selectedDomain);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (selectedGroup === '') {
      setFilteredDomains(domains);
    } else if (selectedGroup === 'ungrouped') {
      setFilteredDomains(domains.filter(d => !d.group_id));
    } else {
      setFilteredDomains(domains.filter(d => d.group_id === parseInt(selectedGroup)));
    }
    setSelectedDomain(''); // Reset domain selection when group changes
  }, [selectedGroup, domains]);

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/api/domains');
      setDomains(response.data);
    } catch (err) {
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

  const fetchLogs = async (domainId) => {
    setLogsLoading(true);
    try {
      const response = await axios.get(`/api/domains/${domainId}/logs?limit=200`);
      setLogs(response.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
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
    } else {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="Down"
          color="error"
          size="small"
        />
      );
    }
  };

  const selectedDomainData = filteredDomains.find(d => d.id === selectedDomain);
  const selectedGroupData = groups.find(g => g.id === parseInt(selectedGroup));

  const logColumns = [
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
      field: 'error_message',
      headerName: 'Error Message',
      width: 300,
      renderCell: (params) => params.value || '-'
    },
    {
      field: 'checked_at',
      headerName: 'Checked At',
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString()
    }
  ];

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 1 }} />
          Filter Options
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={12} sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ minWidth: '100%' }}>
              <InputLabel>Select Group</InputLabel>
              <Select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                label="Select Group"
                sx={{ height: '56px' }}
              >
                <MenuItem value="">
                  <em>All Groups</em>
                </MenuItem>
                <MenuItem value="ungrouped">
                  Ungrouped Domains
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name} ({group.domain_count} domains)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={12}>
            <FormControl fullWidth sx={{ minWidth: '100%' }}>
              <InputLabel>Select Domain</InputLabel>
              <Select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                label="Select Domain"
                disabled={filteredDomains.length === 0}
                sx={{ height: '56px' }}
              >
                <MenuItem value="">
                  <em>Select a domain</em>
                </MenuItem>
                {filteredDomains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name} - {domain.url}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {selectedGroup && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedGroup === 'ungrouped' 
                ? `Showing ungrouped domains (${filteredDomains.length} domains)`
                : selectedGroupData 
                  ? `Showing domains from "${selectedGroupData.name}" group (${filteredDomains.length} domains)`
                  : `Showing all domains (${filteredDomains.length} domains)`
              }
            </Typography>
          </Box>
        )}
      </Paper>

      {filteredDomains.length === 0 && selectedGroup && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No domains found in the selected group.
        </Alert>
      )}

      {!selectedDomain && filteredDomains.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a domain to view detailed analytics.
        </Alert>
      )}

      {selectedDomainData && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(selectedDomainData.status)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Uptime Percentage
                  </Typography>
                  <Typography variant="h4" component="div">
                    {selectedDomainData.uptime_percentage || 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Last Response Time
                  </Typography>
                  <Typography variant="h4" component="div">
                    {selectedDomainData.response_time ? `${selectedDomainData.response_time}ms` : '-'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Checks
                  </Typography>
                  <Typography variant="h4" component="div">
                    {selectedDomainData.total_checks || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Check History
            </Typography>
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={logs}
                columns={logColumns}
                pageSize={25}
                rowsPerPageOptions={[25, 50, 100]}
                loading={logsLoading}
                disableSelectionOnClick
              />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}

export default Reports;