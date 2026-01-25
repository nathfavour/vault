import { useState } from "react";
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  alpha,
  useTheme,
  useMediaQuery
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopyOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVertOutlined";
import PersonIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import TaskIcon from "@mui/icons-material/AssignmentOutlined";
import EventIcon from "@mui/icons-material/EventOutlined";
import NoteIcon from "@mui/icons-material/DescriptionOutlined";
import type { Credentials } from "@/types/appwrite.d";
import { TaskSelectorModal } from "../../common/TaskSelectorModal";
import { EventSelectorModal } from "../../common/EventSelectorModal";
import { NoteSelectorModal } from "../../common/NoteSelectorModal";
import { AppwriteService } from "@/lib/appwrite";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

export default function CredentialItem({
  credential,
  onCopy,
  isDesktop,
  onEdit,
  onDelete,
  onClick,
}: {
  credential: Credentials;
  onCopy: (value: string) => void;
  isDesktop: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copyAnchorEl, setCopyAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleAttach = async (type: 'task' | 'event' | 'note', id: string) => {
    setIsTaskModalOpen(false);
    setIsEventModalOpen(false);
    setIsNoteModalOpen(false);
    
    const tag = `source:whisperrflow:${type}:${id}`;
    const currentTags = credential.tags || [];
    if (currentTags.includes(tag)) return;

    try {
      await AppwriteService.updateCredential(credential.$id, {
        tags: [...currentTags, tag]
      });
      showSuccess(`Attached ${type} successfully`);
    } catch (err) {
      showError(`Failed to attach ${type}`);
    }
  };

  const handleAttachNote = async (noteId: string) => {
    setIsNoteModalOpen(false);
    const tag = `source:whisperrnote:${noteId}`;
    const currentTags = credential.tags || [];
    if (currentTags.includes(tag)) return;

    try {
      await AppwriteService.updateCredential(credential.$id, {
        tags: [...currentTags, tag]
      });
      showSuccess(`Attached note successfully`);
    } catch (err) {
      showError(`Failed to attach note`);
    }
  };

  const handleCopy = (value: string) => {
    onCopy(value);
    setCopyAnchorEl(null);
  };

  const getFaviconUrl = (url: string | null) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(credential.url);

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      onContextMenu={handleRightClick}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: '20px',
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }
      }}
    >
      {/* Icon */}
      <Box sx={{ 
        width: 48, 
        height: 48, 
        borderRadius: '14px', 
        bgcolor: 'rgba(255, 255, 255, 0.03)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden'
      }}>
        {faviconUrl ? (
          <Box component="img" src={faviconUrl} sx={{ width: 28, height: 28 }} />
        ) : (
          <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.2rem' }}>
            {credential.name?.charAt(0)?.toUpperCase() || "?"}
          </Typography>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ ml: 2.5, flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontFamily: '"Space Grotesk", sans-serif' }}>
          {credential.name}
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: 'text.secondary', mt: 0.5 }}>
          {credential.username}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
        {!isMobile ? (
          <>
            <Tooltip title="Copy Username">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopy(credential.username); }} sx={{ color: 'text.secondary' }}>
                <PersonIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy Password">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopy(credential.password); }} sx={{ color: 'primary.main' }}>
                <LockIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }} sx={{ color: 'text.secondary' }}>
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCopyAnchorEl(e.currentTarget); }} sx={{ color: 'primary.main' }}>
              <ContentCopyIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ color: 'text.secondary' }}>
              <MoreVertIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Mobile Copy Menu */}
      <Menu
        anchorEl={copyAnchorEl}
        open={Boolean(copyAnchorEl)}
        onClose={() => setCopyAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundImage: 'none',
            minWidth: '180px'
          }
        }}
      >
        <MenuItem onClick={() => handleCopy(credential.username)}>
          <ListItemIcon><PersonIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Copy Username" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => handleCopy(credential.password)}>
          <ListItemIcon><LockIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Copy Password" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* Mobile More Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundImage: 'none',
            minWidth: '150px'
          }
        }}
      >
        <MenuItem onClick={() => { onEdit(); setAnchorEl(null); }}>
          <ListItemIcon><EditIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Edit" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon sx={{ fontSize: 18, color: theme.palette.error.main }} /></ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
      </Menu>

      {/* Desktop Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundImage: 'none',
            minWidth: '200px'
          }
        }}
      >
        <MenuItem onClick={() => { setIsTaskModalOpen(true); handleContextMenuClose(); }}>
          <ListItemIcon><TaskIcon sx={{ fontSize: 18, color: '#10b981' }} /></ListItemIcon>
          <ListItemText primary="Attach Task (Flow)" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => { setIsEventModalOpen(true); handleContextMenuClose(); }}>
          <ListItemIcon><EventIcon sx={{ fontSize: 18, color: '#10b981' }} /></ListItemIcon>
          <ListItemText primary="Attach Event (Flow)" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => { setIsNoteModalOpen(true); handleContextMenuClose(); }}>
          <ListItemIcon><NoteIcon sx={{ fontSize: 18, color: '#00F5FF' }} /></ListItemIcon>
          <ListItemText primary="Attach Note" primaryTypographyProps={{ fontWeight: 600 }} />
        </MenuItem>
        <Box sx={{ my: 0.5, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
        <MenuItem onClick={() => { onEdit(); handleContextMenuClose(); }}>
          <ListItemIcon><EditIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Edit Item" />
        </MenuItem>
      </Menu>

      <TaskSelectorModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSelect={(id) => handleAttach('task', id)} 
      />
      <EventSelectorModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        onSelect={(id) => handleAttach('event', id)} 
      />
      <NoteSelectorModal 
        isOpen={isNoteModalOpen} 
        onClose={() => setIsNoteModalOpen(false)} 
        onSelect={handleAttachNote} 
      />
    </Paper>
  );
}
