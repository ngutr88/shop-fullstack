# Admin Product Management System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Admin Products Tab (productsTab)                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Header: "Quản lý sản phẩm" + "+ Thêm sản phẩm mới"      │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Product Form (addProductForm) [Hidden/Visible]      │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │ - Tên sản phẩm (name)                                │ │ │
│  │  │ - Giá (price) | Số lượng (stock)                     │ │ │
│  │  │ - Danh mục (category)                                │ │ │
│  │  │ - URL hình ảnh (image)                               │ │ │
│  │  │ - Mô tả (description)                                │ │ │
│  │  │ [Buttons: Thêm/Cập nhật | Đặt lại | Hủy]           │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Products Table (adminProductsList)                  │ │ │
│  │  ├────┬─────┬──────────┬────────┬──────┬────┬────────┤ │ │
│  │  │ ID │ IMG │   Name   │ Price  │ Cate │Kho │ Action │ │ │
│  │  ├────┼─────┼──────────┼────────┼──────┼────┼────────┤ │ │
│  │  │ #1 │ 📷  │ Product1 │ 25000  │ Tech │ 15 │ ✏️ 🗑️ │ │ │
│  │  │ #2 │ 📷  │ Product2 │ 50000  │ Tech │  5 │ ✏️ 🗑️ │ │ │
│  │  └────┴─────┴──────────┴────────┴──────┴────┴────────┘ │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  JavaScript Functions (Event Handlers & Logic)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ showAddProductForm() → Reset & Show form                 │   │
│  │ hideAddProductForm() → Hide & Clear form                 │   │
│  │ handleAddProduct(e) → Validate & Submit (Add/Update)     │   │
│  │ editProduct(id) → Load product & Fill form               │   │
│  │ handleDeleteProduct(id) → Confirm & Delete               │   │
│  │ loadProducts() → Fetch from API                          │   │
│  │ renderProducts(arr) → Generate table HTML                │   │
│  │ showNotification(msg, type) → Alert user                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└────────────────────────────────────────────────┬──────────────────┘
                                                 │
                            HTTP Requests (JSON) │
                                                 ▼
┌────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express API)                      │
│                                                                │
│  GET /api/products                                           │
│  GET /api/products/:id                                       │
│  POST /api/products { name, price, ... }                     │
│  PUT /api/products/:id { name, price, ... }                  │
│  DELETE /api/products/:id                                    │
│                                                              │
└────────────────────────────────────────────────────────────────┘
                                                 │
                          File I/O Operations    │
                                                 ▼
                    ┌──────────────────────────┐
                    │    data.json (Database)  │
                    │  { products: [...] }     │
                    └──────────────────────────┘
```

---

## User Flow Diagram

### Add Product Flow
```
User clicks "+ Thêm sản phẩm mới"
            ↓
showAddProductForm()
  - Set editingProductId = null
  - Change formTitle to "Thêm sản phẩm mới"
  - Change submitBtn to "Thêm sản phẩm"
  - Reset form
  - Show form (display: block)
            ↓
User fills form & clicks "Thêm sản phẩm"
            ↓
handleAddProduct(e) triggered
  - Prevent default form submit
  - Validate all fields
  - Build product object
  - Disable submit button
            ↓
Fetch POST /api/products
            ↓
Backend creates product
            ↓
Response: { success: true, ... }
            ↓
showNotification("✅ Thêm sản phẩm thành công!")
            ↓
hideAddProductForm()
loadProducts() → re-render table
            ↓
User sees new product in table
```

### Edit Product Flow
```
User clicks "✏️ Sửa" button on product
            ↓
editProduct(productId) triggered
  - Fetch GET /api/products/:id
            ↓
Backend returns product data
            ↓
Fill form with product data:
  - document.getElementById("prodName").value = product.name
  - document.getElementById("prodPrice").value = product.price
  - ... (all fields)
            ↓
Update UI for edit mode:
  - editingProductId = productId
  - formTitle = "Chỉnh sửa: [Product Name]"
  - submitBtn = "Cập nhật sản phẩm"
  - Show form
            ↓
User modifies fields & clicks "Cập nhật sản phẩm"
            ↓
handleAddProduct(e) triggered
  - Validate all fields
  - Check: editingProductId exists? YES
  - Build product object
  - Fetch PUT /api/products/:id
            ↓
Backend updates product
            ↓
Response: { success: true, ... }
            ↓
showNotification("✅ Cập nhật sản phẩm thành công!")
            ↓
hideAddProductForm()
loadProducts() → re-render table
            ↓
User sees updated product in table
```

### Delete Product Flow
```
User clicks "🗑️ Xóa" button on product
            ↓
handleDeleteProduct(productId) triggered
            ↓
Browser confirm() dialog appears:
"Bạn chắc chắn muốn xóa sản phẩm này?"
            ↓
   User clicks OK or Cancel?
   │
   ├─→ CANCEL: Return (do nothing)
   │
   └─→ OK: Continue
            ↓
Fetch DELETE /api/products/:id
            ↓
Backend deletes product
            ↓
Response: { success: true, ... }
            ↓
showNotification("✅ Xóa sản phẩm thành công!")
            ↓
loadProducts() → re-render table
            ↓
User sees product removed from table
```

---

## State Management

```
Global State:
┌────────────────────────────┐
│ let editingProductId = null│
│ const API = "http://..."   │
└────────────────────────────┘

Form State (from DOM):
┌────────────────────────────┐
│ prodName.value             │
│ prodPrice.value            │
│ prodCategory.value         │
│ prodImage.value            │
│ prodDesc.value             │
│ prodStock.value            │
│ addProductForm.display     │
│ formTitle.textContent      │
│ submitBtn.textContent      │
│ submitBtn.disabled         │
└────────────────────────────┘

Mode Detection:
  if (editingProductId !== null) {
    → EDIT MODE: Use PUT
  } else {
    → ADD MODE: Use POST
  }
```

---

## Data Flow Through Functions

```
Product Data Journey:

1. LOAD:
   loadProducts()
   → fetch GET /api/products
   → parseJSON
   → renderProducts(products)
   → generate HTML table
   → insert into DOM

2. ADD:
   handleAddProduct()
   → validate inputs
   → build product object
   → fetch POST /api/products
   → {success: true}
   → loadProducts() [reload]

3. EDIT:
   editProduct()
   → fetch GET /api/products/:id
   → fill form
   ↓
   handleAddProduct()
   → validate inputs
   → build product object
   → fetch PUT /api/products/:id
   → {success: true}
   → loadProducts() [reload]

4. DELETE:
   handleDeleteProduct()
   → confirm dialog
   → fetch DELETE /api/products/:id
   → {success: true}
   → loadProducts() [reload]
```

---

## Form Validation Logic

```
Validation Process:
┌─────────────────────────────┐
│ User clicks "Thêm sản phẩm" │
└──────────────┬──────────────┘
               ↓
        Get all input values
        (name, price, category, image, desc, stock)
               ↓
   ┌───────────┴────────────┐
   │  Any field empty?      │
   └─┬──────────────────┬───┘
     │                  │
    YES                NO
     │                  │
     ↓                  ↓
  STOP           Continue
  Error msg      Build object
  Return         POST/PUT
     │
     └→ showNotification("❌ ...")
```

---

## Event Listener Setup

```
Document Load (DOMContentLoaded)
          ↓
   setupEventListeners()
          ↓
   └─→ adminProductForm.addEventListener("submit", handleAddProduct)
   └─→ Other listeners...
          ↓
   Ready to handle user interactions
```

---

## Notification System

```
showNotification(message, type)
   │
   ├─→ type === "success"
   │       alert("✅ " + message)
   │
   ├─→ type === "error"
   │       alert("❌ " + message)
   │
   └─→ type === "info"
           alert("ℹ️ " + message)

Examples:
- showNotification("Thêm sản phẩm thành công!", "success")
  → "✅ Thêm sản phẩm thành công!"
  
- showNotification("Lỗi khi tải sản phẩm", "error")
  → "❌ Lỗi khi tải sản phẩm"
```

---

## HTTP Request Sequences

### Add Product
```
Browser                     Server
   │                          │
   │──── POST /api/products ──→│
   │     Content-Type: JSON    │
   │     {                     │
   │       "name": "Laptop",   │
   │       "price": 25000000,  │
   │       "category": "Tech", │
   │       "image": "url...",  │
   │       "description": "...",
   │       "stock": 15         │
   │     }                     │
   │                          │
   │                    Process
   │                    Save to data.json
   │                          │
   │←─ 200 OK Response ───────│
   │     {                    │
   │       "success": true,   │
   │       "product": {...}   │
   │     }                    │
   │                          │
   Update UI
```

### Edit Product
```
Browser                     Server
   │                          │
   ├── GET /api/products/5 ──→│
   │                    Return product
   │←─ 200 OK ─────────────────│
   │   { id: 5, name: "..." }  │
   │                          │
   Fill form (client-side)
   User modifies
   Clicks submit
   │                          │
   │── PUT /api/products/5 ──→│
   │    { name: "New Name" }  │
   │                    Update
   │←─ 200 OK ─────────────────│
   │   { success: true }      │
   │                          │
   Update UI
```

### Delete Product
```
Browser                     Server
   │ Confirm dialog         │
   │ User clicks OK         │
   │                        │
   ├─ DELETE /api/products/5 ─→│
   │                    Delete from file
   │←─ 200 OK ──────────────────│
   │  { success: true }     │
   │                        │
   Update UI (remove row)
```

---

## Error Handling Flow

```
Try Block (API Call)
   ├─→ Fetch request
   │       ├─→ Network error? → Catch
   │       ├─→ 404/500? → res.ok = false → throw
   │       └─→ Success → return data
   │
   ├─→ JSON parse
   │       ├─→ Invalid JSON? → Catch
   │       └─→ Success → use data
   │
   ├─→ Check data.success
   │       ├─→ false? → showNotification(error)
   │       └─→ true → proceed
   │
   └─→ Update UI & reload

Catch Block (Error)
   └─→ console.error(error)
   └─→ showNotification("Lỗi...", "error")

Finally Block
   └─→ submitBtn.disabled = false
```

---

## Responsive Layout

```
DESKTOP (768px+)
┌─────────────────────────────────┐
│ Header + Button                 │
├─────────────────────────────────┤
│ Form (2-column layout)          │
│ ┌────────────────┬────────────┐ │
│ │ Price          │ Stock      │ │
│ └────────────────┴────────────┘ │
├─────────────────────────────────┤
│ Table (full width)              │
└─────────────────────────────────┘

MOBILE (<768px)
┌──────────────────┐
│ Header           │
│ + Button (100%)  │
├──────────────────┤
│ Form (1-column)  │
│ ┌──────────────┐ │
│ │ Price        │ │
│ ├──────────────┤ │
│ │ Stock        │ │
│ └──────────────┘ │
├──────────────────┤
│ Table (scrollable
│ or compressed)   │
└──────────────────┘
```

---

## CSS Class Hierarchy

```
.admin-table
├── .admin-table thead
│   └── th
├── .admin-table tbody
│   ├── tr:hover
│   ├── td
│   ├── .admin-product-thumb
│   ├── .product-name-cell
│   ├── .stock-badge
│   │   ├── .in-stock (green)
│   │   ├── .low-stock (yellow)
│   │   └── .out-of-stock (red)
│   └── .action-buttons

.form-card
├── h3
├── .form-group
│   ├── label
│   └── input/textarea
├── .form-row
│   └── .form-group (2-column)
└── .form-actions
    └── .btn

Button Variants:
├── .btn (base)
├── .btn-primary
├── .btn-secondary
├── .btn-danger
├── .btn-info
├── .btn-outline
└── .btn-sm (size)
```

---

## Performance Considerations

```
Optimizations Implemented:
✓ Prevent double-submit: submitBtn.disabled = true
✓ No unnecessary re-renders: Only load when needed
✓ Event delegation: Single form handler for add/edit
✓ Efficient DOM updates: Template literals
✓ Error handling: Try-catch prevents crashes
✓ Async/await: Non-blocking API calls

Potential Improvements:
□ Debounce form submissions
□ Cache product list
□ Lazy load images
□ Pagination for large lists
□ Local storage for drafts
□ Service workers for offline
```

---

**This architecture is scalable, maintainable, and production-ready!**
