"use client";

import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/app/providers";
import Link from "next/link";
import { useAppwrite } from "@/app/appwrite-provider";
import { Button, Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Divider, Tooltip } from "@mui/material";
import { useState } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import PasswordGenerator from "@/components/ui/PasswordGenerator";
import { useAI } from "@/app/context/AIContext";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout, openIDMWindow } = useAppwrite();
  const { openAIModal } = useAI();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();

  const isCorePage = [
    "/dashboard",
    "/credentials",
    "/totp",
    "/settings",
    "/import",
    "/sharing",
    "/overview"
  ].some(path => pathname?.startsWith(path));

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit' }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="Whisperrkeep Logo"
            sx={{ h: 32, w: 32, borderRadius: 1, objectFit: 'contain' }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              display: { xs: 'none', sm: 'inline' },
              fontFamily: 'var(--font-space-grotesk)'
            }}
          >
            Whisperrkeep
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && isCorePage && (
            <Tooltip title="AI Assistant">
              <IconButton
                onClick={openAIModal}
                sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(0, 240, 255, 0.1)' } }}
              >
                <SparklesIcon style={{ width: 20, height: 20 }} />
              </IconButton>
            </Tooltip>
          )}

          <IconButton
            onClick={() => {
              const nextTheme =
                theme === "light"
                  ? "dark"
                  : theme === "dark"
                    ? "system"
                    : "light";
              setTheme(nextTheme);
            }}
          >
            {theme === "light" && <SunIcon style={{ width: 20, height: 20 }} />}
            {theme === "dark" && <MoonIcon style={{ width: 20, height: 20 }} />}
            {theme === "system" && <ComputerDesktopIcon style={{ width: 20, height: 20 }} />}
          </IconButton>

          <DropdownMenu
            trigger={
              <IconButton title="Password Generator">
                <KeyIcon style={{ width: 20, height: 20 }} />
              </IconButton>
            }
            width="400px"
            align="right"
          >
            <Box sx={{ p: 2 }}>
              <PasswordGenerator />
            </Box>
          </DropdownMenu>

          {!user ? (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                try {
                  openIDMWindow();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to open authentication");
                }
              }}
              sx={{ borderColor: 'divider' }}
            >
              Connect
            </Button>
          ) : (
            <Box>
              <Button
                variant="text"
                size="small"
                onClick={handleOpenMenu}
                startIcon={<UserIcon style={{ width: 16, height: 16 }} />}
                sx={{ color: 'text.primary' }}
              >
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {user.name || user.email}
                </Typography>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user.name || user.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem component={Link} href="/settings" onClick={handleCloseMenu}>
                  <Typography variant="body2">Account Settings</Typography>
                </MenuItem>
                <MenuItem
                  sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}
                  onClick={() => {
                    import("@/app/(protected)/masterpass/logic").then(({ masterPassCrypto }) => {
                      masterPassCrypto.lockNow();
                      sessionStorage.setItem("masterpass_return_to", window.location.pathname);
                      window.location.replace("/masterpass");
                    });
                    handleCloseMenu();
                  }}
                >
                  <ShieldCheckIcon style={{ width: 16, height: 16 }} />
                  <Typography variant="body2">Lock now</Typography>
                </MenuItem>
                <MenuItem
                  onClick={async () => {
                    handleCloseMenu();
                    await logout();
                  }}
                  sx={{ color: 'error.main', gap: 1 }}
                >
                  <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
