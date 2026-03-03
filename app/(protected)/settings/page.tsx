'use client';

import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Stack, 
  Switch, 
  FormControlLabel, 
  Divider,
  Alert,
  CircularProgress,
  alpha,
  useTheme
} from "@mui/material";
import { 
  Lock, 
  Shield, 
  Smartphone,
  Key,
  Fingerprint,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useAppwrite } from "@/app/appwrite-provider";
import { ecosystemSecurity } from "@/lib/ecosystem/security";
import { MasterPassModal } from "@/components/overlays/MasterPassModal";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const muiTheme = useTheme();
  const { user } = useAppwrite();
  const [isUnlocked, setIsUnlocked] = useState(masterPassCrypto.isVaultUnlocked());
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isPinSet, setIsPinSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setIsPinSet(ecosystemSecurity.isPinSet());
    
    const interval = setInterval(() => {
      const currentUnlocked = masterPassCrypto.isVaultUnlocked();
      if (currentUnlocked !== isUnlocked) {
        setIsUnlocked(currentUnlocked);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    if (!masterPassCrypto.isVaultUnlocked()) {
      setUnlockModalOpen(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // Ensure ecosystemSecurity is synced with masterPassCrypto's key if needed
      // Actually, both should be using the same underlying logic, but we need to make sure 
      // ecosystemSecurity has the masterKey loaded.
      
      const success = await ecosystemSecurity.setupPin(pin);
      if (success) {
        toast.success("Quick Unlock PIN set successfully!");
        setIsPinSet(true);
        setPin("");
        setConfirmPin("");
      } else {
        toast.error("Failed to setup PIN. Please ensure vault is unlocked.");
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    masterPassCrypto.lockNow();
    setIsUnlocked(false);
    toast.success("Vault Locked");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.03em' }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5, fontWeight: 500 }}>
        Manage your security preferences and application behavior.
      </Typography>

      <Stack spacing={4}>
        {/* Security Section */}
        <Box>
          <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
            SECURITY & ENCRYPTION
          </Typography>
          
          <Paper sx={{ 
            p: 4, 
            borderRadius: '32px', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)'
          }}>
            <Stack spacing={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)' }}>Vault Session</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.6 }}>Your current encryption status</Typography>
                </Box>
                <Button 
                  variant={isUnlocked ? "outlined" : "contained"}
                  onClick={() => isUnlocked ? handleLock() : setUnlockModalOpen(true)}
                  color={isUnlocked ? "inherit" : "primary"}
                  startIcon={isUnlocked ? <Lock size={18} /> : <Shield size={18} />}
                  sx={{ 
                    borderRadius: '14px', 
                    px: 3, 
                    py: 1, 
                    fontWeight: 700,
                    borderWidth: '2px',
                    '&:hover': { borderWidth: '2px' }
                  }}
                >
                  {isUnlocked ? "Lock Vault" : "Unlock Vault"}
                </Button>
              </Box>

              <Divider sx={{ opacity: 0.05 }} />

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)', mb: 1 }}>Quick Unlock (PIN)</Typography>
                <Typography variant="body2" sx={{ opacity: 0.6, mb: 4 }}>
                  Enable a 4-digit PIN for instant access between sessions. PINs are stored only on this device and wrapped by your Master Encryption Key.
                </Typography>

                <Box component="form" onSubmit={handleSetPin} sx={{ maxWidth: 360 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        type="password"
                        placeholder="New PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        variant="filled"
                        inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 800, letterSpacing: '0.5em' } }}
                        InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
                      />
                      <TextField
                        fullWidth
                        type="password"
                        placeholder="Confirm"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        variant="filled"
                        inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 800, letterSpacing: '0.5em' } }}
                        InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
                      />
                    </Box>
                    <Button 
                      fullWidth
                      variant="contained" 
                      type="submit"
                      disabled={loading || pin.length !== 4 || pin !== confirmPin}
                      sx={{ 
                        borderRadius: '16px', 
                        py: 1.8, 
                        fontWeight: 800,
                        bgcolor: isPinSet ? alpha('#00F0FF', 0.1) : 'primary.main',
                        color: isPinSet ? '#00F0FF' : 'black',
                        border: isPinSet ? '1px solid rgba(0, 240, 255, 0.3)' : 'none',
                        '&:hover': { bgcolor: isPinSet ? alpha('#00F0FF', 0.2) : alpha('#00F0FF', 0.8) }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : (isPinSet ? "Update Quick Unlock PIN" : "Setup Quick Unlock PIN")}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Preferences Section */}
        <Box>
          <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
            PREFERENCES
          </Typography>
          <Paper sx={{ 
            p: 4, 
            borderRadius: '32px', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)'
          }}>
            <Stack spacing={1}>
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Auto-Lock Session</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Lock vault after 15 minutes of inactivity</Typography>
                  </Box>
                }
                sx={{ justifyContent: 'space-between', width: '100%', ml: 0, flexDirection: 'row-reverse', py: 1 }}
              />
              <Divider sx={{ opacity: 0.05 }} />
              <FormControlLabel
                control={<Switch color="primary" />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Clipboard Auto-Clear</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Clear copied passwords after 30 seconds</Typography>
                  </Box>
                }
                sx={{ justifyContent: 'space-between', width: '100%', ml: 0, flexDirection: 'row-reverse', py: 1 }}
              />
            </Stack>
          </Paper>
        </Box>

        {/* Danger Zone */}
        <Box sx={{ pt: 2 }}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: '32px', 
            bgcolor: alpha('#FF4D4D', 0.02), 
            border: '1px solid rgba(255, 77, 77, 0.1)',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF4D4D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertTriangle size={20} /> Danger Zone
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6, mb: 3 }}>
              Once you reset your master password, all currently stored local data will be wiped to protect your privacy.
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Trash2 size={18} />}
              sx={{ borderRadius: '14px', fontWeight: 700, borderColor: alpha('#FF4D4D', 0.3) }}
            >
              Reset Vault & Wipe Data
            </Button>
          </Paper>
        </Box>
      </Stack>

      <MasterPassModal 
        isOpen={unlockModalOpen}
        onClose={() => {
          setUnlockModalOpen(false);
          setIsUnlocked(masterPassCrypto.isVaultUnlocked());
        }}
      />
    </Box>
  );
}
