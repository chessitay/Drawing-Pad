// drawing-pad-enhanced.js
/* global document window */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize drawing pad
    initDrawingPad();
    
    // Set current year in footer (if not already set by home-page.js)
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement && !currentYearElement.textContent) {
      currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Sync the theme-select dropdown with the website theme
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      themeSelect.value = isDarkMode ? 'dark' : 'light';
    }
  });
  
  function initDrawingPad() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
  
    const colorPicker = document.getElementById('colorPicker');
    const brushSizeSlider = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const brushPreview = document.getElementById('brushPreview');
    const clearButton = document.getElementById('clearCanvas');
    const undoButton = document.getElementById('undoBtn');
    const redoButton = document.getElementById('redoBtn');
    const saveButton = document.getElementById('saveBtn');
    const fullscreenButton = document.getElementById('fullscreenBtn');
    const settingsButton = document.getElementById('settingsBtn');
    const brushToolButton = document.getElementById('brushTool');
    const eraserToolButton = document.getElementById('eraserTool');
    const fillToolButton = document.getElementById('fillTool');
    const coordinatesDisplay = document.getElementById('coordinates');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const applySettingsBtn = document.getElementById('applySettingsBtn');
    const colorSwatches = document.querySelectorAll('[data-color]');
    const smoothingCheck = document.getElementById('smoothingCheck');
    const autosaveCheck = document.getElementById('autosaveCheck');
  
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'brush';
    let brushColor = colorPicker.value;
    let brushWidth = parseInt(brushSizeSlider.value);
    let drawingHistory = [];
    let historyIndex = -1;
    let lastActionTimestamp = Date.now();
    let isSettingsModalOpen = false;
    let autosaveInterval = null;
    const MAX_HISTORY_SIZE = 20;
  
    function init() {
      resizeCanvas();
      setDrawingStyle();
      fillBackground();
      saveToHistory();
      updateBrushPreview();
      bindEvents();
      
      // Setup theme
      syncThemeWithWebsite();
      
      // Play startup sound if audio is enabled
      playSound('startup');
    }
  
    function syncThemeWithWebsite() {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const themeSelect = document.getElementById('themeSelect');
      if (themeSelect) {
        themeSelect.value = isDarkMode ? 'dark' : 'light';
      }
      
      // Apply some theme-specific styles
      document.body.classList.toggle('dark', isDarkMode);
    }
  
    function updateBrushPreview() {
      const size = Math.max(5, brushWidth);
      brushPreview.style.width = `${size}px`;
      brushPreview.style.height = `${size}px`;
      brushPreview.style.backgroundColor = currentTool === 'eraser' ? '#ffffff' : brushColor;
      brushPreview.style.border = currentTool === 'eraser' ? '1px solid #d1d5db' : 'none';
    }
  
    function resizeCanvas() {
      const padding = 30;
      const appContainer = document.querySelector('.app-container');
      const toolbar = document.querySelector('.toolbar');
      const statusBar = document.querySelector('.status-bar');
      const appHeader = document.querySelector('.app-header');
      
      const controlsHeight = (toolbar ? toolbar.offsetHeight : 0) + 
                             (statusBar ? statusBar.offsetHeight : 0) + 
                             (appHeader ? appHeader.offsetHeight : 0);
                             
      const availW = Math.min(1000, window.innerWidth - padding * 2);
      const availH = window.innerHeight - controlsHeight - padding * 4;
  
      const aspect = 4 / 3;
      let w = availW;
      let h = w / aspect;
      if (h > availH) {
        h = availH;
        w = h * aspect;
      }
  
      // Store current drawing before resizing
      let img;
      if (canvas.width > 1 && canvas.height > 1) {
        try {
          img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          console.error('Error getting image data:', e);
        }
      }
      
      // Resize canvas
      canvas.width = Math.max(300, w);
      canvas.height = Math.max(225, h);
      
      // Restore drawing if we had one
      if (img) {
        try {
          ctx.putImageData(img, 0, 0);
        } catch (e) {
          console.error('Error restoring image data:', e);
        }
      }
      
      // Reset drawing style
      setDrawingStyle();
    }
  
    function setDrawingStyle() {
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : brushColor;
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Apply line smoothing if enabled
      if (smoothingCheck && smoothingCheck.checked) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      } else {
        ctx.imageSmoothingEnabled = false;
      }
    }
  
    function fillBackground(color = 'white') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setDrawingStyle();
    }
  
    function setupAutosave() {
      if (autosaveInterval) {
        clearInterval(autosaveInterval);
        autosaveInterval = null;
      }
      
      if (autosaveCheck && autosaveCheck.checked) {
        autosaveInterval = setInterval(() => {
          // Save canvas to localStorage
          try {
            localStorage.setItem('drawing-pad-autosave', canvas.toDataURL());
            console.log('Drawing autosaved');
            
            // Show brief notification
            const notification = document.createElement('div');
            notification.textContent = 'Drawing autosaved';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.backgroundColor = 'var(--accent-primary, #4f46e5)';
            notification.style.color = 'white';
            notification.style.padding = '8px 16px';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '1000';
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            
            document.body.appendChild(notification);
            
            // Fade in and out
            setTimeout(() => { notification.style.opacity = '1'; }, 10);
            setTimeout(() => { 
              notification.style.opacity = '0'; 
              setTimeout(() => { 
                document.body.removeChild(notification); 
              }, 300);
            }, 2000);
            
          } catch (e) {
            console.error('Error autosaving drawing:', e);
          }
        }, 30000); // 30 seconds
      }
    }
  
    function loadAutosave() {
      try {
        const savedDrawing = localStorage.getItem('drawing-pad-autosave');
        if (savedDrawing) {
          const img = new Image();
          img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveToHistory();
          };
          img.src = savedDrawing;
        }
      } catch (e) {
        console.error('Error loading autosaved drawing:', e);
      }
    }
  
    function saveToHistory() {
      if (historyIndex < drawingHistory.length - 1) drawingHistory = drawingHistory.slice(0, historyIndex + 1);
      drawingHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (drawingHistory.length > MAX_HISTORY_SIZE) drawingHistory.shift();
      historyIndex = drawingHistory.length - 1;
      updateHistoryBtns();
    }
  
    function updateHistoryBtns() {
      undoButton.disabled = historyIndex <= 0;
      redoButton.disabled = historyIndex >= drawingHistory.length - 1;
      undoButton.classList.toggle('opacity-50', undoButton.disabled);
      redoButton.classList.toggle('opacity-50', redoButton.disabled);
    }
  
    function undo() {
      if (historyIndex > 0) {
        historyIndex--;
        ctx.putImageData(drawingHistory[historyIndex], 0, 0);
        updateHistoryBtns();
        playSound('keypress-alt');
      }
    }
  
    function redo() {
      if (historyIndex < drawingHistory.length - 1) {
        historyIndex++;
        ctx.putImageData(drawingHistory[historyIndex], 0, 0);
        updateHistoryBtns();
        playSound('keypress-alt');
      }
    }
  
    function clearCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fillBackground();
      saveToHistory();
      playSound('keypress-return');
    }
  
    function saveCanvas() {
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      playSound('success');
    }
  
    function toggleFullscreen() {
      const el = document.fullscreenElement;
      const container = document.querySelector('.canvas-container');
      if (!el) {
        (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen).call(container);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen).call(document);
      }
      playSound('keypress-return');
    }
  
    function toggleSettingsModal() {
      isSettingsModalOpen = !isSettingsModalOpen;
      settingsModal.style.display = isSettingsModalOpen ? 'flex' : 'none';
      playSound(isSettingsModalOpen ? 'keypress-return' : 'keypress-alt');
    }
  
    function setActiveTool(tool) {
      currentTool = tool;
      brushToolButton.classList.toggle('active', tool === 'brush');
      eraserToolButton.classList.toggle('active', tool === 'eraser');
      fillToolButton.classList.toggle('active', tool === 'fill');
      setDrawingStyle();
      updateBrushPreview();
      
      // Update cursor
      canvas.style.cursor =
        tool === 'brush'
          ? 'crosshair'
          : tool === 'eraser'
          ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'24\' width=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M15.14 3C14.63 3 14.12 3.2 13.73 3.59l-2.12 2.12 6.7 6.7 2.12-2.12c0.78-0.78 0.78-2.05 0-2.83l-3.88-3.88C15.82 3.2 15.33 3 14.84 3h0.3zM3.41 6.89c-0.39 0.39-0.39 1.02 0 1.41l9.6 9.6c0.39 0.39 1.02 0.39 1.41 0l0.99-0.99-7.01-7.01-4.99 4.99z\' fill=\'%23333\'/%3E%3C/svg%3E") 5 5, auto'
          : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'24\' width=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z\' fill=\'%23333\'/%3E%3C/svg%3E") 5 5, auto';
      
      playSound('keypress');
    }
  
    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const [clientX, clientY] = e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
  
    function floodFill(x, y, fillColor) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = img.data;
      const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
      const target = data.slice(idx, idx + 4);
  
      const tmp = document.createElement('div');
      tmp.style.color = fillColor;
      document.body.appendChild(tmp);
      const [r, g, b] = window.getComputedStyle(tmp).color.match(/\d+/g).map(Number);
      document.body.removeChild(tmp);
      const fill = [r, g, b, 255];
  
      const match = (c1, c2, tol = 10) => c1.every((v, i) => Math.abs(v - c2[i]) <= tol);
      if (match(target, fill)) return;
  
      const queue = [[Math.floor(x), Math.floor(y)]];
      const visited = new Set();
  
      while (queue.length) {
        const [px, py] = queue.shift();
        const i = (py * canvas.width + px) * 4;
        if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height || visited.has(`${px},${py}`)) continue;
        const curr = data.slice(i, i + 4);
        if (!match(curr, target)) continue;
        visited.add(`${px},${py}`);
        data.set(fill, i);
        queue.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
      ctx.putImageData(img, 0, 0);
    }
  
    function startDrawing(e) {
      e.preventDefault();
      isDrawing = true;
      const { x, y } = getCoords(e);
      lastX = x;
      lastY = y;
      if (currentTool === 'fill') {
        floodFill(x, y, brushColor);
        saveToHistory();
        isDrawing = false;
        playSound('success');
        return;
      }
      ctx.beginPath();
      ctx.arc(lastX, lastY, brushWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      
      playSound('keypress');
    }
  
    function draw(e) {
      e.preventDefault();
      if (!isDrawing || currentTool === 'fill') return;
      const { x, y } = getCoords(e);
      coordinatesDisplay.textContent = `Position: ${Math.round(x)}, ${Math.round(y)}`;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
  
      const now = Date.now();
      if (now - lastActionTimestamp > 500) {
        saveToHistory();
        lastActionTimestamp = now;
      }
    }
  
    function stopDrawing() {
      if (isDrawing) {
        isDrawing = false;
        saveToHistory();
      }
    }
    
    // Helper function to play sound effects
    function playSound(soundId) {
      // Check if sound is available and enabled
      const soundElement = document.getElementById(soundId);
      const audioToggle = document.getElementById('toggle-audio');
      
      // Skip if audio is muted or element doesn't exist
      if (!soundElement || (audioToggle && audioToggle.classList.contains('muted'))) {
        return;
      }
      
      try {
        soundElement.currentTime = 0;
        soundElement.play().catch(e => console.log('Sound play prevented:', e));
      } catch (e) {
        console.log('Error playing sound:', e);
      }
    }
  
    function bindEvents() {
      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', e => { 
        coordinatesDisplay.textContent = `Position: ${Math.round(getCoords(e).x)}, ${Math.round(getCoords(e).y)}`; 
        draw(e); 
      });
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
  
      // Touch events for mobile
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);
      canvas.addEventListener('touchcancel', stopDrawing);
  
      // Window resize
      window.addEventListener('resize', () => {
        resizeCanvas();
      });
  
      // Tool buttons
      clearButton.addEventListener('click', clearCanvas);
      undoButton.addEventListener('click', undo);
      redoButton.addEventListener('click', redo);
      saveButton.addEventListener('click', saveCanvas);
      fullscreenButton.addEventListener('click', toggleFullscreen);
      settingsButton.addEventListener('click', toggleSettingsModal);
      closeSettingsBtn.addEventListener('click', toggleSettingsModal);
  
      // Apply settings button
      applySettingsBtn.addEventListener('click', () => {
        const theme = document.getElementById('themeSelect').value;
        const bg = document.getElementById('backgroundSelect').value;
        
        // Apply theme to website
        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
          const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          if (currentTheme !== theme && themeSwitch) {
            themeSwitch.checked = theme === 'light';
            themeSwitch.dispatchEvent(new Event('change'));
          }
        } else {
          // Fallback if we can't find the website's theme toggle
          document.documentElement.classList.toggle('dark', theme === 'dark');
          document.body.classList.toggle('dark', theme === 'dark');
        }
        
        // Apply canvas background
        if (bg === 'grid') {
          fillBackground('#FFFFFF');
          const grid = 20;
          ctx.strokeStyle = '#EEEEEE';
          ctx.lineWidth = 1;
          for (let x = 0; x <= canvas.width; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y <= canvas.height; y += grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          setDrawingStyle();
        } else {
          fillBackground(bg === 'transparent' ? 'rgba(0,0,0,0)' : 'white');
        }
        
        // Setup autosave
        setupAutosave();
        
        saveToHistory();
        toggleSettingsModal();
        playSound('success');
      });
  
      // Tool buttons
      brushToolButton.addEventListener('click', () => setActiveTool('brush'));
      eraserToolButton.addEventListener('click', () => setActiveTool('eraser'));
      fillToolButton.addEventListener('click', () => setActiveTool('fill'));
  
      // Color picker
      colorPicker.addEventListener('input', () => {
        brushColor = colorPicker.value;
        setDrawingStyle();
        updateBrushPreview();
      });
  
      // Color swatches
      colorSwatches.forEach(sw => sw.addEventListener('click', () => {
        const color = sw.getAttribute('data-color');
        colorPicker.value = color;
        brushColor = color;
        setDrawingStyle();
        updateBrushPreview();
        playSound('keypress');
      }));
  
      // Brush size slider
      brushSizeSlider.addEventListener('input', () => {
        brushWidth = parseInt(brushSizeSlider.value);
        brushSizeValue.textContent = brushWidth;
        setDrawingStyle();
        updateBrushPreview();
      });
  
      // Listen for keyboard shortcuts
      document.addEventListener('keydown', e => {
        if (isSettingsModalOpen) return;
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) e.preventDefault();
        const k = e.key.toLowerCase();
        if (k === 'b') setActiveTool('brush');
        if (k === 'e') setActiveTool('eraser');
        if (k === 'f') setActiveTool('fill');
        if ((e.ctrlKey || e.metaKey) && k === 'z') undo();
        if ((e.ctrlKey || e.metaKey) && k === 'y') redo();
        if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') clearCanvas();
        if ((e.ctrlKey || e.metaKey) && k === 's') {
          e.preventDefault();
          saveCanvas();
        }
      });
  
      // Check for autosaved drawing on load
      if (autosaveCheck) {
        autosaveCheck.addEventListener('change', setupAutosave);
        
        // Try to load autosaved drawing
        if (localStorage.getItem('drawing-pad-autosave')) {
          const loadButton = document.createElement('button');
          loadButton.textContent = 'Load Previous Drawing';
          loadButton.className = 'px-4 py-2 bg-blue-600 dark:bg-dark-primary text-white rounded-md hover:bg-blue-700 dark:hover:bg-dark-highlight fixed top-24 right-4 z-10';
          loadButton.addEventListener('click', () => {
            loadAutosave();
            document.body.removeChild(loadButton);
            playSound('success');
          });
          document.body.appendChild(loadButton);
          
          // Auto-remove after 10 seconds
          setTimeout(() => {
            if (document.body.contains(loadButton)) {
              document.body.removeChild(loadButton);
            }
          }, 10000);
        }
      }
      
      // Theme change observer
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && mutation.target === document.documentElement) {
            syncThemeWithWebsite();
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
    }
  
    // Initialize the drawing pad
    init();
  }
  
  // Helper function for terminal integration
  function openTerminalCommand(args) {
    if (typeof window.openTerminal === 'function') {
      window.openTerminal();
    } else {
      const terminalOverlay = document.getElementById('terminal-overlay');
      const terminal = document.getElementById('terminal');
      if (terminalOverlay && terminal) {
        terminalOverlay.classList.add('active');
        terminal.classList.remove('closed');
        terminal.classList.add('opening');
      }
    }
  }