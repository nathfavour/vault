import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus, 
  X, 
  Save, 
  Globe, 
  Tag as TagIcon, 
  FileText, 
  User, 
  Lock,
  ChevronDown
} from "lucide-react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  IconButton, 
  InputAdornment, 
  Box, 
  Typography, 
  Divider,
  alpha,
  useTheme,
  Grid
} from "@mui/material";
import { createCredential, updateCredential } from "@/lib/appwrite";
import type { Credentials } from "@/types/appwrite";
import { useAppwrite } from "@/app/appwrite-provider";
import { generateRandomPassword } from "@/utils/password";

export default function CredentialDialog({
  open,
  onClose,
  initial,
  onSaved,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Credentials | null;
  onSaved: () => void;
  prefill?: { name?: string; url?: string; username?: string };
}) {
  const { user } = useAppwrite();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [customFields, setCustomFields] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        username: initial.username || "",
        password: initial.password || "",
        url: initial.url || "",
        notes: initial.notes || "",
        tags: initial.tags ? initial.tags.join(", ") : "",
      });
      setCustomFields(
        initial.customFields ? JSON.parse(initial.customFields) : [],
      );
    } else {
      setForm({
        name: prefill?.name || "",
        username: prefill?.username || "",
        password: "",
        url: prefill?.url || "",
        notes: "",
        tags: "",
      });
      setCustomFields([]);
    }
  }, [initial, open, prefill]);

  const handleGeneratePassword = () => {
    setForm({ ...form, password: generateRandomPassword(16) });
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: Date.now().toString(), label: "", value: "" },
    ]);
  };

  const updateCustomField = (
    id: string,
    field: "label" | "value",
    value: string,
  ) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, [field]: value } : cf)),
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const credentialData: Omit<
        Credentials,
        "$id" | "$createdAt" | "$updatedAt"
      > = {
        userId: user.$id,
        itemType: initial?.itemType || "login",
        name: form.name.trim(),
        url: null,
        username: form.username.trim(),
        notes: null,
        totpId: initial?.totpId || null,
        cardNumber: initial?.cardNumber || null,
        cardholderName: initial?.cardholderName || null,
        cardExpiry: initial?.cardExpiry || null,
        cardCVV: initial?.cardCVV || null,
        cardPIN: initial?.cardPIN || null,
        cardType: initial?.cardType || null,
        folderId: initial?.folderId || null,
        tags: null,
        customFields: null,
        faviconUrl: null,
        isFavorite: initial?.isFavorite || false,
        isDeleted: initial?.isDeleted || false,
        deletedAt: initial?.deletedAt || null,
        lastAccessedAt: initial?.lastAccessedAt || null,
        passwordChangedAt: initial?.passwordChangedAt || null,
        password: form.password.trim(),
        createdAt:
          initial && initial.createdAt
            ? initial.createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        $sequence: 0,
        $collectionId: "",
        $databaseId: "",
        $permissions: [],
      };
      if (form.url && form.url.trim()) credentialData.url = form.url.trim();
      if (form.notes && form.notes.trim())
        credentialData.notes = form.notes.trim();
      if (form.tags && form.tags.trim()) {
        const tagsArr = form.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (tagsArr.length > 0) credentialData.tags = tagsArr;
      }
      if (customFields.length > 0)
        credentialData.customFields = JSON.stringify(customFields) as string;

      if (initial && initial.$id) {
        await updateCredential(initial.$id, credentialData);
      } else {
        await createCredential(credentialData);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || "Failed to save credential.");
    }
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          px: 3, 
          pt: 3, 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'white', fontFamily: 'var(--font-space-grotesk)' }}>
                {initial ? "EDIT CREDENTIAL" : "NEW CREDENTIAL"}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Secure vault entry
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.08)' } }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              fullWidth
              placeholder="Application or Service name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { 
                    fontSize: '1.25rem', 
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: 'white',
                    fontFamily: 'var(--font-space-grotesk)',
                    padding: 0,
                    '&::placeholder': {
                        opacity: 0.2,
                    }
                },
              }}
            />

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 2.5, borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <TextField
                fullWidth
                label="USERNAME / EMAIL"
                placeholder="identity@whisperr.net"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                variant="filled"
                size="small"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={16} strokeWidth={2} color="rgba(255, 255, 255, 0.3)" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }
                }}
                InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' } }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  label="PASSWORD"
                  type={showPassword ? "text" : "password"}
                  placeholder="Secret key"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  variant="filled"
                  size="small"
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={16} strokeWidth={2} color="rgba(255, 255, 255, 0.3)" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }
                  }}
                  InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' } }}
                />
                <IconButton 
                  onClick={handleGeneratePassword}
                  sx={{ 
                    bgcolor: 'rgba(0, 245, 255, 0.1)', 
                    color: '#00F5FF',
                    borderRadius: '10px',
                    width: 48,
                    height: 48,
                    alignSelf: 'flex-end',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    '&:hover': { bgcolor: 'rgba(0, 245, 255, 0.2)' }
                  }}
                >
                  <RefreshCw size={20} strokeWidth={2} />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                label="WEBSITE URL"
                type="url"
                placeholder="https://vault.whisperr.net"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                variant="filled"
                size="small"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Globe size={16} strokeWidth={2} color="rgba(255, 255, 255, 0.3)" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }
                }}
                InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' } }}
              />

              <TextField
                fullWidth
                label="TAGS"
                placeholder="work, personal, production"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                variant="filled"
                size="small"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon size={16} strokeWidth={2} color="rgba(255, 255, 255, 0.3)" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }
                }}
                InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' } }}
              />

              <TextField
                fullWidth
                label="NOTES"
                multiline
                rows={3}
                placeholder="Security parameters and context..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                variant="filled"
                size="small"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <FileText size={16} strokeWidth={2} color="rgba(255, 255, 255, 0.3)" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }
                }}
                InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.3)' } }}
              />
            </Box>

            {/* Custom Fields */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Custom Attributes
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={14} strokeWidth={2} />}
                  onClick={addCustomField}
                  sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#00F5FF', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(0, 245, 255, 0.05)' } }}
                >
                  ADD FIELD
                </Button>
              </Box>
              
              {customFields.map((field) => (
                <Box key={field.id} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Attribute"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem' } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem' } }}
                  />
                  <IconButton onClick={() => removeCustomField(field.id)} size="small" sx={{ color: 'rgba(255, 77, 77, 0.4)', '&:hover': { color: '#FF4D4D' } }}>
                    <X size={16} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>

          {error && (
            <Typography color="error" variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 3, gap: 1.5, bgcolor: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button 
            onClick={onClose} 
            sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 800,
                letterSpacing: '0.05em',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: '12px', 
              fontWeight: 900,
              letterSpacing: '0.05em',
              fontSize: '0.7rem',
              bgcolor: '#00F5FF',
              color: 'black',
              textTransform: 'uppercase',
              boxShadow: '0 8px 20px rgba(0, 245, 255, 0.2)',
              '&:hover': {
                  bgcolor: '#00D1DA',
                  boxShadow: '0 12px 28px rgba(0, 245, 255, 0.3)',
              },
              '&.Mui-disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {loading ? "SAVING..." : initial ? "UPDATE ENTRY" : "COMMIT TO VAULT"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
