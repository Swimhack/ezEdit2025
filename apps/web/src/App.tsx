import './styles/brand.css';
import './styles/globals.css';
import React, { useEffect } from 'react';
import { ThemeProvider } from './components/ui/theme-provider';
import { ThemeToggle } from './components/ui/theme-toggle';
import { Container } from './components/ui/container';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './components/ui/navigation-menu';

export default function App() {
  // Debug logging to help diagnose rendering issues
  useEffect(() => {
    console.log('App component mounted successfully');
    console.log('Environment:', import.meta.env.MODE);
    
    // Add very minimal debug element only during development
    if (import.meta.env.DEV) {
      const debugEl = document.createElement('div');
      debugEl.style.position = 'fixed';
      debugEl.style.bottom = '10px';
      debugEl.style.right = '10px';
      debugEl.style.zIndex = '9999';
      debugEl.style.background = 'rgba(0,0,0,0.5)';
      debugEl.style.color = 'white';
      debugEl.style.padding = '3px 8px';
      debugEl.style.borderRadius = '4px';
      debugEl.style.fontFamily = 'monospace';
      debugEl.style.fontSize = '10px';
      debugEl.textContent = `DEV `;
      document.body.appendChild(debugEl);
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="ezedit-theme-preference">
      <div className="min-h-screen bg-background font-sans antialiased">
        <header className="border-b sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Container>
            <div className="flex h-16 items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">Ez</span>
                <span className="text-2xl font-medium">Edit.co</span>
              </div>
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                      href="#">
                      Features
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                      href="#">
                      Pricing
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                      href="#">
                      Docs
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">Log in</Button>
                <Button size="sm">Sign up</Button>
                <ThemeToggle />
              </div>
            </div>
          </Container>
        </header>

        <main>
          <section className="py-12 md:py-16 lg:py-20">
            <Container>
              <div className="flex flex-col items-center text-center space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                  Edit Legacy Websites with <span className="text-primary">AI-Powered</span> Simplicity
                </h1>
                <p className="text-xl text-muted-foreground max-w-[42rem]">
                  Connect to any website via FTP/SFTP and update your code using
                  natural language prompts. Secure, fast, and incredibly simple.
                </p>
                
                <div className="w-full max-w-md flex flex-col space-y-4 pt-4">
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="email" placeholder="Enter your email" />
                    <Button>Get Invite</Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button size="lg">Get Started for Free</Button>
                    <Button variant="outline" size="lg">Watch Demo</Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
                <Card>
                  <CardHeader>
                    <CardTitle>Easy Connection</CardTitle>
                    <CardDescription>Connect to any FTP/SFTP site in seconds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Simply enter your credentials and ezEdit handles the rest, with secure credential storage and automated reconnection.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Powered Editing</CardTitle>
                    <CardDescription>Let AI handle the complex code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Describe what you want to change in plain English, and our AI assistant will generate and apply the code changes for you.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Instant Preview</CardTitle>
                    <CardDescription>See changes before you commit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Preview your changes in real-time before publishing, ensuring your website looks exactly as you expect.</p>
                  </CardContent>
                </Card>
              </div>
            </Container>
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}
