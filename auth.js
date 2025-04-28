document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.parentElement.querySelector('input');
      const isPassword = input.type === 'password';
      
      input.type = isPassword ? 'text' : 'password';
      toggle.classList.toggle('show-password', isPassword);
    });
  });
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');
    const authAlert = document.getElementById('auth-alert');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate inputs
        if (!email || !password) {
            showAlert('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginText.textContent = 'Signing In...';
        loginSpinner.style.display = 'block';
        
        try {
            // Simulate API call (replace with actual fetch to your backend)
            const response = await loginUser(email, password);
            
            if (response.success) {
                showAlert('Login successful! Redirecting...', 'success');
                // Store user token (in a real app)
                localStorage.setItem('authToken', response.token);
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                showAlert(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An error occurred. Please try again.', 'error');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginText.textContent = 'Sign In';
            loginSpinner.style.display = 'none';
        }
    });
    
    // Helper function to validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Helper function to show alert messages
    function showAlert(message, type) {
        authAlert.textContent = message;
        authAlert.className = 'auth-alert ' + type;
        authAlert.style.display = 'block';
        
        // Hide alert after 5 seconds
        setTimeout(() => {
            authAlert.style.display = 'none';
        }, 5000);
    }
    
    // Mock login function (replace with actual API call)
    async function loginUser(email, password) {
        // In a real app, you would make a fetch request to your backend
        // Example:
        /*
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
        */
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock responses for demonstration
        if (email === 'user@example.com' && password === 'password123') {
            return {
                success: true,
                token: 'mock-jwt-token',
                user: {
                    id: 1,
                    name: 'Demo User',
                    email: 'user@example.com'
                }
            };
        } else {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
    }
});