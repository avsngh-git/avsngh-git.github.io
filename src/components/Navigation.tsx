import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { useEffect, useState } from "react";

import { portfolio } from "../content/portfolio";
import { useThemeMode } from "../theme/theme";

const navItems = [
  ["About", "about"],
  ["Expertise", "expertise"],
  ["History", "history"],
  ["Projects", "projects"],
  ["Contact", "contact"],
] as const;

export function Navigation({
  linkSectionsToHome = false,
}: {
  linkSectionsToHome?: boolean;
}) {
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkFor = (section: string) =>
    linkSectionsToHome ? `/#${section}` : `#${section}`;

  const links = (
    <>
      {navItems.map(([label, section]) => (
        <Button key={section} component="a" href={linkFor(section)}>
          {label}
        </Button>
      ))}
      <Button
        className="resume-nav-link"
        component="a"
        href={portfolio.resumeUrl}
        target="_blank"
        rel="noreferrer"
      >
        Résumé
      </Button>
    </>
  );

  return (
    <Box className="navigation-shell">
      <AppBar
        component="nav"
        id="navigation"
        className={`navbar-fixed-top${scrolled ? " scrolled" : ""}`}
        elevation={scrolled ? 3 : 0}
      >
        <Toolbar className="navigation-bar">
          <a className="site-mark" href="/" aria-label="Avinash Singh — home">
            AS
          </a>
          <Box className="navigation-actions">
            <Box sx={{ display: { xs: "none", md: "flex" } }}>{links}</Box>
            <IconButton
              color="inherit"
              aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
              onClick={toggleMode}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box
          className="navigation-bar-responsive"
          role="navigation"
          aria-label="Mobile navigation"
          sx={{ width: 280 }}
        >
          <p className="mobile-menu-top">Navigate</p>
          <Divider />
          <List>
            {navItems.map(([label, section]) => (
              <ListItem key={section} disablePadding>
                <ListItemButton
                  component="a"
                  href={linkFor(section)}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton
                component="a"
                href={portfolio.resumeUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ListItemText primary="Résumé" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
