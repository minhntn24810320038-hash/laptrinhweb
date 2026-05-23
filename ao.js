document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 0. BIẾN KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ĐỒNG BỘ (SỬ DỤNG LOCALSTORAGE)
  // ==========================================
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const authModal = document.getElementById("auth-modal");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const authTrigger = document.getElementById("auth-trigger");

  // Khôi phục giao diện nút Tài khoản nếu trước đó đã đăng nhập thành công từ trang chủ
  if (isLoggedIn && authTrigger) {
    authTrigger.innerHTML = "🙋‍♂️ Tài khoản";
  }

  // Hàm ép buộc mở Form Đăng Nhập khi chưa login
  function forceOpenLoginModal() {
    authModal.classList.add("open");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.add("active");
    formRegister.classList.remove("active");
    alert(
      "Vui lòng đăng nhập tài khoản trước khi thực hiện mua sắm tại T.M.H Menswear!",
    );
  }

  // ==========================================
  // 1. TỰ ĐỘNG ĐỔI ẢNH NỀN HERO BANNER (SLIDESHOW)
  // ==========================================
  const slides = document.querySelectorAll(".hero .slide");
  let currentSlideIndex = 0;
  const slideIntervalTime = 4000;

  function nextSlide() {
    slides[currentSlideIndex].classList.remove("active");
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    slides[currentSlideIndex].classList.add("active");
  }

  if (slides.length > 0) {
    setInterval(nextSlide, slideIntervalTime);
  }

  // ==========================================
  // 2. LOGIC ĐIỀU KHIỂN SIDEBAR GIỎ HÀNG
  // ==========================================
  let cartArray = [];

  const cartCountEl = document.getElementById("cart-count");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartTrigger = document.getElementById("cart-trigger");
  const closeCartBtn = document.getElementById("close-cart");
  const cartItemsList = document.getElementById("cart-items-list");
  const cartTotalPriceEl = document.getElementById("cart-total-price");
  const checkoutBtn = document.getElementById("checkout-btn");

  function updateCartUI() {
    let totalQty = cartArray.reduce((total, item) => total + item.quantity, 0);
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (!cartItemsList) return;

    cartItemsList.innerHTML = "";

    if (cartArray.length === 0) {
      cartItemsList.innerHTML =
        '<p class="empty-cart-msg">Giỏ hàng của bạn đang trống.</p>';
      if (cartTotalPriceEl) cartTotalPriceEl.textContent = "0 đ";
      return;
    }

    let totalPrice = 0;
    cartArray.forEach((item) => {
      totalPrice += item.price * item.quantity;
      const itemHTML = `
        <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
          <img src="${item.image}" class="cart-item-img" />
          <div class="cart-item-details">
            <p class="cart-item-title">${item.title} (Size: ${item.size})</p>
            <p class="cart-item-price">${(item.price * item.quantity).toLocaleString("vi-VN")} đ</p>
            <div class="cart-item-qty-box">
              <button class="qty-btn decrease-qty">-</button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn increase-qty">+</button>
            </div>
          </div>
          <button class="remove-item-btn">×</button>
        </div>
      `;
      cartItemsList.insertAdjacentHTML("beforeend", itemHTML);
    });

    if (cartTotalPriceEl)
      cartTotalPriceEl.textContent = totalPrice.toLocaleString("vi-VN") + " đ";
    bindCartEvents();
  }

  function bindCartEvents() {
    document.querySelectorAll(".increase-qty").forEach((btn) => {
      btn.onclick = (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.getAttribute("data-id");
        const size = itemEl.getAttribute("data-size");
        const product = cartArray.find(
          (item) => item.id === id && item.size === size,
        );
        if (product) product.quantity++;
        updateCartUI();
      };
    });

    document.querySelectorAll(".decrease-qty").forEach((btn) => {
      btn.onclick = (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.getAttribute("data-id");
        const size = itemEl.getAttribute("data-size");
        const product = cartArray.find(
          (item) => item.id === id && item.size === size,
        );
        if (product) {
          product.quantity--;
          if (product.quantity <= 0) {
            cartArray = cartArray.filter(
              (item) => !(item.id === id && item.size === size),
            );
          }
        }
        updateCartUI();
      };
    });

    document.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const itemEl = e.target.closest(".cart-item");
        const id = itemEl.getAttribute("data-id");
        const size = itemEl.getAttribute("data-size");
        cartArray = cartArray.filter(
          (item) => !(item.id === id && item.size === size),
        );
        updateCartUI();
      };
    });
  }

  // ==========================================
  // 3. LOGIC ĐIỀU KHIỂN POP-UP CHỌN SIZE MUA HÀNG
  // ==========================================
  const sizeModal = document.getElementById("size-modal");
  const closeSizeModalBtn = document.getElementById("close-size-modal");
  const modalImg = document.getElementById("modal-product-img");
  const modalTitle = document.getElementById("modal-product-title");
  const modalPrice = document.getElementById("modal-product-price");
  const modalSizeOptions = document.getElementById("modal-size-options");
  const modalAddToCartBtn = document.getElementById("modal-add-to-cart-btn");

  let currentSelectedProduct = null;
  let currentSelectedSize = null;

  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.onclick = () => {
      // Đọc lại trạng thái mới nhất từ bộ nhớ trước khi cho mua hàng
      isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      if (!isLoggedIn) {
        forceOpenLoginModal();
        return;
      }

      const card = btn.closest(".product-card");

      currentSelectedProduct = {
        id: card.getAttribute("data-id"),
        price: parseInt(card.getAttribute("data-price")),
        title: card.querySelector(".product-title").textContent,
        image: card.querySelector(".product-image img").getAttribute("src"),
        sizes: card.getAttribute("data-sizes").split(","),
      };

      modalImg.setAttribute("src", currentSelectedProduct.image);
      modalTitle.textContent = currentSelectedProduct.title;
      modalPrice.textContent =
        currentSelectedProduct.price.toLocaleString("vi-VN") + " đ";

      currentSelectedSize = null;
      modalAddToCartBtn.disabled = true;

      modalSizeOptions.innerHTML = "";
      currentSelectedProduct.sizes.forEach((size) => {
        const sizeBtn = document.createElement("button");
        sizeBtn.className = "size-option-btn";
        sizeBtn.textContent = size.trim();

        sizeBtn.onclick = () => {
          document
            .querySelectorAll(".size-option-btn")
            .forEach((b) => b.classList.remove("selected"));
          sizeBtn.classList.add("selected");

          currentSelectedSize = size.trim();
          modalAddToCartBtn.disabled = false;
        };

        modalSizeOptions.appendChild(sizeBtn);
      });

      sizeModal.classList.add("open");
    };
  });

  modalAddToCartBtn.onclick = () => {
    isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      sizeModal.classList.remove("open");
      forceOpenLoginModal();
      return;
    }

    if (!currentSelectedProduct || !currentSelectedSize) return;

    const existingProduct = cartArray.find(
      (item) =>
        item.id === currentSelectedProduct.id &&
        item.size === currentSelectedSize,
    );

    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cartArray.push({
        id: currentSelectedProduct.id,
        title: currentSelectedProduct.title,
        price: currentSelectedProduct.price,
        image: currentSelectedProduct.image,
        size: currentSelectedSize,
        quantity: 1,
      });
    }

    updateCartUI();
    sizeModal.classList.remove("open");
    cartSidebar.classList.add("open");
  };

  if (closeSizeModalBtn) {
    closeSizeModalBtn.onclick = () => sizeModal.classList.remove("open");
  }
  if (sizeModal) {
    sizeModal.onclick = (e) => {
      if (e.target === sizeModal) sizeModal.classList.remove("open");
    };
  }

  // ==========================================
  // 4. LOGIC ĐIỀU KHIỂN POP-UP TƯ VẤN CHỌN SIZE
  // ==========================================
  const consultModal = document.getElementById("consult-modal");
  const consultTrigger = document.getElementById("size-consult-trigger");
  const closeConsultModalBtn = document.getElementById("close-consult-modal");

  if (consultTrigger) {
    consultTrigger.onclick = () => {
      consultModal.classList.add("open");
    };
  }

  if (closeConsultModalBtn) {
    closeConsultModalBtn.onclick = () => {
      consultModal.classList.remove("open");
    };
  }

  if (consultModal) {
    consultModal.onclick = (e) => {
      if (e.target === consultModal) consultModal.classList.remove("open");
    };
  }

  // Điều khiển đóng mở Sidebar Giỏ hàng
  if (cartTrigger) {
    cartTrigger.onclick = () => cartSidebar.classList.add("open");
  }
  if (closeCartBtn) {
    closeCartBtn.onclick = () => cartSidebar.classList.remove("open");
  }
  if (cartSidebar) {
    cartSidebar.onclick = (e) => {
      if (e.target === cartSidebar) cartSidebar.classList.remove("open");
    };
  }

  // Thanh toán đơn hàng
  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      if (cartArray.length === 0) {
        alert("Giỏ hàng của bạn hiện tại đang trống!");
      } else {
        alert(
          "Đơn hàng sơ mi T.M.H của bạn đang được hệ thống xử lý thành công!",
        );
        cartArray = [];
        updateCartUI();
        cartSidebar.classList.remove("open");
      }
    };
  }

  // ==========================================
  // 5. ĐIỀU KHIỂN ĐÓNG/MỞ VÀ CHUYỂN TAB POPUP AUTH
  // ==========================================
  if (authTrigger) {
    authTrigger.addEventListener("click", () =>
      authModal.classList.add("open"),
    );
  }

  const closeAuthModalBtn = document.getElementById("close-modal");
  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener("click", () =>
      authModal.classList.remove("open"),
    );
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.classList.remove("open");
    }
  });

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.add("active");
    formRegister.classList.remove("active");
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.classList.add("active");
    formLogin.classList.remove("active");
  });

  // XỬ LÝ SỰ KIỆN ĐĂNG NHẬP
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();

    isLoggedIn = true;
    localStorage.setItem("isLoggedIn", "true"); // Lưu vĩnh viễn trạng thái vào trình duyệt

    authTrigger.innerHTML = "🙋‍♂️ Tài khoản";
    alert("Đăng nhập thành công! Hệ thống đã kích hoạt tính năng mua hàng.");
    authModal.classList.remove("open");
  });

  formRegister.addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.");
    tabLogin.click();
  });
});
