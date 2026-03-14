"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppwriteVault } from "@/context/appwrite-context";
import { MasterPassModal } from "@/components/overlays/MasterPassModal";
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper,
  alpha,
  useTheme
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";

export default function MasterPassPage() {
  const [showModal, setShowModal] = useState(false);
  const { user, isAuthReady, openIDMWindow } = useAppwriteVault();
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 3
    }}>
      <MasterPassModal isOpen={true} onClose={() => router.replace("/dashboard")} />
    </Box>
  );
}
