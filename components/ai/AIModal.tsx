"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Box, Typography, TextField, Button, IconButton, alpha, CircularProgress } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import { useAI } from "@/app/context/AIContext";
import { toast } from "react-hot-toast";

import { Sparkles, Send, X, Command } from "lucide-react";

export function AIModal({ onClose }: { onClose: () => void }) {
  const { sendCommand, isLoading, openGlobalCreateModal } = useAI();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setResponse(null);
    try {
      const result = await sendCommand(prompt);
      
      if (result.action === "UNKNOWN") {
        setResponse(result.response || "I'm not sure how to help with that.");
      } else {
        handleAction(result);
        setPrompt(""); // clear input on success
      }
    } catch {
      setResponse("Sorry, I couldn't process that request.");
    }
  };

  const handleAction = (cmd: { action: string; data?: unknown }) => {
    const data = cmd.data as { target?: string; name?: string; url?: string } | undefined;
    switch (cmd.action) {
      case "NAVIGATE":
        if (data?.target) {
            const target = data.target.toLowerCase();
            const validPaths = ["/dashboard", "/settings", "/import", "/totp", "/sharing", "/credentials/new"];
            const finalPath = validPaths.find(p => p.includes(target)) || "/dashboard";
            router.push(finalPath);
            onClose();
            toast.success(`Navigating to ${target}...`);
        }
        break;

      case "CREATE_CREDENTIAL":
        try {
            openGlobalCreateModal({ name: data?.name, url: data?.url });
            onClose();
            toast.success("Opening new credential form...");
        } catch {
            const params = new URLSearchParams();
            if (data?.name) params.set("name", data.name);
            if (data?.url) params.set("url", data.url);
            router.push(`/credentials/new?${params.toString()}`);
            onClose();
        }
        break;
        
      case "GENERATE_PASSWORD":
        setResponse("I can't generate the password directly, but I've opened the generator for you.");
        break;
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF', display: 'flex' }}>
                <Sparkles size={20} strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.02em', color: 'white' }}>
                AI COMMANDER
              </Typography>
           </Box>
           <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.08)' } }}>
             <X size={18} strokeWidth={1.5} />
           </IconButton>
        </Box>

        <Box sx={{ 
          p: 3, 
          borderRadius: '20px', 
          bgcolor: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.3)', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OPERATIONAL CAPABILITIES
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              "Add a login for Netflix",
              "Go to my Settings",
              "Organize my vault"
            ].map((text, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Command size={14} color="#00F0FF" strokeWidth={2} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                  &quot;{text}&quot;
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {response && (
          <Box sx={{ 
            p: 2.5, 
            borderRadius: '16px', 
            bgcolor: 'rgba(0, 240, 255, 0.03)', 
            border: '1px solid rgba(0, 240, 255, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, lineHeight: 1.6 }}>
              {response}
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
          <TextField
            fullWidth
            placeholder="Initialize command..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            autoFocus
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { 
                px: 2, 
                py: 1.2,
                borderRadius: '12px', 
                bgcolor: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.9rem',
                color: 'white',
                '&:focus-within': { borderColor: 'rgba(0, 245, 255, 0.3)' }
              },
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading || !prompt.trim()}
            sx={{ 
              minWidth: 48, 
              borderRadius: '12px',
              bgcolor: '#00F0FF',
              color: 'black',
              '&:hover': { bgcolor: '#00D1DA' }
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Send size={18} strokeWidth={2.5} />
            )}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

