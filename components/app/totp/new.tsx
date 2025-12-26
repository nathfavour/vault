"use client";

import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  Typography, 
  FormControlLabel, 
  Checkbox,
  Grid,
  CircularProgress
} from "@mui/material";
import { createTotpSecret, updateTotpSecret } from "@/lib/appwrite";
import { useAppwrite } from "@/app/appwrite-provider";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function NewTotpDialog({
  open,
  onClose,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: {
    $id?: string;
    issuer?: string | null;
    accountName?: string | null;
    secretKey?: string;
    period?: number | null;
    digits?: number | null;
    algorithm?: string | null;
    folderId?: string | null;
  };
}) {
  const { user } = useAppwrite();
  const [form, setForm] = useState({
    issuer: "",
    accountName: "",
    secretKey: "",
    folderId: "",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        issuer: initialData.issuer || "",
        accountName: initialData.accountName || "",
        secretKey: initialData.secretKey || "",
        folderId: initialData.folderId || "",
        algorithm: initialData.algorithm || "SHA1",
        digits: initialData.digits || 6,
        period: initialData.period || 30,
      });
    } else {
      setForm({
        issuer: "",
        accountName: "",
        secretKey: "",
        folderId: "",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");
      if (initialData && initialData.$id) {
        await updateTotpSecret(initialData.$id, {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        toast.success("TOTP code updated!");
      } else {
        await createTotpSecret({
          userId: user.$id,
          ...form,
          url: null,
          tags: null,
          isFavorite: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          $sequence: 0,
          $collectionId: "",
          $databaseId: "",
          $permissions: [],
        });
        toast.success("TOTP code added!");
      }
      onClose();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(
        err.message || `Failed to ${initialData ? "update" : "add"} TOTP code.`,
      );
    }
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          maxWidth: '450px',
          width: '100%'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)', pt: 3 }}>
          {initialData ? "Edit" : "Add"} TOTP Code
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            fullWidth
            label="Issuer"
            placeholder="e.g. Google, GitHub"
            value={form.issuer}
            onChange={(e) => setForm({ ...form, issuer: e.target.value })}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
              }
            }}
          />
          <TextField
            fullWidth
            label="Account Name"
            placeholder="e.g. user@example.com"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
              }
            }}
          />
          <TextField
            fullWidth
            label="Secret Key"
            placeholder="Enter the base32 secret"
            value={form.secretKey}
            onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
              }
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={showAdvanced} 
                onChange={(e) => setShowAdvanced(e.target.checked)}
                sx={{ color: 'rgba(255, 255, 255, 0.3)', '&.Mui-checked': { color: 'primary.main' } }}
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Advanced Settings</Typography>}
          />

          {showAdvanced && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Digits"
                  type="number"
                  value={form.digits}
                  disabled
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.01)',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Period (s)"
                  type="number"
                  value={form.period}
                  disabled
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.01)',
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={onClose}
            sx={{ borderRadius: '12px', py: 1.2 }}
          >
            Cancel
          </Button>
          <Button 
            fullWidth 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (initialData ? "Save Changes" : "Add TOTP")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
