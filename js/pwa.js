// PWA Manager — დემენციის მოვლა (dementia-care-georgia)
// Service Worker-ის რეგისტრაცია, ინსტალაციის UI და ოფლაინ მონიტორინგი

(() => {
  'use strict';

  let deferredPrompt = null;
  const BANNER_DISMISSED_KEY = 'dementia_pwa_banner_dismissed';

  const isIOS = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
  };

  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  };

  // 1. Service Worker-ის რეგისტრაცია და განახლებების მართვა
  const initServiceWorker = () => {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          // განახლების აღმოჩენა
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification(newWorker);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // გვერდის განახლება ახალი Worker-ის გააქტიურებისას
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  };

  // განახლების შეტყობინება
  const showUpdateNotification = (worker) => {
    const existing = document.getElementById('pwaUpdateToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pwaUpdateToast';
    toast.className = 'pwa-update-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="pwa-update-content">
        <span class="pwa-update-icon" aria-hidden="true">🔄</span>
        <span>ხელმისაწვდომია გზამკვლევის ახალი ვერსია!</span>
      </div>
      <div class="pwa-update-actions">
        <button type="button" class="btn btn-sm btn-primary" id="pwaReloadBtn">განახლება</button>
        <button type="button" class="btn-icon-subtle" id="pwaDismissUpdateBtn" aria-label="დახურვა">✕</button>
      </div>
    `;
    document.body.appendChild(toast);

    document.getElementById('pwaReloadBtn')?.addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    });

    document.getElementById('pwaDismissUpdateBtn')?.addEventListener('click', () => {
      toast.remove();
    });
  };

  // 2. ინსტალაციის მართვა (Install Prompt & UI)
  const initInstallPrompts = () => {
    const headerBtn = document.getElementById('headerInstallBtn');
    const drawerBtn = document.getElementById('drawerInstallBtn');
    const banner = document.getElementById('pwaInstallBanner');
    const bannerInstallBtn = document.getElementById('bannerInstallBtn');
    const bannerCloseBtn = document.getElementById('bannerCloseBtn');
    const iosModal = document.getElementById('iosInstallModal');
    const iosCloseBtn = document.getElementById('iosModalCloseBtn');
    const iosBackdrop = document.getElementById('iosModalBackdrop');

    const showInstallTriggers = () => {
      if (headerBtn) headerBtn.style.display = 'inline-flex';
      if (drawerBtn) drawerBtn.style.display = 'flex';

      // მცურავი ბანერი (თუ მომხმარებელს ბოლო 7 დღეში არ დაუხურავს)
      const dismissedTime = localStorage.getItem(BANNER_DISMISSED_KEY);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (!dismissedTime || (now - parseInt(dismissedTime, 10) > sevenDays)) {
        setTimeout(() => {
          if (!isStandalone() && banner) {
            banner.classList.add('visible');
          }
        }, 2200);
      }
    };

    const hideAllInstallTriggers = () => {
      if (headerBtn) headerBtn.style.display = 'none';
      if (drawerBtn) drawerBtn.style.display = 'none';
      if (banner) banner.classList.remove('visible');
    };

    const openIosModal = () => {
      if (iosModal) {
        iosModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeIosModal = () => {
      if (iosModal) {
        iosModal.classList.remove('visible');
        document.body.style.overflow = '';
      }
    };

    // Chromium (Android / Desktop Chrome / Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallTriggers();
    });

    // iOS Safari
    if (isIOS() && !isStandalone()) {
      showInstallTriggers();
    }

    // თუ უკვე standalone რეჟიმში გაეშვა, დამალვა
    if (isStandalone()) {
      hideAllInstallTriggers();
    }

    const handleInstallClick = async () => {
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            hideAllInstallTriggers();
            if (window.showAppToast) {
              window.showAppToast('აპლიკაცია წარმატებით დაინსტალირდა!');
            }
          }
          deferredPrompt = null;
        } catch (err) {
          console.warn('[PWA] Prompt error:', err);
        }
      } else if (isIOS()) {
        openIosModal();
      } else {
        if (window.showAppToast) {
          window.showAppToast('გამოიყენეთ ბრაუზერის მენიუ: „Install / Add to Home screen“');
        }
      }
    };

    headerBtn?.addEventListener('click', handleInstallClick);
    drawerBtn?.addEventListener('click', handleInstallClick);
    bannerInstallBtn?.addEventListener('click', handleInstallClick);

    bannerCloseBtn?.addEventListener('click', () => {
      if (banner) banner.classList.remove('visible');
      localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    });

    iosCloseBtn?.addEventListener('click', closeIosModal);
    iosBackdrop?.addEventListener('click', closeIosModal);

    window.addEventListener('appinstalled', () => {
      hideAllInstallTriggers();
      deferredPrompt = null;
      if (window.showAppToast) {
        window.showAppToast('დემენციის მოვლა წარმატებით დაემატა თქვენს ეკრანზე!');
      }
    });
  };

  // 3. ონლაინ / ოფლაინ სტატუსის ინდიკატორი
  const initNetworkStatus = () => {
    const indicator = document.getElementById('offlineIndicator');
    if (!indicator) return;

    let onlineTimer = null;

    const setOffline = () => {
      clearTimeout(onlineTimer);
      indicator.className = 'offline-indicator offline visible';
      indicator.innerHTML = `
        <span class="offline-icon" aria-hidden="true">📡</span>
        <span class="offline-text"><strong>ოფლაინ რეჟიმი:</strong> ინტერნეტთან კავშირი არ არის. გზამკვლევი და ყველა ინსტრუმენტი სრულად მუშაობს ლოკალურად.</span>
      `;
    };

    const setOnline = () => {
      indicator.className = 'offline-indicator online visible';
      indicator.innerHTML = `
        <span class="offline-icon" aria-hidden="true">🟢</span>
        <span class="offline-text">ინტერნეტთან კავშირი აღდგა.</span>
      `;
      clearTimeout(onlineTimer);
      onlineTimer = setTimeout(() => {
        indicator.classList.remove('visible');
      }, 3500);
    };

    window.addEventListener('offline', setOffline);
    window.addEventListener('online', setOnline);

    if (!navigator.onLine) {
      setOffline();
    }
  };

  // ინიციალიზაცია DOM-ის ჩატვირთვისას
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initServiceWorker();
      initInstallPrompts();
      initNetworkStatus();
    });
  } else {
    initServiceWorker();
    initInstallPrompts();
    initNetworkStatus();
  }
})();
