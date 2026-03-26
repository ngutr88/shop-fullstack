const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT =  process.env.PORT || 3000;
const FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readData() {
    try {
        const raw = fs.readFileSync(FILE, "utf8");
        return JSON.parse(raw);
    } catch (error) {
        console.error("Loi doc data.json:", error);
        return {
            users: [],
            products: [],
            orders: [],
            cart: {}
        };
    }
}

function writeData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

function nextId(list) {
    if (!Array.isArray(list) || list.length === 0) return 1;
    return Math.max(...list.map(item => Number(item.id) || 0), 0) + 1;
}

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// ============ XAC THUC & NGUOI DUNG ============

// Dang ky
app.post("/api/register", (req, res) => {
    const { username, email, password, fullName } = req.body;
    const data = readData();

    if (!username || !email || !password || !fullName) {
        return res.status(400).json({
            success: false,
            message: "Vui long nhap day du thong tin"
        });
    }

    if (data.users.some(u => u.username === username)) {
        return res.status(400).json({
            success: false,
            message: "Username da ton tai"
        });
    }

    if (data.users.some(u => u.email === email)) {
        return res.status(400).json({
            success: false,
            message: "Email da ton tai"
        });
    }

    const newUser = {
        id: nextId(data.users),
        username,
        email,
        password,
        fullName,
        role: "customer"
    };

    data.users.push(newUser);
    writeData(data);

    res.json({
        success: true,
        message: "Dang ky thanh cong",
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role
        }
    });
});

// Dang nhap
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const data = readData();

    const user = data.users.find(
        u => u.username === username && u.password === password
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Username hoac password sai"
        });
    }

    res.json({
        success: true,
        message: "Dang nhap thanh cong",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        }
    });
});

// ============ SAN PHAM ============

// Lay tat ca san pham
app.get("/api/products", (req, res) => {
    const data = readData();
    res.json(data.products || []);
});

// Lay chi tiet san pham
app.get("/api/products/:id", (req, res) => {
    const data = readData();
    const productId = Number(req.params.id);
    const product = (data.products || []).find(p => Number(p.id) === productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "San pham khong tim thay"
        });
    }

    res.json(product);
});

// Them san pham
app.post("/api/products", (req, res) => {
    const data = readData();
    const { name, price, description, image, category, stock } = req.body;

    const finalImage = (image && String(image).trim()) || "https://via.placeholder.com/300x300?text=No+Image";

    if (!name || price === undefined || !description || !category) {
        return res.status(400).json({
            success: false,
            message: "Vui long nhap day du thong tin san pham"
        });
    }

    const newProduct = {
        id: nextId(data.products),
        name: String(name).trim(),
        price: toNumber(price, 0),
        description: String(description).trim(),
        image: finalImage,
        category: String(category).trim(),
        stock: toNumber(stock, 0)
    };

    data.products.push(newProduct);
    writeData(data);

    res.json({
        success: true,
        message: "Them san pham thanh cong",
        product: newProduct
    });
});

// Cap nhat san pham
app.put("/api/products/:id", (req, res) => {
    const data = readData();
    const productId = Number(req.params.id);
    const index = (data.products || []).findIndex(p => Number(p.id) === productId);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "San pham khong tim thay"
        });
    }

    const oldProduct = data.products[index];
    const body = req.body || {};

    const updatedProduct = {
        ...oldProduct,
        ...body,
        id: oldProduct.id,
        price: body.price !== undefined ? toNumber(body.price, oldProduct.price) : oldProduct.price,
        stock: body.stock !== undefined ? toNumber(body.stock, oldProduct.stock) : oldProduct.stock
    };

    data.products[index] = updatedProduct;
    writeData(data);

    res.json({
        success: true,
        message: "Cap nhat san pham thanh cong",
        product: updatedProduct
    });
});

// Xoa san pham
app.delete("/api/products/:id", (req, res) => {
    const data = readData();
    const productId = Number(req.params.id);
    const before = data.products.length;

    data.products = (data.products || []).filter(p => Number(p.id) !== productId);

    if (data.products.length === before) {
        return res.status(404).json({
            success: false,
            message: "San pham khong tim thay"
        });
    }

    writeData(data);

    res.json({
        success: true,
        message: "Xoa thanh cong"
    });
});

// ============ DON HANG ============

// Tao don hang
app.post("/api/orders", (req, res) => {
    const { userId, items, totalPrice, shippingAddress, paymentMethod } = req.body;
    const data = readData();

    if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
            success: false,
            message: "Thong tin don hang khong hop le"
        });
    }

    const newOrder = {
        id: nextId(data.orders),
        userId: Number(userId),
        items,
        totalPrice: toNumber(totalPrice, 0),
        shippingAddress: String(shippingAddress).trim(),
        paymentMethod: String(paymentMethod).trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.orders.push(newOrder);
    writeData(data);

    res.json({
        success: true,
        order: newOrder
    });
});

// Lay don hang theo user
app.get("/api/orders/:userId", (req, res) => {
    const data = readData();
    const userId = Number(req.params.userId);
    const orders = (data.orders || []).filter(o => Number(o.userId) === userId);
    res.json(orders);
});

// ============ ADMIN ORDERS ============

// Lay tat ca don hang
app.get("/api/admin/orders", (req, res) => {
    const data = readData();
    res.json(data.orders || []);
});

// Cap nhat trang thai don hang
app.put("/api/admin/orders/:id", (req, res) => {
    const { status } = req.body;
    const data = readData();
    const orderId = Number(req.params.id);
    const index = (data.orders || []).findIndex(o => Number(o.id) === orderId);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Don hang khong tim thay"
        });
    }

    data.orders[index].status = status || data.orders[index].status;
    data.orders[index].updatedAt = new Date().toISOString();
    writeData(data);

    res.json({
        success: true,
        order: data.orders[index]
    });
});

// ============ THANH TOAN ============

app.post("/api/payment", (req, res) => {
    const { orderId, method } = req.body;
    const data = readData();
    const order = (data.orders || []).find(o => Number(o.id) === Number(orderId));

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Don hang khong tim thay"
        });
    }

    order.status = "paid";
    order.paymentMethod = method || order.paymentMethod;
    order.updatedAt = new Date().toISOString();
    writeData(data);

    res.json({
        success: true,
        message: "Thanh toan thanh cong",
        order
    });
});

// ============ THONG KE ADMIN ============

app.get("/api/admin/stats", (req, res) => {
    const data = readData();

    const totalRevenue = (data.orders || [])
        .filter(o => o.status === "paid" || o.status === "delivered")
        .reduce((sum, o) => sum + toNumber(o.totalPrice, 0), 0);

    res.json({
        totalProducts: (data.products || []).length,
        totalUsers: (data.users || []).length,
        totalOrders: (data.orders || []).length,
        totalRevenue,
        pendingOrders: (data.orders || []).filter(o => o.status === "pending").length
    });
});

// ============ ROOT ============

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});



app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại cổng ${PORT}`);
});