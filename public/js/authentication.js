/**
 * EzEdit Authentication JavaScript
 * Handles login, signup, password reset, and authentication state
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Login
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginRemember = document.getElementById('login-remember');
  const toggleLoginPassword = document.getElementById('toggle-login-password');
  const loginErrorMsg = document.getElementById('login-error');
  
  // DOM Elements - Signup
  const signupForm = document.getElementById('signup-form');
  const signupFirstName = document.getElementById('signup-first-name');
  const signupLastName = document.getElementById('signup-last-name');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const toggleSignupPassword = document.getElementById('toggle-signup-password');
  const signupTerms = document.getElementById('signup-terms');
  const passwordStrength = document.getElementById('password-strength');
  const passwordStrengthBar = document.getElementById('password-strength-bar');
  const signupErrorMsg = document.getElementById('signup-error');
  
  // Initialize authentication
  function initAuthentication() {
    // Check if we're on login page
    if (loginForm) {
      setupLoginEvents();
    }
    
    // Check if we're on signup page
    if (signupForm) {
      setupSignupEvents();
    }
    
    // Check authentication state
    checkAuthState();
  }
  
  // Setup login events
  function setupLoginEvents() {
    // Toggle password visibility
    if (toggleLoginPassword) {
      toggleLoginPassword.addEventListener('click', () => {
        const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPassword.setAttribute('type', type);
        toggleLoginPassword.innerHTML = type === 'password' 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      });
    }
    
    // Handle login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle social login buttons
    const socialButtons = document.querySelectorAll('.social-login-button');
    socialButtons.forEach(button => {
      button.addEventListener('click', handleSocialLogin);
    });
  }
  
  // Setup signup events
  function setupSignupEvents() {
    // Toggle password visibility
    if (toggleSignupPassword) {
      toggleSignupPassword.addEventListener('click', () => {
        const type = signupPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        signupPassword.setAttribute('type', type);
        toggleSignupPassword.innerHTML = type === 'password' 
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      });
    }
    
    // Password strength meter
    if (signupPassword) {
      signupPassword.addEventListener('input', updatePasswordStrength);
    }
    
    // Handle signup form submission
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }
    
    // Handle social signup buttons
    const socialButtons = document.querySelectorAll('.social-login-button');
    socialButtons.forEach(button => {
      button.addEventListener('click', handleSocialLogin);
    });
  }
  
  // Handle login form submission
  function handleLogin(e) {
    e.preventDefault();
    
    // Get form values
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    const remember = loginRemember.checked;
    
    // Validate form (basic validation)
    if (!email || !password) {
      showError(loginErrorMsg, 'Please enter both email and password');
      return;
    }
    
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      Logging in...
    `;
    
    // In a real app, we would send to the server
    // For demo, we'll simulate a successful login after a delay
    setTimeout(() => {
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Accept any login credentials for demo purposes
      if (true) {
        // Store auth state
        localStorage.setItem('ezEditAuth', JSON.stringify({
          isAuthenticated: true,
          user: {
            email: email,
            firstName: 'Demo',
            lastName: 'User',
            plan: 'free-trial',
            trialDaysLeft: 7
          },
          token: 'demo-token-' + Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        }));
        
        // Redirect to dashboard
        window.location.href = '../dashboard.html';
      } else {
        // Show error
        showError(loginErrorMsg, 'Invalid email or password');
      }
    }, 1500);
  }
  
  // Handle signup form submission
  function handleSignup(e) {
    e.preventDefault();
    
    // Get form values
    const firstName = signupFirstName.value.trim();
    const lastName = signupLastName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const terms = signupTerms.checked;
    
    // Validate form (basic validation)
    if (!firstName || !lastName || !email || !password) {
      showError(signupErrorMsg, 'Please fill in all required fields');
      return;
    }
    
    if (!terms) {
      showError(signupErrorMsg, 'You must agree to the Terms of Service');
      return;
    }
    
    // No password strength requirements
    
    // Show loading state
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      Creating account...
    `;
    
    // In a real app, we would send to the server
    // For demo, we'll simulate a successful signup after a delay
    setTimeout(() => {
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Store auth state
      localStorage.setItem('ezEditAuth', JSON.stringify({
        isAuthenticated: true,
        user: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          plan: 'free-trial',
          trialDaysLeft: 7
        },
        token: 'demo-token-' + Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }));
      
      // Redirect to dashboard
      window.location.href = '../dashboard.html';
    }, 1500);
  }
  
  // Handle social login/signup
  function handleSocialLogin(e) {
    e.preventDefault();
    
    const provider = e.currentTarget.dataset.provider;
    
    // In a real app, we would redirect to OAuth provider
    // For demo, we'll simulate a successful login after a delay
    alert(`Redirecting to ${provider} for authentication... (Demo only)`);
    
    // Simulate successful login
    setTimeout(() => {
      // Store auth state
      localStorage.setItem('ezEditAuth', JSON.stringify({
        isAuthenticated: true,
        user: {
          email: `${provider}user@example.com`,
          firstName: provider.charAt(0).toUpperCase() + provider.slice(1),
          lastName: 'User',
          plan: 'free-trial',
          trialDaysLeft: 7
        },
        token: `${provider}-token-` + Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }));
      
      // Redirect to dashboard
      window.location.href = '../dashboard.html';
    }, 1500);
  }
  
  // Update password strength meter
  function updatePasswordStrength() {
    if (!passwordStrength || !passwordStrengthBar) return;
    
    const password = signupPassword.value;
    const strength = getPasswordStrength(password);
    
    // Update strength bar
    passwordStrengthBar.style.width = `${(strength / 4) * 100}%`;
    
    // Update strength text and color
    let strengthText = '';
    let strengthColor = '';
    
    switch (strength) {
      case 0:
        strengthText = 'Very Weak';
        strengthColor = 'var(--clr-danger)';
        break;
      case 1:
        strengthText = 'Weak';
        strengthColor = 'var(--clr-warning)';
        break;
      case 2:
        strengthText = 'Medium';
        strengthColor = 'var(--clr-warning)';
        break;
      case 3:
        strengthText = 'Strong';
        strengthColor = 'var(--clr-success)';
        break;
      case 4:
        strengthText = 'Very Strong';
        strengthColor = 'var(--clr-success)';
        break;
    }
    
    // Show strength indicator but don't enforce requirements
    passwordStrength.textContent = strengthText + ' (no minimum requirement)';
    passwordStrengthBar.style.backgroundColor = strengthColor;
  }
  
  // Get password strength (0-4)
  function getPasswordStrength(password) {
    let strength = 0;
    
    // Any password is accepted, but we still show strength indicators
    // for user information (no minimum requirements)
    
    // Length check
    if (password.length >= 6) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase or number
    if (/[A-Z0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  }
  
  // Show error message
  function showError(element, message) {
    if (!element) return;
    
    element.textContent = message;
    element.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
  
  // Check authentication state
  function checkAuthState() {
    const auth = JSON.parse(localStorage.getItem('ezEditAuth') || '{}');
    const isAuthenticated = auth.isAuthenticated && auth.token && auth.expiresAt > Date.now();
    
    // Set user email in header if authenticated
    if (isAuthenticated) {
      const userEmailElements = document.querySelectorAll('.user-email');
      userEmailElements.forEach(el => {
        el.textContent = auth.user.email;
      });
    }
    
    // Redirect if needed
    const currentPath = window.location.pathname;
    
    // If not authenticated and trying to access protected pages
    if (!isAuthenticated && (currentPath.includes('dashboard') || currentPath.includes('editor') || currentPath.includes('settings'))) {
      window.location.href = '../login.html?redirect=' + encodeURIComponent(currentPath);
    }
    
    // If authenticated and trying to access login/signup pages
    if (isAuthenticated && (currentPath.includes('login') || currentPath.includes('signup'))) {
      window.location.href = '../dashboard.html';
    }
  }
  
  // Initialize
  initAuthentication();
});
