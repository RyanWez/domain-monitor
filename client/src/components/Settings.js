import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import axios from 'axios';

function Settings() {
  const [settings, setSettings] = useState({
    telegram_bot_token: '',
    telegram_chat_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/api/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/settings/test-telegram');
      setMessage({ type: 'success', text: 'Test notification sent successfully!' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to send test notification' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Telegram Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure Telegram bot settings to receive notifications when domains go down.
            </Typography>

            <TextField
              fullWidth
              label="Telegram Bot Token"
              value={settings.telegram_bot_token || ''}
              onChange={(e) => handleInputChange('telegram_bot_token', e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              sx={{ mb: 2 }}
              helperText="Get this from @BotFather on Telegram"
            />

            <TextField
              fullWidth
              label="Telegram Chat ID"
              value={settings.telegram_chat_id || ''}
              onChange={(e) => handleInputChange('telegram_chat_id', e.target.value)}
              placeholder="-1001234567890"
              sx={{ mb: 3 }}
              helperText="Chat ID of the group or channel to send notifications to"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleTestTelegram}
                disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
              >
                {testing ? 'Testing...' : 'Test Notification'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              How to Setup Telegram
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              <strong>1. Create a Bot:</strong>
              <br />
              Message @BotFather on Telegram and use /newbot command to create a new bot.
            </Typography>

            <Typography variant="body2" paragraph>
              <strong>2. Get Bot Token:</strong>
              <br />
              Copy the bot token provided by BotFather.
            </Typography>

            <Typography variant="body2" paragraph>
              <strong>3. Add Bot to Group:</strong>
              <br />
              Add your bot to the Telegram group where you want to receive notifications.
            </Typography>

            <Typography variant="body2" paragraph>
              <strong>4. Get Chat ID:</strong>
              <br />
              Send a message to the group, then visit:
              <br />
              <code>https://api.telegram.org/bot[BOT_TOKEN]/getUpdates</code>
              <br />
              Look for the "chat" object and copy the "id" value.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;