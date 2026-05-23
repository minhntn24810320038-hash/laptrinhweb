document.addEventListener("DOMContentLoaded", function () {
  /* ======================================
        0. ĐỒNG BỘ TRẠNG THÁI ĐĂNG NHẬP KHÁCH HÀNG
     ====================================== */
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const authTrigger = document.getElementById("auth-trigger");

  if (isLoggedIn && authTrigger) {
    const savedName = localStorage.getItem("currentUserName") || "Khách hàng";
    authTrigger.innerHTML = `🙋‍♂️ Chào, ${savedName}`;
  }

  const authModal = document.getElementById("auth-modal");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  /* ======================================
        1. QUẢN LÝ MẢNG GIỎ HÀNG & SIDEBAR
     ====================================== */
  let cartArray = [];

  const cartCountElement = document.getElementById("cart-count");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartTrigger = document.getElementById("cart-trigger");
  const closeCartBtn = document.getElementById("close-cart");
  const cartItemsList = document.getElementById("cart-items-list");
  const cartTotalPriceEl = document.getElementById("cart-total-price");
  const checkoutBtn = document.getElementById("checkout-btn");

  function updateCartUI() {
    let totalQty = cartArray.reduce((total, item) => total + item.quantity, 0);
    if (cartCountElement) cartCountElement.textContent = totalQty;
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
            <p class="cart-item-title">${item.title} (${item.size})</p>
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

  /* ======================================
        2. LOGIC POPUP CHỌN SIZE KHI BẤM "MUA HÀNG"
     ====================================== */
  const productDetailModal = document.getElementById("product-detail-modal");
  const closeProductModalBtn = document.getElementById("close-product-modal");
  const addToCartFinalBtn = document.getElementById("add-to-cart-final");

  const popupImg = document.getElementById("popup-product-img");
  const popupTitle = document.getElementById("popup-product-title");
  const popupPrice = document.getElementById("popup-product-price");
  const sizeButtons = document.querySelectorAll(".size-btn");

  let selectedProductData = null; // Lưu trữ thông tin sản phẩm đang click tạm thời
  let selectedSize = null; // Lưu trữ size đang chọn

  // Click vào nút "Mua Hàng" ngoài danh sách
  document.querySelectorAll(".buy-now-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".product-card");

      // Thu thập thông tin sản phẩm dữ liệu nhúng
      selectedProductData = {
        id: card.getAttribute("data-id"),
        title: card.querySelector(".product-title").textContent,
        price: parseInt(card.getAttribute("data-price")),
        image: card.querySelector(".product-image img").getAttribute("src"),
      };

      // Đổ dữ liệu vào bảng Modal Popup chi tiết
      if (popupImg) popupImg.src = selectedProductData.image;
      if (popupTitle) popupTitle.textContent = selectedProductData.title;
      if (popupPrice)
        popupPrice.textContent =
          card.querySelector(".product-price").textContent;

      // Reset việc chọn size trước đó
      selectedSize = null;
      sizeButtons.forEach((b) => b.classList.remove("selected"));
      if (addToCartFinalBtn) {
        addToCartFinalBtn.classList.remove("active");
        addToCartFinalBtn.disabled = true;
      }

      // Hiện bảng Popup lên
      if (productDetailModal) productDetailModal.classList.add("open");
    });
  });

  // Sự kiện khi nhấn chọn Size (S, M, L, XL)
  sizeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      sizeButtons.forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");
      selectedSize = this.textContent; // Lấy ký tự S, M, L, XL

      // Kích hoạt sáng nút THÊM VÀO GIỎ HÀNG
      if (addToCartFinalBtn) {
        addToCartFinalBtn.classList.add("active");
        addToCartFinalBtn.disabled = false;
      }
    });
  });

  // Khi bấm nút "THÊM VÀO GIỎ HÀNG" màu đỏ trong popup
  if (addToCartFinalBtn) {
    addToCartFinalBtn.addEventListener("click", function () {
      if (!selectedProductData || !selectedSize) return;

      // Tìm xem sản phẩm cùng ID và cùng SIZE đó đã nằm trong giỏ chưa
      const existingItem = cartArray.find(
        (item) =>
          item.id === selectedProductData.id && item.size === selectedSize,
      );

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cartArray.push({
          id: selectedProductData.id,
          title: selectedProductData.title,
          price: selectedProductData.price,
          image: selectedProductData.image,
          size: selectedSize,
          quantity: 1,
        });
      }

      updateCartUI(); // Vẽ lại giỏ hàng
      if (productDetailModal) productDetailModal.classList.remove("open"); // Đóng popup chọn size
      if (cartSidebar) cartSidebar.classList.add("open"); // Mở trượt sidebar giỏ hàng ra luôn
    });
  }

  // Đóng modal chọn sản phẩm
  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener("click", () =>
      productDetailModal.classList.remove("open"),
    );
  }

  /* ======================================
        3. ĐIỀU KHIỂN ĐÓNG/MỞ SIDEBAR GIỎ HÀNG
     ====================================== */
  if (cartTrigger && cartSidebar) {
    cartTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      cartSidebar.classList.add("open");
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () =>
      cartSidebar.classList.remove("open"),
    );
  }

  /* ======================================
        4. POPUP HỆ THỐNG ĐĂNG NHẬP / ĐĂNG KÝ
     ====================================== */
  const closeModal = document.getElementById("close-modal");

  if (authTrigger) {
    authTrigger.addEventListener("click", () => {
      if (localStorage.getItem("isLoggedIn") !== "true") {
        authModal.classList.add("open");
      } else {
        if (confirm("Bạn có muốn đăng xuất tài khoản này không?")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("currentUserName");
          window.location.reload();
        }
      }
    });
  }

  if (closeModal) {
    closeModal.addEventListener("click", () =>
      authModal.classList.remove("open"),
    );
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) authModal.classList.remove("open");
    if (e.target === cartSidebar) cartSidebar.classList.remove("open");
    if (e.target === productDetailModal)
      productDetailModal.classList.remove("open");
  });

  if (tabLogin && tabRegister) {
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
  }

  /* ======================================
        5. TÌM KIẾM VÀ LỌC SẢN PHẨM
     ====================================== */
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-submit");
  const products = document.querySelectorAll(".product-card");

  function searchProducts() {
    if (!searchInput) return;
    const keyword = searchInput.value.toLowerCase().trim();
    products.forEach((product) => {
      const name = product.dataset.name
        ? product.dataset.name.toLowerCase()
        : "";
      const title =
        product.querySelector(".product-title")?.textContent.toLowerCase() ||
        "";
      if (name.includes(keyword) || title.includes(keyword))
        product.classList.remove("hidden");
      else product.classList.add("hidden");
    });
  }
  if (searchBtn) searchBtn.addEventListener("click", searchProducts);
  if (searchInput) searchInput.addEventListener("keyup", searchProducts);

  if (formRegister) {
    formRegister.addEventListener("submit", function (e) {
      e.preventDefault();
      const fullName = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      localStorage.setItem("saved_name_" + email, fullName);
      alert(`Đăng ký thành công tài khoản cho: ${fullName}!`);
      if (tabLogin) tabLogin.click();
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const userFullName =
        localStorage.getItem("saved_name_" + email) || "Khách hàng";
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUserName", userFullName);
      if (authTrigger) authTrigger.innerHTML = `🙋‍♂️ Chào, ${userFullName}`;
      alert(`Đăng nhập thành công! Xin chào ${userFullName}.`);
      authModal.classList.remove("open");
    });
  }

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      if (cartArray.length === 0) alert("Giỏ hàng trống!");
      else {
        alert("Đơn hàng của bạn đã được ghi nhận xử lý thành công!");
        cartArray = [];
        updateCartUI();
        cartSidebar.classList.remove("open");
      }
    };
  }
});
