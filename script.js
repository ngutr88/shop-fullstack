// ============ GLOBAL STATE ============
let currentUser = null;
let cart = [];
let editingProductId = null;
const API = `${window.location.origin}/api`;
const DEFAULT_PRODUCT_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";

// ============ INITIALIZATION ============
document.addEventListener("DOMContentLoaded", () => {
    loadUser();
    setupEventListeners();
    updateNavigation();
    updateCartCount();
    loadProducts();
});

function setupEventListeners() {
    // Auth
    document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
    document.getElementById("registerForm")?.addEventListener("submit", handleRegister);

    // Navigation
    document.getElementById("homeBtn")?.addEventListener("click", () => showPage("homePage"));
    document.getElementById("productsBtn")?.addEventListener("click", loadProducts);
    document.getElementById("cartBtn")?.addEventListener("click", loadCart);
    document.getElementById("ordersBtn")?.addEventListener("click", () => {
        if (!currentUser) return showPage("loginPage");
        loadOrders();
    });
    document.getElementById("adminBtn")?.addEventListener("click", () => {
        if (!currentUser || currentUser.role !== "admin") {
            alert("Chỉ admin mới có quyền truy cập");
            return;
        }
        loadAdminDashboard();
    });
    document.getElementById("profileBtn")?.addEventListener("click", () => {
        if (!currentUser) return showPage("loginPage");
        loadProfile();
    });
    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
    document.getElementById("loginBtn")?.addEventListener("click", () => showPage("loginPage"));

    // Search
    document.getElementById("searchInput")?.addEventListener("input", searchProducts);
    document.getElementById("topSearchInput")?.addEventListener("input", e => {
        const value = e.target.value;
        const pageSearch = document.getElementById("searchInput");
        if (pageSearch) {
            pageSearch.value = value;
        }
        searchProducts();
    });

    // Checkout
    document.getElementById("checkoutForm")?.addEventListener("submit", handleCheckout);
    document.querySelectorAll("input[name='payment']").forEach(input => {
        input.addEventListener("change", e => {
            const cardPayment = document.getElementById("cardPayment");
            if (cardPayment) {
                cardPayment.style.display = e.target.value === "card" ? "block" : "none";
            }
        });
    });

    // Admin
    document.getElementById("adminProductForm")?.addEventListener("submit", handleAddProduct);
}

// ============ AUTH ============
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Đăng nhập thất bại");
            return;
        }

        currentUser = data.user;
        localStorage.setItem("user", JSON.stringify(currentUser));
        updateNavigation();
        showPage("homePage");
        alert("Đăng nhập thành công!");
    } catch (error) {
        console.error("Login error:", error);
        alert("Lỗi đăng nhập");
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const fullName = document.getElementById("regFullName").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

    if (password !== confirmPassword) {
        alert("Mật khẩu không khớp");
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, fullName, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Đăng ký thất bại");
            return;
        }

        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        document.getElementById("registerForm")?.reset();
        showPage("loginPage");
    } catch (error) {
        console.error("Register error:", error);
        alert("Lỗi đăng ký");
    }
}

function handleLogout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem("user");
    updateNavigation();
    updateCartCount();
    showPage("loginPage");
    alert("Bạn đã đăng xuất");
}

function loadUser() {
    const saved = localStorage.getItem("user");
    if (saved) {
        currentUser = JSON.parse(saved);
    }
}

function updateNavigation() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const profileBtn = document.getElementById("profileBtn");
    const ordersBtn = document.getElementById("ordersBtn");
    const adminBtn = document.getElementById("adminBtn");

    if (!loginBtn || !logoutBtn || !profileBtn || !ordersBtn || !adminBtn) return;

    if (currentUser) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        profileBtn.style.display = "inline-block";
        ordersBtn.style.display = "inline-block";
        adminBtn.style.display = currentUser.role === "admin" ? "inline-block" : "none";
        profileBtn.textContent = `👤 ${currentUser.fullName}`;
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        profileBtn.style.display = "none";
        ordersBtn.style.display = "none";
        adminBtn.style.display = "none";
    }
}

// ============ PAGE MANAGEMENT ============
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.style.display = "none";
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = "block";
        page.classList.add("active");
    }
}

// ============ PRODUCTS ============
async function loadProducts() {
    try {
        const res = await fetch(`${API}/products`);
        const products = await res.json();
        displayProducts(products);
        showPage("productsPage");
    } catch (error) {
        console.error("Error loading products:", error);
        alert("Không tải được sản phẩm");
    }
}

function displayProducts(products) {
    const container = document.getElementById("productsList");
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<div class="empty-message">Chưa có sản phẩm nào</div>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="viewProductDetail(event, ${product.id})">
            <img src="${product.image || DEFAULT_PRODUCT_IMAGE}" alt="${product.name}" class="product-image" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}';">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-stock">Kho: ${product.stock}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart(event, ${product.id})">🛒 Thêm</button>
                    <button class="btn btn-secondary" onclick="viewProductDetail(event, ${product.id})">👁️ Xem</button>
                </div>
            </div>
        </div>
    `).join("");
}

function searchProducts() {
    const query = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const cards = document.querySelectorAll("#productsList .product-card");

    cards.forEach(card => {
        const name = card.querySelector(".product-name")?.textContent.toLowerCase() || "";
        const category = card.querySelector(".product-category")?.textContent.toLowerCase() || "";
        card.style.display = name.includes(query) || category.includes(query) ? "block" : "none";
    });
}

async function viewProductDetail(event, productId) {
    if (event?.stopPropagation) event.stopPropagation();

    try {
        const res = await fetch(`${API}/products/${productId}`);
        const product = await res.json();

        if (!res.ok) {
            alert(product.message || "Không tìm thấy sản phẩm");
            return;
        }

        const detail = document.getElementById("productDetail");
        if (!detail) return;

        detail.innerHTML = `
            <img src="${product.image || DEFAULT_PRODUCT_IMAGE}" alt="${product.name}" class="product-detail-image" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}';">
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                <div class="price">${formatPrice(product.price)}</div>
                <p class="description">${product.description}</p>
                <p><strong>Danh mục:</strong> ${product.category}</p>
                <p><strong>Kho:</strong> ${product.stock}</p>
                <div class="quantity">
                    <label>Số lượng:</label>
                    <input type="number" id="quantityInput" min="1" max="${product.stock}" value="1">
                </div>
                <button class="btn btn-primary" onclick="addToCartDetail(${product.id})">Thêm vào giỏ</button>
            </div>
        `;

        showPage("productDetailPage");
    } catch (error) {
        console.error("Error loading product detail:", error);
        alert("Lỗi tải chi tiết sản phẩm");
    }
}

function addToCart(event, productId) {
    if (event?.stopPropagation) event.stopPropagation();
    addToCartWithQuantity(productId, 1);
}

function addToCartDetail(productId) {
    const quantity = parseInt(document.getElementById("quantityInput")?.value || "1", 10);
    addToCartWithQuantity(productId, quantity);
}

async function addToCartWithQuantity(productId, quantity) {
    try {
        const res = await fetch(`${API}/products/${productId}`);
        const product = await res.json();

        if (!res.ok) {
            alert(product.message || "Không tìm thấy sản phẩm");
            return;
        }

        const item = cart.find(p => p.id === productId);

        if (item) {
            item.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.image,
                quantity: quantity > 0 ? quantity : 1
            });
        }

        updateCartCount();
        alert("Thêm vào giỏ thành công!");
    } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Lỗi thêm vào giỏ");
    }
}

// ============ CART ============
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById("cartCount");
    if (badge) badge.textContent = count;
}

function loadCart() {
    if (!currentUser) {
        showPage("loginPage");
        return;
    }

    const container = document.getElementById("cartItems");
    const empty = document.getElementById("cartEmpty");
    const summary = document.getElementById("cartSummary");

    if (!container || !empty || !summary) return;

    if (cart.length === 0) {
        container.innerHTML = "";
        empty.style.display = "block";
        summary.style.display = "none";
        showPage("cartPage");
        return;
    }

    empty.style.display = "none";
    summary.style.display = "block";

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image || DEFAULT_PRODUCT_IMAGE}" alt="${item.name}" class="cart-item-image" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}';">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)}</p>
            </div>
            <div class="cart-item-actions">
                <input type="number" min="1" value="${item.quantity}" onchange="updateCartItem(${index}, this.value)">
                <button class="btn btn-danger" onclick="removeFromCart(${index})">Xóa</button>
            </div>
        </div>
    `).join("");

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 30000;
    const finalTotal = total + shipping;

    document.getElementById("cartTotal").textContent = formatPrice(total);
    document.getElementById("finalTotal").textContent = formatPrice(finalTotal);

    showPage("cartPage");
}

function updateCartItem(index, quantity) {
    const q = parseInt(quantity, 10);
    cart[index].quantity = q > 0 ? q : 1;
    updateCartCount();
    loadCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    loadCart();
}

function proceedToCheckout() {
    if (!currentUser) {
        showPage("loginPage");
        return;
    }

    if (cart.length === 0) {
        alert("Giỏ hàng trống");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 30000;
    const finalTotal = total + shipping;

    document.getElementById("orderItems").innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} x${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("");

    document.getElementById("orderTotal").textContent = formatPrice(finalTotal);
    document.getElementById("fullName").value = currentUser.fullName || "";
    document.getElementById("email").value = currentUser.email || "";

    showPage("checkoutPage");
}

// ============ CHECKOUT & ORDERS ============
async function handleCheckout(e) {
    e.preventDefault();

    if (!currentUser) {
        showPage("loginPage");
        return;
    }

    if (!cart.length) {
        alert("Giỏ hàng trống!");
        return;
    }

    const address = document.getElementById("address").value.trim();
    const paymentMethod = document.querySelector("input[name='payment']:checked")?.value || "cod";

    try {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + 30000;

        const res = await fetch(`${API}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUser.id,
                items: cart,
                totalPrice: total,
                shippingAddress: address,
                paymentMethod
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Tạo đơn hàng thất bại");
            return;
        }

        if (paymentMethod !== "cod") {
            const payRes = await fetch(`${API}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: data.order.id,
                    amount: total,
                    method: paymentMethod
                })
            });

            const payData = await payRes.json();
            if (!payRes.ok || !payData.success) {
                alert(payData.message || "Thanh toán thất bại");
                return;
            }
        }

        alert("Đặt hàng thành công!");
        cart = [];
        updateCartCount();
        document.getElementById("checkoutForm")?.reset();
        loadOrders();
    } catch (error) {
        console.error("Error processing checkout:", error);
        alert("Lỗi xử lý đơn hàng");
    }
}

async function loadOrders() {
    if (!currentUser) {
        showPage("loginPage");
        return;
    }

    try {
        const res = await fetch(`${API}/orders/${currentUser.id}`);
        const orders = await res.json();

        const container = document.getElementById("ordersList");
        const empty = document.getElementById("ordersEmpty");

        if (!container || !empty) return;

        if (!orders.length) {
            container.innerHTML = "";
            empty.style.display = "block";
        } else {
            empty.style.display = "none";
            container.innerHTML = orders.map(order => `
                <div class="order-card" onclick="viewOrderDetail(${order.id})">
                    <div class="order-header">
                        <span class="order-id">Đơn hàng #${order.id}</span>
                        <span class="order-status ${order.status}">${formatStatus(order.status)}</span>
                        <span>${formatPrice(order.totalPrice)}</span>
                    </div>
                    <div class="order-info">
                        <div><strong>Ngày:</strong> ${new Date(order.createdAt).toLocaleDateString("vi-VN")}</div>
                        <div><strong>Địa chỉ:</strong> ${order.shippingAddress}</div>
                        <div><strong>Thanh toán:</strong> ${formatPaymentMethod(order.paymentMethod)}</div>
                    </div>
                </div>
            `).join("");
        }

        showPage("ordersPage");
    } catch (error) {
        console.error("Error loading orders:", error);
        alert("Lỗi tải đơn hàng");
    }
}

async function viewOrderDetail(orderId) {
    try {
        const res = await fetch(`${API}/orders/${currentUser.id}`);
        const orders = await res.json();
        const order = orders.find(o => Number(o.id) === Number(orderId));

        if (!order) {
            alert("Không tìm thấy đơn hàng");
            return;
        }

        const detail = document.getElementById("orderDetail");
        if (!detail) return;

        detail.innerHTML = `
            <h2>Chi tiết đơn hàng #${order.id}</h2>

            <h3>Thông tin giao hàng</h3>
            <div class="order-info">
                <p><strong>Địa chỉ:</strong> ${order.shippingAddress}</p>
                <p><strong>Phương thức thanh toán:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
                <p><strong>Trạng thái:</strong> <span class="order-status ${order.status}">${formatStatus(order.status)}</span></p>
                <p><strong>Ngày tạo:</strong> ${new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>

            <h3>Các sản phẩm</h3>
            <div class="order-detail-items">
                ${order.items.map(item => `
                    <div class="order-detail-item">
                        <div>${item.name}</div>
                        <div>x${item.quantity}</div>
                        <div>${formatPrice(item.price * item.quantity)}</div>
                    </div>
                `).join("")}
            </div>

            <div class="order-summary">
                <div class="summary-row">
                    <span>Tổng sản phẩm:</span>
                    <span>${formatPrice(order.totalPrice - 30000)}</span>
                </div>
                <div class="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>30.000 đ</span>
                </div>
                <div class="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>${formatPrice(order.totalPrice)}</span>
                </div>
            </div>
        `;

        showPage("orderDetailPage");
    } catch (error) {
        console.error("Error loading order detail:", error);
        alert("Lỗi tải chi tiết đơn hàng");
    }
}

// ============ ADMIN ============
async function loadAdminDashboard() {
    try {
        const res = await fetch(`${API}/admin/stats`);
        const stats = await res.json();

        document.getElementById("statProducts").textContent = stats.totalProducts ?? 0;
        document.getElementById("statUsers").textContent = stats.totalUsers ?? 0;
        document.getElementById("statOrders").textContent = stats.totalOrders ?? 0;
        document.getElementById("statRevenue").textContent = formatPrice(stats.totalRevenue ?? 0);

        switchAdminTab("dashboard");
        showPage("adminPage");
    } catch (error) {
        console.error("Error loading admin dashboard:", error);
        alert("Lỗi tải dashboard admin");
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll(".admin-tab-content").forEach(tab => {
        tab.classList.remove("active");
        tab.style.display = "none";
    });

    document.querySelectorAll(".admin-tab").forEach(btn => btn.classList.remove("active"));

    const tab = document.getElementById(`${tabName}Tab`);
    if (tab) {
        tab.classList.add("active");
        tab.style.display = "block";
    }

    const activeButton = document.querySelector(`button[onclick="switchAdminTab('${tabName}')"]`);
    activeButton?.classList.add("active");

    if (tabName === "products") {
        loadAdminProducts();
    } else if (tabName === "orders") {
        loadAdminOrders();
    }
}

// ============ ADMIN PRODUCT CRUD ============
async function loadAdminProducts() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Chỉ admin mới có quyền truy cập!");
        return;
    }

    try {
        const res = await fetch(`${API}/products`);
        const products = await res.json();

        renderAdminProducts(products);
        showPage("adminPage");
        const productsTab = document.getElementById("productsTab");
        if (productsTab) {
            document.querySelectorAll(".admin-tab-content").forEach(tab => {
                tab.style.display = "none";
                tab.classList.remove("active");
            });
            productsTab.style.display = "block";
            productsTab.classList.add("active");
        }
    } catch (error) {
        console.error("Error loading admin products:", error);
        alert("Lỗi tải sản phẩm admin");
    }
}

function renderAdminProducts(products) {
    const container = document.getElementById("adminProductsList");
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<div class="empty-state">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Giá</th>
                    <th>Danh mục</th>
                    <th>Kho</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td>#${product.id}</td>
                        <td><img src="${product.image}" alt="${product.name}" class="admin-product-thumb"></td>
                        <td class="product-name-cell">
                            <strong>${product.name}</strong>
                            <small>${product.category}</small>
                        </td>
                        <td>${formatPrice(product.price)}</td>
                        <td>${product.category}</td>
                        <td>
                            <span class="stock-badge ${product.stock > 10 ? "in-stock" : product.stock > 0 ? "low-stock" : "out-of-stock"}">
                                ${product.stock}
                            </span>
                        </td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="editProduct(${product.id})">✏️ Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="handleDeleteProduct(${product.id}, event)">🗑️ Xóa</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function setAdminFormHeader(title, buttonText) {
    const formCard = document.getElementById("addProductForm");
    if (!formCard) return;

    const heading = document.getElementById("formTitle") || formCard.querySelector("h3");
    if (heading) heading.textContent = title;

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.textContent = buttonText;
}

function showAddProductForm() {
    editingProductId = null;
    document.getElementById("adminProductForm")?.reset();
    setAdminFormHeader("Thêm sản phẩm mới", "Thêm sản phẩm");

    const form = document.getElementById("addProductForm");
    if (form) form.style.display = "block";

    document.getElementById("prodName")?.focus();
}

function hideAddProductForm() {
    document.getElementById("adminProductForm")?.reset();
    const form = document.getElementById("addProductForm");
    if (form) form.style.display = "none";
    editingProductId = null;
    setAdminFormHeader("Thêm sản phẩm mới", "Thêm sản phẩm");
}

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Lỗi đọc file"));
        reader.readAsDataURL(file);
    });
}

async function handleAddProduct(e) {
    e.preventDefault();

    const name = document.getElementById("prodName")?.value.trim();
    const price = document.getElementById("prodPrice")?.value;
    const category = document.getElementById("prodCategory")?.value.trim();
    const imageUrl = document.getElementById("prodImage")?.value.trim();
    const imageFile = document.getElementById("prodImageFile")?.files?.[0];
    const description = document.getElementById("prodDesc")?.value.trim();
    const stock = document.getElementById("prodStock")?.value;

    if (!name || !price || !category || !description || !stock) {
        alert("Vui lòng điền đầy đủ thông tin sản phẩm");
        return;
    }

    if (!imageUrl && !imageFile) {
        alert("Vui lòng cung cấp URL hình ảnh hoặc upload ảnh từ máy");
        return;
    }

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;

    const imageToUse = imageFile ? await readFileAsDataURL(imageFile) : imageUrl;

    const product = {
        name,
        price: parseInt(price, 10),
        category,
        image: imageToUse,
        description,
        stock: parseInt(stock, 10)
    };

    try {
        let res;

        if (editingProductId) {
            res = await fetch(`${API}/products/${editingProductId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product)
            });
        } else {
            res = await fetch(`${API}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product)
            });
        }

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Lưu sản phẩm thất bại");
            return;
        }

        alert(editingProductId ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
        hideAddProductForm();
        loadAdminProducts();
    } catch (error) {
        console.error("Error saving product:", error);
        alert("Lỗi khi lưu sản phẩm");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function editProduct(productId) {
    try {
        const res = await fetch(`${API}/products/${productId}`);
        const product = await res.json();

        if (!res.ok) {
            alert(product.message || "Không tải được sản phẩm");
            return;
        }

        document.getElementById("prodName").value = product.name || "";
        document.getElementById("prodPrice").value = product.price ?? "";
        document.getElementById("prodCategory").value = product.category || "";
        // Nếu image là dataURL thì không gán vào trường URL, giữ rỗng để tránh overflow.
        document.getElementById("prodImage").value = product.image && product.image.startsWith("data:") ? "" : product.image || "";
        document.getElementById("prodImageFile").value = "";
        document.getElementById("prodDesc").value = product.description || "";
        document.getElementById("prodStock").value = product.stock ?? "";

        editingProductId = productId;
        setAdminFormHeader(`Chỉnh sửa: ${product.name}`, "Cập nhật sản phẩm");

        const form = document.getElementById("addProductForm");
        if (form) form.style.display = "block";

        document.getElementById("prodName")?.focus();
    } catch (error) {
        console.error("Error loading product for edit:", error);
        alert("Lỗi khi tải sản phẩm");
    }
}

async function handleDeleteProduct(productId, event) {
    if (event && event.stopPropagation) event.stopPropagation();

    const confirmed = confirm("Bạn chắc chắn muốn xóa sản phẩm này?");
    if (!confirmed) return;

    try {
        const res = await fetch(`${API}/products/${productId}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Xóa sản phẩm thất bại");
            return;
        }

        alert("Xóa sản phẩm thành công!");

        // Nếu đang chỉnh sửa sản phẩm bị xóa thì reset form.
        if (editingProductId === productId) {
            hideAddProductForm();
        }

        // Cập nhật lại danh sách sản phẩm admin.
        await loadAdminProducts();
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Lỗi khi xóa sản phẩm");
    }
}

// ============ ADMIN ORDERS ============
async function loadAdminOrders() {
    try {
        const res = await fetch(`${API}/admin/orders`);
        const orders = await res.json();

        const container = document.getElementById("adminOrdersList");
        if (!container) return;

        if (!orders.length) {
            container.innerHTML = `<div class="empty-message">Chưa có đơn hàng nào</div>`;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Đơn hàng #${order.id}</span>
                    <span class="order-status ${order.status}">${formatStatus(order.status)}</span>
                    <span>${formatPrice(order.totalPrice)}</span>
                </div>
                <div class="order-info">
                    <div><strong>Khách/User ID:</strong> ${order.userId}</div>
                    <div><strong>Địa chỉ:</strong> ${order.shippingAddress}</div>
                    <div><strong>Ngày:</strong> ${new Date(order.createdAt).toLocaleDateString("vi-VN")}</div>
                </div>
                <select onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="">-- Cập nhật trạng thái --</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="shipped">Đã gửi</option>
                    <option value="delivered">Đã giao</option>
                </select>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error loading admin orders:", error);
        alert("Lỗi tải đơn hàng admin");
    }
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;

    try {
        const res = await fetch(`${API}/admin/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Cập nhật trạng thái thất bại");
            return;
        }

        alert("Cập nhật trạng thái thành công!");
        loadAdminOrders();
    } catch (error) {
        console.error("Error updating order status:", error);
        alert("Lỗi cập nhật trạng thái");
    }
}

// ============ PROFILE ============
function loadProfile() {
    if (!currentUser) {
        showPage("loginPage");
        return;
    }

    const container = document.getElementById("userProfile");
    if (!container) return;

    container.innerHTML = `
        <div class="profile-info">
            <div class="profile-field">
                <label>Tên đăng nhập:</label>
                <span>${currentUser.username}</span>
            </div>
            <div class="profile-field">
                <label>Họ và tên:</label>
                <span>${currentUser.fullName}</span>
            </div>
            <div class="profile-field">
                <label>Email:</label>
                <span>${currentUser.email}</span>
            </div>
            <div class="profile-field">
                <label>Vai trò:</label>
                <span>${currentUser.role === "admin" ? "Quản trị viên" : "Khách hàng"}</span>
            </div>
        </div>
    `;

    showPage("profilePage");
}

// ============ UTILITIES ============
function formatPrice(price) {
    const amount = Number(price) || 0;
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

function formatStatus(status) {
    const map = {
        pending: "⏳ Chờ xử lý",
        paid: "✅ Đã thanh toán",
        shipped: "📦 Đã gửi",
        delivered: "🎉 Đã giao"
    };
    return map[status] || status;
}

function formatPaymentMethod(method) {
    const map = {
        cod: "Thanh toán khi nhận hàng",
        card: "Thẻ tín dụng",
        bank: "Chuyển khoản ngân hàng"
    };
    return map[method] || method;
}